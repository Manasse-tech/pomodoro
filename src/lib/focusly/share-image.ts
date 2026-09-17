// Partage des statistiques en image — rendu canvas hors écran (1200×630, format OG).
// 100 % client : aucune lecture de window/document au niveau module, tout est gardé
// dans les fonctions (le fichier n’a donc pas besoin de "use client").

import { frDate } from "./types";

/** Palette figée sur le thème sombre de l’app, indépendante du thème actif. */
const COLORS = {
  background: "#0f1013",
  card: "#17191e",
  cardStroke: "rgba(255, 255, 255, 0.08)",
  text: "#eef0f4",
  muted: "#9ba1ab",
  faint: "#6b7078",
} as const;

/** Pile de polices explicite : le canvas n’hérite pas des fontes CSS de la page. */
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Repli si la variable --brand est illisible (accent corail Focusly). */
const FALLBACK_BRAND = "#f4633a";

export interface StatsImageOptions {
  /** Pomodoros réalisés sur la période affichée */
  pomodoros: number;
  /** Secondes de concentration cumulées sur la période */
  focusSeconds: number;
  /** Meilleure série, en jours */
  bestStreak: number;
  /** Libellé de période, ex. « 30 derniers jours » ou « Historique complet » */
  periodLabel: string;
  /** Nom de fichier final, ex. focusly-statistiques-2026-09-17.png */
  fileName: string;
}

/** Résultat du partage : OS (silencieux), téléchargement, ou annulation utilisateur. */
export type StatsShareResult = "shared" | "downloaded" | "cancelled";

/** « X h YY min » — heures plancher, minutes arrondies (avec retenue 60 min → 1 h). */
export function formatFocusDuration(seconds: number): string {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.round((seconds % 3600) / 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return hours > 0 ? `${hours} h ${String(minutes).padStart(2, "0")} min` : `${minutes} min`;
}

/** Lit l’accent de marque courant (variable CSS --brand), avec repli corail. */
function readBrandColor(): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
    return v.length > 0 ? v : FALLBACK_BRAND;
  } catch {
    return FALLBACK_BRAND;
  }
}

/** #rrggbb → rgba(r, g, b, a) ; renvoie la chaîne d’origine si le format est inattendu. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Chemin rectangulaire arrondi (ctx.roundRect n’est pas disponible partout). */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Dessine la carte récapitulative Focusly (thème sombre, halo de marque) sur un
 * canvas 1200×630 créé hors écran. Renvoie null si le canvas 2D est indisponible.
 */
export function buildStatsImage(options: StatsImageOptions): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const brand = readBrandColor();
  const W = canvas.width;
  const H = canvas.height;
  const pad = 48; // marge intérieure de la carte
  const left = 40 + pad; // bord gauche du contenu
  const right = W - 40 - pad; // bord droit du contenu
  const colW = (right - left) / 3;

  /* ----- Fond sombre + halo radial de marque en haut à droite (effet héros) ----- */
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(1120, 40, 0, 1120, 40, 520);
  glow.addColorStop(0, withAlpha(brand, 1));
  glow.addColorStop(1, withAlpha(brand, 0));
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  /* ----- Carte arrondie légèrement plus claire que le fond ----- */
  roundedRectPath(ctx, 40, 40, W - 80, H - 80, 28);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.strokeStyle = COLORS.cardStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  /* ----- En-tête : point de marque + wordmark à gauche, période à droite ----- */
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = brand;
  ctx.beginPath();
  ctx.arc(left + 9, 102, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 44px ${FONT_STACK}`;
  ctx.fillText("Focusly", left + 32, 102);
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 24px ${FONT_STACK}`;
  ctx.fillText(options.periodLabel, right, 102);

  /* ----- Grande ligne de chiffres : 3 colonnes (valeur 64 px + libellé espacé) ----- */
  const columns: Array<{ label: string; value: string; color: string }> = [
    { label: "POMODOROS", value: String(options.pomodoros), color: brand },
    {
      label: "TEMPS DE CONCENTRATION",
      value: formatFocusDuration(options.focusSeconds),
      color: COLORS.text,
    },
    { label: "SÉRIE RECORD", value: `${options.bestStreak} j`, color: COLORS.text },
  ];
  columns.forEach((c, i) => {
    const x = left + i * colW;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = c.color;
    // Rétrécit la valeur si elle déborde de sa colonne (ex. « 276 h 15 min »)
    let size = 64;
    ctx.font = `700 ${size}px ${FONT_STACK}`;
    while (ctx.measureText(c.value).width > colW - 24 && size > 40) {
      size -= 2;
      ctx.font = `700 ${size}px ${FONT_STACK}`;
    }
    ctx.fillText(c.value, x, 388);
    // Même mécanique pour le libellé (ex. « TEMPS DE CONCENTRATION » est long)
    ctx.fillStyle = COLORS.muted;
    let labelSize = 20;
    ctx.font = `600 ${labelSize}px ${FONT_STACK}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px";
    while (ctx.measureText(c.label).width > colW - 24 && labelSize > 13) {
      labelSize -= 1;
      ctx.font = `600 ${labelSize}px ${FONT_STACK}`;
    }
    ctx.fillText(c.label, x, 430);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  });

  /* ----- Pied : signature à gauche, date du jour à droite ----- */
  ctx.font = `500 20px ${FONT_STACK}`;
  ctx.fillStyle = COLORS.faint;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("focusly — minuteur pomodoro", left, 548);
  ctx.textAlign = "right";
  ctx.fillText(frDate(Date.now()), right, 548);

  return canvas;
}

/**
 * Génère l’image des statistiques puis la partage via Web Share (si l’appareil
 * gère les fichiers, ex. mobile), sinon la télécharge en PNG. Tout est
 * feature-détecté pour ne jamais lever sur les navigateurs non supportés.
 */
export async function shareOrDownloadStatsImage(
  options: StatsImageOptions,
): Promise<StatsShareResult> {
  const canvas = buildStatsImage(options);
  if (!canvas || typeof canvas.toBlob !== "function") {
    throw new Error("Canvas 2D indisponible");
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
  if (!blob) throw new Error("Encodage PNG impossible");
  const file = new File([blob], options.fileName, { type: "image/png" });

  // Partage natif (mobile) si l’appareil accepte les fichiers
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const canShareFiles =
      typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
    if (canShareFiles) {
      try {
        await navigator.share({ files: [file], title: "Mes statistiques Focusly" });
        return "shared";
      } catch (err) {
        // Annulation utilisateur → silence ; autre échec → repli téléchargement
        if (err instanceof Error && err.name === "AbortError") return "cancelled";
      }
    }
  }

  // Repli : téléchargement classique (même mécanique que downloadTextFile)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
