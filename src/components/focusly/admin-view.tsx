"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Loader2,
  Lock,
  Mail,
  MailOpen,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile, messagesToCsv } from "@/lib/focusly/csv";
import { frDateTime, todayKey } from "@/lib/focusly/types";

import { Breadcrumb } from "./content/breadcrumb";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

/** sessionStorage key — holds the admin key for the current tab only. */
const STORAGE_KEY = "focusly.adminKey";

type AdminFilter = "actifs" | "non-lus" | "archives";

const FILTERS: Array<{ value: AdminFilter; label: string }> = [
  { value: "actifs", label: "Actifs" },
  { value: "non-lus", label: "Non lus" },
  { value: "archives", label: "Archivés" },
];

/** Nombre de messages par page (pagination serveur via ?page=&pageSize=). */
const PAGE_SIZE = 25;

/** Longueur maximale d'une réponse, alignée sur la limite d'un message. */
const REPLY_MAX_LENGTH = 5000;

/** Case-insensitive + accent-insensitive fold (same pattern as blog-view). */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Normalise un message renvoyé par l'API (champs optionnels → valeurs sûres). */
function normalizeMsg(m: ContactMsg): ContactMsg {
  return {
    ...m,
    read: m.read ?? false,
    archived: m.archived ?? false,
    reply: m.reply ?? null,
    repliedAt: m.repliedAt ?? null,
  };
}

/** Brouillon de réponse pré-rempli (français) — le « … » est à personnaliser. */
function buildReplyTemplate(msg: ContactMsg): string {
  return [
    `Bonjour ${msg.name},`,
    "",
    "Merci pour votre message. …",
    "",
    "Cordialement,",
    "L’équipe Focusly",
  ].join("\n");
}

/** Lien mailto pré-rempli avec la réponse éditée — le client de messagerie prend le relais. */
function buildMailtoHref(msg: ContactMsg, body: string): string {
  const subject = `RE: ${msg.subject ?? "Votre message Focusly"}`;
  return `mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function AdminView() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AdminFilter>("actifs");
  const [query, setQuery] = useState("");
  /* Pagination serveur */
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [unreadCount, setUnreadCount] = useState(0);
  /* Réponse aux messages */
  const [replyTarget, setReplyTarget] = useState<ContactMsg | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Visible list = filter chip (archived first) then accent-insensitive search */
  const visible = useMemo(() => {
    const base =
      filter === "archives"
        ? messages.filter((m) => m.archived)
        : filter === "non-lus"
          ? messages.filter((m) => !m.archived && !m.read)
          : messages.filter((m) => !m.archived);
    const needle = fold(query.trim());
    if (!needle) return base;
    return base.filter(
      (m) =>
        fold(m.name).includes(needle) ||
        fold(m.email).includes(needle) ||
        fold(m.subject ?? "").includes(needle) ||
        fold(m.message).includes(needle),
    );
  }, [messages, filter, query]);

  /* Restore a previously unlocked key (same tab only) */
  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) setAdminKey(stored);
  }, []);

  const loadMessages = useCallback(async (key: string, targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (res.status === 401) {
          // The stored key is no longer valid → back to the gate
          window.sessionStorage.removeItem(STORAGE_KEY);
          setAdminKey(null);
          setGateError("Clé incorrecte.");
          return;
        }
        toast.error(data?.error ?? "Erreur réseau.");
        return;
      }
      const data = (await res.json()) as {
        items?: ContactMsg[];
        total?: number;
        page?: number;
        pageSize?: number;
        unread?: number;
      };
      const items = (data.items ?? []).map(normalizeMsg);
      setMessages(items);
      setTotal(typeof data.total === "number" ? data.total : items.length);
      setPageSize(typeof data.pageSize === "number" ? data.pageSize : PAGE_SIZE);
      setUnreadCount(typeof data.unread === "number" ? data.unread : 0);
      // Le serveur ramène la page demandée dans les bornes valides.
      if (typeof data.page === "number" && data.page !== targetPage) {
        setPage(data.page);
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load (or reload) the messages whenever the key or the page changes */
  useEffect(() => {
    if (adminKey) void loadMessages(adminKey, page);
  }, [adminKey, page, loadMessages]);

  /* ----- Gate: validate the key then remember it for the tab ----- */
  const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const k = entered.trim();
    if (k.length === 0) {
      setGateError("Veuillez saisir la clé d’administration.");
      return;
    }
    setUnlocking(true);
    setGateError(null);
    try {
      const res = await fetch(`/api/contact?page=1&pageSize=${PAGE_SIZE}`, {
        headers: { "x-admin-key": k },
        cache: "no-store",
      });
      if (res.ok) {
        window.sessionStorage.setItem(STORAGE_KEY, k);
        setAdminKey(k);
        setPage(1);
        setEntered(""); // never keep the key in the DOM
      } else if (res.status === 401) {
        setGateError("Clé incorrecte.");
      } else if (res.status === 429) {
        setGateError("Trop de tentatives, réessayez plus tard.");
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setGateError(data?.error ?? "Erreur réseau.");
      }
    } catch {
      setGateError("Erreur réseau.");
    } finally {
      setUnlocking(false);
    }
  };

  /* ----- Sign out: clear the key from storage and state ----- */
  const handleSignOut = () => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey(null);
    setMessages([]);
    setEntered("");
    setGateError(null);
    setFilter("actifs");
    setQuery("");
    setPage(1);
    setTotal(0);
    setUnreadCount(0);
    setReplyTarget(null);
    setReplyDraft("");
  };

  /* ----- Toggle read state (optimistic, reverted on failure) ----- */
  const toggleRead = async (msg: ContactMsg) => {
    const next = !msg.read;
    setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, read: next } : m)));
    // Le compteur « non lus » ne compte que les messages actifs (non archivés).
    if (!msg.archived) setUnreadCount((c) => Math.max(0, c + (next ? -1 : 1)));
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey ?? "",
        },
        body: JSON.stringify({ id: msg.id, read: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Erreur réseau.");
      }
      toast.success("Message mis à jour.");
    } catch (err) {
      setMessages((ms) =>
        ms.map((m) => (m.id === msg.id ? { ...m, read: msg.read } : m)),
      );
      if (!msg.archived) setUnreadCount((c) => Math.max(0, c + (msg.read ? -1 : 1)));
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    }
  };

  /* ----- Archive / restore (optimistic, reverted on failure) ----- */
  const toggleArchived = async (msg: ContactMsg) => {
    const next = !msg.archived;
    setMessages((ms) =>
      ms.map((m) => (m.id === msg.id ? { ...m, archived: next } : m)),
    );
    // Archiver un message non lu le retire du compteur « non lus » (et inversement).
    if (!msg.read) setUnreadCount((c) => Math.max(0, c + (next ? -1 : 1)));
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey ?? "",
        },
        body: JSON.stringify({ id: msg.id, archived: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Erreur réseau.");
      }
      toast.success(next ? "Message archivé." : "Message restauré.");
    } catch (err) {
      setMessages((ms) =>
        ms.map((m) => (m.id === msg.id ? { ...m, archived: msg.archived } : m)),
      );
      if (!msg.read) setUnreadCount((c) => Math.max(0, c + (msg.archived ? -1 : 1)));
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    }
  };

  /* ----- Delete a message (optimistic, re-inserted on failure) ----- */
  const handleDelete = async (msg: ContactMsg) => {
    const index = messages.findIndex((m) => m.id === msg.id);
    setMessages((ms) => ms.filter((m) => m.id !== msg.id));
    setTotal((t) => Math.max(0, t - 1));
    if (!msg.read && !msg.archived) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const res = await fetch(`/api/contact?id=${encodeURIComponent(msg.id)}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey ?? "" },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Erreur réseau.");
      }
      toast.success("Message supprimé.");
      // Dernier message de la page (hors page 1) → revenir à la page précédente.
      if (messages.length <= 1 && page > 1) setPage((p) => Math.max(1, p - 1));
    } catch (err) {
      setMessages((ms) => {
        const copy = [...ms];
        copy.splice(Math.max(0, index < 0 ? copy.length : index), 0, msg);
        return copy;
      });
      setTotal((t) => t + 1);
      if (!msg.read && !msg.archived) setUnreadCount((c) => c + 1);
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    }
  };

  /* ----- Reply dialog: save the answer, then hand over to the mail client ----- */
  const openReplyDialog = (msg: ContactMsg) => {
    setReplyTarget(msg);
    // Déjà répondu → on repart de la réponse existante, sinon brouillon type.
    setReplyDraft(msg.reply ?? buildReplyTemplate(msg));
  };

  const handleReplyOpenChange = (open: boolean) => {
    if (!open && !sendingReply) {
      setReplyTarget(null);
      setReplyDraft("");
    }
  };

  const handleSendReply = async () => {
    const target = replyTarget;
    if (!target) return;
    const trimmed = replyDraft.trim();
    if (trimmed.length === 0 || trimmed.length > REPLY_MAX_LENGTH) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey ?? "",
        },
        body: JSON.stringify({ id: target.id, reply: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Erreur réseau.");
      }
      // (1) + (2) la réponse est enregistrée et le message marqué comme répondu.
      setMessages((ms) =>
        ms.map((m) =>
          m.id === target.id
            ? { ...m, reply: trimmed, repliedAt: new Date().toISOString(), read: true }
            : m,
        ),
      );
      if (!target.read) setUnreadCount((c) => Math.max(0, c - 1));
      // (3) le client de messagerie prend le relais avec le brouillon édité.
      window.location.href = buildMailtoHref(target, trimmed);
      // (4) confirmation
      toast.success("Réponse enregistrée.");
      setReplyDraft("");
      setReplyTarget((current) => (current?.id === target.id ? null : current));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setSendingReply(false);
    }
  };

  /* ----- Export the currently visible messages as a client-side CSV download ----- */
  const handleExportCsv = () => {
    if (visible.length === 0) {
      toast.info("Aucun message à exporter.");
      return;
    }
    downloadTextFile(messagesToCsv(visible), `focusly-messages-${todayKey()}.csv`);
    toast.success("Export CSV téléchargé.");
  };

  /* ---------------------------------------------------------------- */
  /* Gate (no valid key in this tab)                                   */
  /* ---------------------------------------------------------------- */

  if (!adminKey) {
    return (
      <section className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
        <Breadcrumb
          items={[{ label: "Accueil", href: "accueil" }, { label: "Administration" }]}
        />
        <div className="mx-auto mt-6 w-full max-w-md rounded-3xl border bg-card p-8">
          <div
            className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand/15"
            aria-hidden
          >
            <Lock className="size-6 text-brand" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">
            Administration
          </h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">
            Espace réservé à l’équipe Focusly.
          </p>

          <form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-3">
            <label htmlFor="admin-key" className="text-sm font-medium text-soft">
              Clé d’administration
            </label>
            <Input
              id="admin-key"
              type="password"
              autoComplete="off"
              value={entered}
              onChange={(e) => setEntered(e.target.value)}
              aria-label="Clé d’administration"
              aria-invalid={gateError ? true : undefined}
              placeholder="••••••••••••"
            />
            {gateError ? (
              <p className="m-0 text-sm text-destructive" role="alert">
                {gateError}
              </p>
            ) : null}
            <Button type="submit" disabled={unlocking} className="rounded-xl">
              <Lock aria-hidden />
              Déverrouiller
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-faint">
            Clé de développement par défaut : focusly-admin-2026
          </p>

          <div className="mt-6 flex justify-center">
            <Button variant="ghost" asChild className="rounded-xl">
              <a href="#accueil">Retour à l’accueil</a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Authenticated                                                     */
  /* ---------------------------------------------------------------- */

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginationVisible = total > pageSize;
  const replyLength = replyDraft.trim().length;

  return (
    <section className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "Administration" }]}
      />

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Administration</h1>
      <p className="mt-3 max-w-[680px] text-[17px] text-muted-foreground">
        Consultez et gérez les messages reçus via le formulaire de contact.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {/* ----- Header row ----- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-5 text-brand" aria-hidden />
            <h2 className="m-0 text-base font-bold tracking-tight">
              Messages de contact
            </h2>
            {unreadCount > 0 ? (
              <Badge className="border-transparent bg-brand/15 text-brand">
                {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg"
              aria-label="Rafraîchir les messages"
              disabled={loading}
              onClick={() => void loadMessages(adminKey, page)}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              aria-label="Exporter les messages visibles en CSV"
              onClick={handleExportCsv}
            >
              <Download aria-hidden />
              Exporter en CSV
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          </div>
        </div>

        {/* ----- Search + filters ----- */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un nom, email, sujet…"
              aria-label="Rechercher dans les messages"
              className="pl-9 pr-8"
            />
            {query !== "" ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-faint transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <div
            role="group"
            aria-label="Filtrer les messages"
            className="flex flex-wrap items-center gap-2"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? "border-transparent bg-brand text-[#14161a]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ----- Messages ----- */}
        {loading && messages.length === 0 ? (
          <div className="flex flex-col gap-3" aria-label="Chargement des messages">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-56" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
            <Inbox className="size-6 text-faint" aria-hidden />
            <p className="m-0 text-[15px] text-soft">
              {messages.length === 0
                ? "Aucun message pour le moment."
                : query.trim() !== ""
                  ? `Aucun résultat pour « ${query.trim()} ».`
                  : filter === "archives"
                    ? "Aucun message archivé."
                    : filter === "non-lus"
                      ? "Aucun message non lu."
                      : "Aucun message actif."}
            </p>
          </div>
        ) : (
          <div className="slim-scroll max-h-[70vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {visible.map((m) => (
                <li key={m.id}>
                  <article
                    className={`rounded-2xl border bg-card p-4 ${
                      m.archived
                        ? "opacity-60"
                        : m.read
                          ? "opacity-75"
                          : "border-l-2 border-l-brand"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {!m.read && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-brand"
                          aria-hidden
                        />
                      )}
                      <span className="font-semibold">{m.name}</span>
                      <a
                        href={`mailto:${m.email}`}
                        className="text-xs text-faint transition-colors hover:text-brand"
                      >
                        {m.email}
                      </a>
                      {m.repliedAt ? (
                        <Badge className="border-transparent bg-brand/15 text-brand">
                          <Check className="size-3" aria-hidden />
                          Répondu
                        </Badge>
                      ) : null}
                      {m.archived ? (
                        <Badge variant="secondary">
                          <Archive className="size-3" aria-hidden />
                          Archivé
                        </Badge>
                      ) : null}
                    </div>

                    {m.subject ? (
                      <p className="mb-0 mt-1.5 text-sm font-medium text-soft">
                        {m.subject}
                      </p>
                    ) : null}

                    <p className="mb-0 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {m.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <time dateTime={m.createdAt} className="text-xs text-faint">
                        {frDateTime(m.createdAt)}
                      </time>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void toggleRead(m)}
                        >
                          {m.read ? <Mail aria-hidden /> : <MailOpen aria-hidden />}
                          {m.read ? "Marquer comme non lu" : "Marquer comme lu"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Répondre à ${m.name}`}
                          onClick={() => openReplyDialog(m)}
                        >
                          <Reply aria-hidden />
                          Répondre
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={
                            m.archived
                              ? `Restaurer le message de ${m.name}`
                              : `Archiver le message de ${m.name}`
                          }
                          onClick={() => void toggleArchived(m)}
                        >
                          {m.archived ? (
                            <ArchiveRestore aria-hidden />
                          ) : (
                            <Archive aria-hidden />
                          )}
                          {m.archived ? "Restaurer" : "Archiver"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Supprimer le message de ${m.name}`}
                            >
                              <Trash2 aria-hidden />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est définitive.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => void handleDelete(m)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ----- Pagination (uniquement au-delà d'une page) ----- */}
        {paginationVisible ? (
          <nav
            aria-label="Pagination des messages"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft aria-hidden />
              Précédent
            </Button>
            <p className="m-0 text-sm text-soft" aria-live="polite">
              Page {page} sur {pageCount}
              <span className="text-faint">
                {" "}
                · {total} message{total > 1 ? "s" : ""}
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || loading}
            >
              Suivant
              <ChevronRight aria-hidden />
            </Button>
          </nav>
        ) : null}
      </div>

      {/* ----- Reply dialog ----- */}
      <Dialog open={replyTarget !== null} onOpenChange={handleReplyOpenChange}>
        <DialogContent
          className="max-h-[85dvh] gap-4 overflow-y-auto sm:max-w-[560px]"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            replyTextareaRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Répondre à {replyTarget?.name}</DialogTitle>
            <DialogDescription>
              Votre réponse est enregistrée dans l’application, puis votre logiciel de
              messagerie s’ouvre avec le brouillon pré-rempli.
            </DialogDescription>
          </DialogHeader>

          {replyTarget ? (
            <div className="flex flex-col gap-4">
              {/* Message original */}
              <div className="slim-scroll max-h-32 overflow-y-auto rounded-xl border bg-secondary/50 p-3">
                {replyTarget.subject ? (
                  <p className="mb-1 text-sm font-medium">{replyTarget.subject}</p>
                ) : null}
                <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-soft">
                  {replyTarget.message}
                </p>
              </div>

              {replyTarget.repliedAt ? (
                <p className="m-0 text-xs text-faint">
                  Réponse envoyée le {frDateTime(replyTarget.repliedAt)} — vous pouvez la
                  modifier et la renvoyer.
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <label htmlFor="admin-reply" className="text-sm font-medium text-soft">
                  Votre réponse
                </label>
                <Textarea
                  id="admin-reply"
                  ref={replyTextareaRef}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  className="min-h-[180px]"
                  disabled={sendingReply}
                />
                <p className="m-0 text-right text-xs text-faint" aria-live="off">
                  {replyLength} / {REPLY_MAX_LENGTH} caractères
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => handleReplyOpenChange(false)}
              disabled={sendingReply}
            >
              Annuler
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => void handleSendReply()}
              disabled={sendingReply || replyLength === 0 || replyLength > REPLY_MAX_LENGTH}
            >
              {sendingReply ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Send aria-hidden />
              )}
              {sendingReply ? "Envoi…" : "Envoyer la réponse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
