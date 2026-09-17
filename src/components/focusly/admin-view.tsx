"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Inbox,
  Lock,
  Mail,
  MailOpen,
  RefreshCw,
  Reply,
  ShieldCheck,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  read: boolean;
  createdAt: string;
}

/** sessionStorage key — holds the admin key for the current tab only. */
const STORAGE_KEY = "focusly.adminKey";

const FILTERS: Array<{ value: "tous" | "non-lus"; label: string }> = [
  { value: "tous", label: "Tous" },
  { value: "non-lus", label: "Non lus" },
];

/** Pre-filled FR reply (mailto) — quotes the original message, truncated after 600 characters. */
function buildReplyHref(msg: ContactMsg): string {
  const normalized = msg.message.replace(/\r\n/g, "\n");
  const truncated =
    normalized.length > 600
      ? normalized.slice(0, 600).replace(/\s+\S*$/, "") + " …"
      : normalized;
  const body = [
    `Bonjour ${msg.name},`,
    "",
    "Merci pour votre message :",
    "",
    ...truncated.split("\n").map((line) => `> ${line}`),
    "",
    "Cordialement,",
    "L’équipe Focusly",
  ].join("\n");
  const subject = "Re: " + (msg.subject ?? "Votre message Focusly");
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
  const [filter, setFilter] = useState<"tous" | "non-lus">("tous");

  /* Restore a previously unlocked key (same tab only) */
  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) setAdminKey(stored);
  }, []);

  const loadMessages = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
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
      const data = (await res.json()) as { ok?: boolean; messages?: ContactMsg[] };
      setMessages((data.messages ?? []).map((m) => ({ ...m, read: m.read ?? false })));
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load (or reload) the messages whenever a key becomes available */
  useEffect(() => {
    if (adminKey) void loadMessages(adminKey);
  }, [adminKey, loadMessages]);

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
      const res = await fetch("/api/contact", {
        headers: { "x-admin-key": k },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; messages?: ContactMsg[] };
        window.sessionStorage.setItem(STORAGE_KEY, k);
        setAdminKey(k);
        setEntered(""); // never keep the key in the DOM
        setMessages((data.messages ?? []).map((m) => ({ ...m, read: m.read ?? false })));
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
    setFilter("tous");
  };

  /* ----- Toggle read state (optimistic, reverted on failure) ----- */
  const toggleRead = async (msg: ContactMsg) => {
    const next = !msg.read;
    setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, read: next } : m)));
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
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    }
  };

  /* ----- Delete a message (optimistic, re-inserted on failure) ----- */
  const handleDelete = async (msg: ContactMsg) => {
    const index = messages.findIndex((m) => m.id === msg.id);
    setMessages((ms) => ms.filter((m) => m.id !== msg.id));
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
    } catch (err) {
      setMessages((ms) => {
        const copy = [...ms];
        copy.splice(Math.max(0, index < 0 ? copy.length : index), 0, msg);
        return copy;
      });
      toast.error(err instanceof Error ? err.message : "Erreur réseau.");
    }
  };

  /* ----- Export all the messages as a client-side CSV download ----- */
  const handleExportCsv = () => {
    if (messages.length === 0) {
      toast.info("Aucun message à exporter.");
      return;
    }
    downloadTextFile(messagesToCsv(messages), `focusly-messages-${todayKey()}.csv`);
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

  const unreadCount = messages.filter((m) => !m.read).length;
  const visible =
    filter === "non-lus" ? messages.filter((m) => !m.read) : messages;

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
              onClick={() => void loadMessages(adminKey)}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              aria-label="Exporter les messages en CSV"
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

        {/* ----- Filters ----- */}
        <div role="group" aria-label="Filtrer les messages" className="flex items-center gap-2">
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
                : "Aucun message non lu."}
            </p>
          </div>
        ) : (
          <div className="slim-scroll max-h-[70vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {visible.map((m) => (
                <li key={m.id}>
                  <article
                    className={`rounded-2xl border bg-card p-4 ${
                      m.read ? "opacity-75" : "border-l-2 border-l-brand"
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
                          onClick={() => {
                            window.location.href = buildReplyHref(m);
                          }}
                        >
                          <Reply aria-hidden />
                          Répondre
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
      </div>
    </section>
  );
}
