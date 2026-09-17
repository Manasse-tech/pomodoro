import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
// Format CSV établi côté client (Date;Nom;Email;Sujet;Message;Lu;Archivé, séparateur « ; »,
// champs quotés) — réutilisé à l'identique pour l'export serveur.
import { messagesToCsv } from "@/lib/focusly/csv";
import { todayKey } from "@/lib/focusly/types";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation (zod) — messages en français                             */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
  name: z
    .string({ error: "Le nom est requis." })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  email: z
    .string({ error: "L'email est requis." })
    .trim()
    .max(200, "L'email ne peut pas dépasser 200 caractères.")
    .email("Adresse email invalide."),
  subject: z
    .string()
    .trim()
    .max(150, "Le sujet ne peut pas dépasser 150 caractères.")
    .optional()
    .default(""),
  message: z
    .string({ error: "Le message est requis." })
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères.")
    .max(5000, "Le message ne peut pas dépasser 5000 caractères."),
  consent: z.literal(true, {
    error: "Vous devez accepter l'utilisation de vos données.",
  }),
  // Honeypot anti-spam : doit rester vide (rempli par les bots uniquement)
  website: z.string().optional(),
});

export type ContactPayload = z.infer<typeof contactSchema>;

/* ------------------------------------------------------------------ */
/* Rate limit mémoire : 5 soumissions / 15 min par IP                  */
/* ------------------------------------------------------------------ */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const submissions = new Map<string, number[]>();
/** Failed admin-key attempts per IP (brute-force guard) */
const adminFails = new Map<string, number[]>();

const ADMIN_KEY = process.env.ADMIN_KEY ?? "focusly-admin";
const ADMIN_FAIL_MAX = 10;
const ADMIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissions.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    submissions.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  submissions.set(ip, timestamps);

  // Nettoyage périodique pour éviter une croissance indéfinie de la Map
  if (submissions.size > 1000) {
    for (const [key, times] of submissions) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        submissions.delete(key);
      }
    }
  }

  return false;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}

/* ------------------------------------------------------------------ */
/* Administration : garde-fou anti-force brute sur la clé              */
/* ------------------------------------------------------------------ */

function isAdminBlocked(ip: string): boolean {
  const now = Date.now();
  const fails = (adminFails.get(ip) ?? []).filter(
    (t) => now - t < ADMIN_FAIL_WINDOW_MS,
  );
  adminFails.set(ip, fails);
  return fails.length >= ADMIN_FAIL_MAX;
}

function recordAdminFail(ip: string) {
  const fails = (adminFails.get(ip) ?? []).filter(
    (t) => Date.now() - t < ADMIN_FAIL_WINDOW_MS,
  );
  fails.push(Date.now());
  adminFails.set(ip, fails);
}

function isAdmin(request: Request, ip: string): boolean {
  if (isAdminBlocked(ip)) return false;
  const key =
    request.headers.get("x-admin-key") ??
    new URL(request.url).searchParams.get("adminKey") ??
    "";
  if (key.length > 0 && key === ADMIN_KEY) return true;
  recordAdminFail(ip);
  return false;
}

/* ------------------------------------------------------------------ */
/* POST /api/contact                                                   */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 },
    );
  }

  // Honeypot : si le champ caché « website » est rempli, c'est un bot.
  // On renvoie OK sans rien enregistrer (abandon silencieux).
  const maybeWebsite =
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof (body as { website?: unknown }).website === "string"
      ? (body as { website: string }).website
      : "";

  if (maybeWebsite.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Rate limit par IP
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessayez plus tard." },
      { status: 429 },
    );
  }

  // Validation
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const firstMessage =
      parsed.error.issues[0]?.message ?? "Formulaire invalide.";
    return NextResponse.json({ error: firstMessage }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const created = await db.contactMessage.create({
      data: {
        name,
        email,
        subject: subject.length > 0 ? subject : null,
        message,
      },
    });
    // Colonne `search` (ajoutée au schéma après la génération du client mis en
    // cache par le serveur de dev) : écrite en SQL brut avec paramètres liés —
    // voir la note au-dessus de selectContactPage. En cas d'échec, le message
    // reste créé : le backfill paresseux du GET réparera la ligne (search IS
    // NULL) au prochain chargement de l'admin.
    try {
      await db.$executeRaw`
        UPDATE "ContactMessage"
        SET "search" = ${buildSearchValue({ name, email, subject, message, reply: null })}
        WHERE "id" = ${created.id}
      `;
    } catch (searchError) {
      console.error("[/api/contact] Échec d'indexation search :", searchError);
    }
    return NextResponse.json({ ok: true, id: created.id }, { status: 200 });
  } catch (error) {
    console.error("[/api/contact] Échec d'enregistrement :", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* Lecture des messages en SQL brut ($queryRaw / $executeRaw) pour     */
/* les colonnes reply/repliedAt : le serveur de dev peut conserver un  */
/* client Prisma généré avant le dernier db:push (instance mise en     */
/* cache sur globalThis dans src/lib/db.ts). Le SQL brut fonctionne    */
/* identiquement avec toutes les générations du client.                */
/* ------------------------------------------------------------------ */

/** Nombre de messages par page par défaut (pagination de l'admin). */
const DEFAULT_PAGE_SIZE = 25;
/** Bornes de la pagination : 1 message minimum, 100 maximum par page. */
const MAX_PAGE_SIZE = 100;
/** Longueur maximale d'une réponse, alignée sur la limite d'un message. */
const REPLY_MAX_LENGTH = 5000;

/** Colonnes telles que nommées dans SQLite (sans @map, le champ Prisma = la colonne). */
const CONTACT_SELECT = `
  SELECT "id", "name", "email", "subject", "message", "read", "archived", "reply", "repliedAt", "createdAt"
  FROM "ContactMessage"
`;

interface RawContactRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: number | boolean;
  archived: number | boolean;
  reply: string | null;
  repliedAt: unknown;
  createdAt: unknown;
}

/** Convertit une valeur date renvoyée par SQLite (Date ou texte ISO) en chaîne ISO, ou null. */
function toIsoOrNull(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

/** Normalise une ligne brute SQLite vers la forme JSON exposée par l'API. */
function mapContactRow(row: RawContactRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject ?? null,
    message: row.message,
    read: Number(row.read) !== 0,
    archived: Number(row.archived) !== 0,
    reply: typeof row.reply === "string" ? row.reply : null,
    repliedAt: toIsoOrNull(row.repliedAt),
    createdAt: toIsoOrNull(row.createdAt) ?? new Date(0).toISOString(),
  };
}

/** Entier positif depuis une query string, avec valeur de repli et bornes. */
function positiveIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/** Longueur maximale de la recherche serveur (?q=). */
const MAX_QUERY_LENGTH = 100;

/** Filtres de la liste admin (?filter=) — toute valeur inconnue retombe sur « actifs ». */
type ContactFilter = "actifs" | "non-lus" | "archives";

function parseFilterParam(value: string | null): ContactFilter {
  if (value === "non-lus" || value === "archives") return value;
  return "actifs";
}

/** Échappe les jokers LIKE (%, _) et l'échappement \ → recherche littérale (clause ESCAPE '\'). */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Pliage accent-insensible (fold) : décomposition canonique NFD → suppression
 * des signes diacritiques combinants (é → e, à → a, ç → c, ü → u…) → minuscules.
 *
 * ⚠️ Cohérence contractuelle : cette fonction est utilisée À L'IDENTIQUE pour
 * (1) l'INDEXATION — remplissage de la colonne `search` à chaque écriture
 * (POST, PATCH reply/read/archive, backfill) — et (2) la REQUÊTE — pliage de
 * ?q= dans buildWhereClause. Une seule implémentation partagée par les deux
 * chemins garantit que l'index et la requête ne peuvent jamais diverger.
 *
 * Limitation assumée : les ligatures non décomposables par NFD (œ, æ) sont
 * conservées telles quelles — « cœur » trouvera « Cœur » (casse pliée) mais
 * pas la variante « coeur ».
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Valeur de la colonne `search` : concaténation pliée des champs textuels du
 * message (reply inclus — répondre met l'index à jour). Les champs optionnels
 * absents (subject / reply) comptent pour une chaîne vide.
 */
function buildSearchValue(parts: {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  reply?: string | null;
}): string {
  return fold(
    [parts.name, parts.email, parts.subject ?? "", parts.message, parts.reply ?? ""].join(" "),
  );
}

/**
 * Backfill paresseux de la colonne `search` : les lignes insérées avant la
 * migration (search IS NULL) sont recalculées en JS (fold) puis écrites en
 * $executeRaw, au premier GET qui les détecte.
 *
 * Garde anti-travail inutile : le SELECT … WHERE search IS NULL EST la garde —
 * une fois toutes les lignes renseignées, chaque GET ne paie qu'une lecture
 * vide (table de boîte de contact, quelques centaines de lignes max) et le
 * backfill ne réécrit jamais une ligne déjà indexée. Il est aussi auto-réparant
 * (une ligne NULL insérée par un chemin externe est rattrapée). Idempotent en
 * cas de GET concurrents : deux écritures du même fold sont identiques.
 * Une erreur n'interrompt JAMAIS le GET (journalisée, retentée au GET suivant).
 */
async function ensureSearchBackfill(): Promise<void> {
  try {
    const pending = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        email: string;
        subject: string | null;
        message: string;
        reply: string | null;
      }>
    >`
      SELECT "id", "name", "email", "subject", "message", "reply"
      FROM "ContactMessage"
      WHERE "search" IS NULL
    `;
    for (const row of pending) {
      await db.$executeRaw`
        UPDATE "ContactMessage"
        SET "search" = ${buildSearchValue(row)}
        WHERE "id" = ${row.id}
      `;
    }
  } catch (error) {
    console.error("[/api/contact] Backfill de la colonne search impossible :", error);
  }
}

/**
 * Clause WHERE partagée par la liste paginée, le compteur « total » et l'export CSV :
 * filtre (actifs / non-lus / archives) + recherche plein texte ?q= sur la
 * colonne `search` (concaténation pliée de name + email + subject + message + reply).
 *
 * Recherche : la requête est pliée avec le MÊME fold() que l'indexation (NFD →
 * diacritiques retirés → minuscules) puis comparée LIKE à la colonne `search` —
 * la recherche est désormais ACCENT-INSENSIBLE (« reponse » trouve « réponse »,
 * « REUNION » trouve « réunion ») et insensible à la casse. Les jokers LIKE du
 * user (%, _) sont neutralisés (ESCAPE '\') pour une recherche littérale.
 */
function buildWhereClause(filter: ContactFilter, query: string): Prisma.Sql {
  const chunks: Prisma.Sql[] = [];
  if (filter === "non-lus") {
    chunks.push(Prisma.sql`"archived" = 0 AND "read" = 0`);
  } else if (filter === "archives") {
    chunks.push(Prisma.sql`"archived" = 1`);
  } else {
    chunks.push(Prisma.sql`"archived" = 0`);
  }
  const needle = fold(query.trim());
  if (needle.length > 0) {
    const pattern = `%${escapeLikePattern(needle)}%`;
    chunks.push(Prisma.sql`"search" LIKE ${pattern} ESCAPE '\\'`);
  }
  return Prisma.sql` WHERE ${Prisma.join(chunks, " AND ")}`;
}

/** Page de messages filtrée (les plus récents d'abord). */
async function selectContactPage(page: number, pageSize: number, where: Prisma.Sql) {
  const rows = await db.$queryRaw<RawContactRow[]>`
    ${Prisma.raw(CONTACT_SELECT)}
    ${where}
    ORDER BY "createdAt" DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `;
  return rows.map(mapContactRow);
}

/** Tous les messages filtrés, sans limite de pagination (export CSV). */
async function selectAllContacts(where: Prisma.Sql) {
  const rows = await db.$queryRaw<RawContactRow[]>`
    ${Prisma.raw(CONTACT_SELECT)}
    ${where}
    ORDER BY "createdAt" DESC
  `;
  return rows.map(mapContactRow);
}

/** Comptage filtré en SQL brut (même WHERE que la liste et l'export). */
async function countContacts(where: Prisma.Sql): Promise<number> {
  const rows = await db.$queryRaw<Array<{ n: number | bigint }>>`
    SELECT COUNT(*) AS "n" FROM "ContactMessage" ${where}
  `;
  return Number(rows[0]?.n ?? 0);
}

/** Relit un message par son id (null si introuvable). */
async function selectContactById(id: string) {
  const rows = await db.$queryRaw<RawContactRow[]>`
    ${Prisma.raw(CONTACT_SELECT)}
    WHERE "id" = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapContactRow(row) : null;
}

/* ------------------------------------------------------------------ */
/* GET /api/contact — liste paginée + recherche + filtre (back-office, protégé)      */
/* ?page=1&pageSize=25&filter=actifs&q=… → { items, total, page, pageSize, unread }   */
/* ?format=csv → export CSV de TOUTES les lignes correspondant à q + filter           */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isAdminBlocked(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }
  if (!isAdmin(request, ip)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const requestedPage = positiveIntParam(params.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = positiveIntParam(params.get("pageSize"), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  // Recherche ?q= : trim + plafonnée à 100 caractères, puis pliée par
  // buildWhereClause avec le même fold() que l'indexation (accent-insensible).
  const query = (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const filter = parseFilterParam(params.get("filter"));

  try {
    // Répare les lignes antérieures à la colonne `search` (search IS NULL)
    // AVANT toute lecture filtrée — no-op tant que tout est indexé.
    await ensureSearchBackfill();
    const where = buildWhereClause(filter, query);
    const [filteredTotal, unread] = await Promise.all([
      // `total` = messages correspondant au filtre + à la recherche (la pagination
      // et l'export portent sur l'ensemble filtré, pas seulement la page courante).
      countContacts(where),
      // Compteur « non lus » = compteur GLOBAL des messages actifs non lus,
      // indépendant de ?q= et ?filter= (sémantique conservée pour le badge d'en-tête).
      db.contactMessage.count({ where: { read: false, archived: false } }),
    ]);

    // Export CSV : TOUTES les lignes correspondant à q + filter, hors pagination.
    if (params.get("format") === "csv") {
      const allRows = await selectAllContacts(where);
      // BOM UTF-8 : Excel reconnaît ainsi l'encodage et le séparateur « ; ».
      const csv = `\uFEFF${messagesToCsv(allRows)}`;
      const filename = `focusly-messages-${todayKey()}.csv`;
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // La page demandée est ramenée dans les bornes valides.
    const pageCount = Math.max(1, Math.ceil(filteredTotal / pageSize));
    const page = Math.min(requestedPage, pageCount);
    const items = await selectContactPage(page, pageSize, where);
    // `messages` : alias rétrocompatible de `items`.
    return NextResponse.json(
      { ok: true, items, total: filteredTotal, page, pageSize, unread, messages: items },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/contact] Échec de lecture :", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/contact — lu/non lu, archiver/restaurer, répondre (protégé) */
/* ------------------------------------------------------------------ */

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  if (isAdminBlocked(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }
  if (!isAdmin(request, ip)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }

  let body: {
    id?: unknown;
    read?: unknown;
    archived?: unknown;
    reply?: unknown;
    markAllRead?: unknown;
  };
  try {
    body = (await request.json()) as {
      id?: unknown;
      read?: unknown;
      archived?: unknown;
      reply?: unknown;
      markAllRead?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { id, read, archived, reply } = body;

  // Action globale « tout marquer comme lu » : prioritaire sur toute autre
  // clé du corps (id / read / archived / reply ignorés) — marque TOUS les
  // messages non archivés comme lus. read/archived sont des colonnes connues
  // du client périmé : updateMany typé possible (pas de SQL brut nécessaire).
  // La sémantique de reply reste inchangée (aucune écriture de reply ici).
  if (body.markAllRead === true) {
    try {
      const result = await db.contactMessage.updateMany({
        where: { archived: false, read: false },
        data: { read: true },
      });
      // Après un « tout lire », plus aucun actif non lu par construction.
      return NextResponse.json(
        { ok: true, updated: result.count, unread: 0 },
        { status: 200 },
      );
    } catch (error) {
      console.error("[/api/contact] Échec du marquage global comme lu :", error);
      return NextResponse.json(
        { error: "Erreur serveur. Réessayez." },
        { status: 500 },
      );
    }
  }
  const hasRead = typeof read === "boolean";
  const hasArchived = typeof archived === "boolean";
  const hasReply = typeof reply === "string";
  const trimmedReply = hasReply ? reply.trim() : "";

  if (hasReply && (trimmedReply.length === 0 || trimmedReply.length > REPLY_MAX_LENGTH)) {
    return NextResponse.json(
      { error: `La réponse doit contenir entre 1 et ${REPLY_MAX_LENGTH} caractères.` },
      { status: 400 },
    );
  }
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    (!hasRead && !hasArchived && !hasReply)
  ) {
    return NextResponse.json(
      {
        error:
          "Paramètres invalides (id requis, read, archived ou reply requis).",
      },
      { status: 400 },
    );
  }

  // Réponse à un message : on enregistre le texte, on date la réponse et on
  // marque le message comme lu (répondre implique l'avoir lu). Écriture en SQL
  // brut volontaire — voir la note au-dessus de selectContactPage. La colonne
  // `search` est réindexée dans le MÊME UPDATE (le texte de la réponse fait
  // partie de l'index de recherche) — pliage calculé depuis la ligne relue
  // AVANT l'écriture (jamais depuis un objet typé : le client périmé omet reply).
  if (hasReply) {
    const nextRead = hasRead ? read : true;
    try {
      const existing = await selectContactById(id);
      if (!existing) {
        return NextResponse.json(
          { error: "Message introuvable." },
          { status: 404 },
        );
      }
      const searchValue = buildSearchValue({
        name: existing.name,
        email: existing.email,
        subject: existing.subject,
        message: existing.message,
        reply: trimmedReply,
      });
      const affected = await db.$executeRaw`
        UPDATE "ContactMessage"
        SET "reply" = ${trimmedReply}, "repliedAt" = ${new Date().toISOString()}, "read" = ${nextRead ? 1 : 0}, "search" = ${searchValue}
        WHERE "id" = ${id}
      `;
      if (affected === 0) {
        return NextResponse.json(
          { error: "Message introuvable." },
          { status: 404 },
        );
      }
      const message = await selectContactById(id);
      return NextResponse.json({ ok: true, message }, { status: 200 });
    } catch (error) {
      console.error("[/api/contact] Échec d'enregistrement de la réponse :", error);
      return NextResponse.json(
        { error: "Erreur serveur. Réessayez." },
        { status: 500 },
      );
    }
  }

  // On met à jour uniquement les champs fournis (read et/ou archived).
  // Chemin typé conservé (colonnes connues du client périmé) ; `search` ne
  // dépend pas de read/archived mais on la réécrit quand même, pliée depuis
  // une relecture BRUTE complète — l'objet renvoyé par le client périmé omet
  // reply, recalculer depuis lui écraserait l'index avec un reply manquant.
  // Bonus : ce passage réindexe aussi une ligne restée sans search.
  const data: { read?: boolean; archived?: boolean } = {};
  if (hasRead) data.read = read;
  if (hasArchived) data.archived = archived;

  try {
    const existing = await selectContactById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Message introuvable." },
        { status: 404 },
      );
    }
    const updated = await db.contactMessage.update({
      where: { id },
      data,
    });
    try {
      await db.$executeRaw`
        UPDATE "ContactMessage"
        SET "search" = ${buildSearchValue(existing)}
        WHERE "id" = ${id}
      `;
    } catch (searchError) {
      console.error("[/api/contact] Échec de réindexation search :", searchError);
    }
    return NextResponse.json({ ok: true, message: updated }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Message introuvable." },
      { status: 404 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* DELETE /api/contact?id=… — supprimer un message (protégé)           */
/* ------------------------------------------------------------------ */

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  if (isAdminBlocked(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }
  if (!isAdmin(request, ip)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json(
      { error: "Paramètre id requis." },
      { status: 400 },
    );
  }

  try {
    await db.contactMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Message introuvable." },
      { status: 404 },
    );
  }
}
