import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

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
/* GET /api/contact — liste des messages (mini back-office, protégé)   */
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

  try {
    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json({ ok: true, messages }, { status: 200 });
  } catch (error) {
    console.error("[/api/contact] Échec de lecture :", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/contact — lu/non lu, archiver/restaurer (protégé)        */
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

  let body: { id?: unknown; read?: unknown; archived?: unknown };
  try {
    body = (await request.json()) as {
      id?: unknown;
      read?: unknown;
      archived?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { id, read, archived } = body;
  const hasRead = typeof read === "boolean";
  const hasArchived = typeof archived === "boolean";
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    (!hasRead && !hasArchived)
  ) {
    return NextResponse.json(
      {
        error:
          "Paramètres invalides (id requis, read ou archived booléen requis).",
      },
      { status: 400 },
    );
  }

  // On met à jour uniquement les champs fournis (read et/ou archived).
  const data: { read?: boolean; archived?: boolean } = {};
  if (hasRead) data.read = read;
  if (hasArchived) data.archived = archived;

  try {
    const updated = await db.contactMessage.update({
      where: { id },
      data,
    });
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
