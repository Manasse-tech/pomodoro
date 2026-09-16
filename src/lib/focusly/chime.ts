"use client";

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

/** Three-note ascending chime. volume: 0–1 */
export function playChime(volume = 0.6) {
  try {
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime;
    const gain = Math.max(0.0001, Math.min(1, volume)) * 0.28;
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
