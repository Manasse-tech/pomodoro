"use client";

import type { SoundKind } from "./types";

/** Web Audio chime + browser notification helpers (all guarded for SSR/unsupported). */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * End-of-session alert. Three flavors:
 * - carillon: soft three-note ascending chime
 * - cloche: two bell strikes with harmonics and long decay
 * - digital: crisp three-beep alarm
 */
export function playEndSound(kind: SoundKind = "carillon", volume = 0.6) {
  try {
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime;
    const vol = Math.max(0.0001, Math.min(1, volume));

    if (kind === "cloche") {
      [0, 0.4].forEach((offset) => {
        // Fundamental + two inharmonic partials for a bell timbre
        ([524, 1319, 1741] as const).forEach((f, i) => {
          const osc = audio.createOscillator();
          const g = audio.createGain();
          osc.type = "sine";
          osc.frequency.value = f;
          const peak = vol * [0.3, 0.1, 0.06][i];
          g.gain.setValueAtTime(0.0001, now + offset);
          g.gain.linearRampToValueAtTime(peak, now + offset + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, now + offset + (i === 0 ? 1.1 : 0.6));
          osc.connect(g).connect(audio.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 1.2);
        });
      });
      return;
    }

    if (kind === "digital") {
      [880, 880, 1320].forEach((f, i) => {
        const offset = i * 0.16;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = "square";
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + offset);
        g.gain.linearRampToValueAtTime(vol * 0.12, now + offset + 0.01);
        g.gain.setValueAtTime(vol * 0.12, now + offset + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
        osc.connect(g).connect(audio.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
      return;
    }

    // carillon (default): three-note ascending chime
    const gain = vol * 0.28;
    [0, 0.17, 0.34].forEach((offset, i) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 920 : 660;
      g.gain.setValueAtTime(0.0001, now + offset);
      g.gain.linearRampToValueAtTime(gain, now + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.17);
      osc.connect(g).connect(audio.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  } catch {
    /* audio unavailable — ignore */
  }
}

/** Backward-compatible alias for the default carillon. */
export function playChime(volume = 0.6) {
  playEndSound("carillon", volume);
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notify(body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification("Focusly", { body, silent: true });
  } catch {
    /* ignore */
  }
}

/** Soft click feedback for interactions (used sparingly) */
export function playTick(volume = 0.4) {
  try {
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = 420;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, Math.min(1, volume)) * 0.08, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(g).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    /* ignore */
  }
}

/** Haptic feedback at the end of a session (mobile, feature-detected). */
export function vibrateDevice(enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function")
    return;
  try {
    navigator.vibrate([180, 90, 180]);
  } catch {
    /* vibration unavailable — ignore */
  }
}

/** Short countdown blip for the final seconds of a session */
export function playCountdownTick(volume = 0.5) {
  try {
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = 740;
    const v = Math.max(0.0001, Math.min(1, volume)) * 0.1;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(v, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(g).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    /* ignore */
  }
}
