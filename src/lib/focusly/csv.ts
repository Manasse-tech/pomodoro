import type { DailyStat } from "./types";

/**
 * Build a semicolon-separated CSV of the daily stats (Excel-friendly in FR locales).
 * Rows sorted by date ascending. Minutes are rounded down to the whole minute.
 */
export function dailyToCsv(daily: Record<string, DailyStat>): string {
  const head = "date;pomodoros;minutes_concentration;pauses";
  const rows = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, String(v.pomodoros), String(Math.floor(v.focusSeconds / 60)), String(v.breaks)].join(";"));
  return [head, ...rows].join("\n") + "\n";
}

/** Trigger a client-side download of the given text content as a file. */
export function downloadTextFile(content: string, filename: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
