import { frDateTime, type DailyStat } from "./types";

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

/** Minimal contact-message shape for the admin CSV export (structurally compatible with the admin view's messages). */
export interface ContactCsvRow {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  archived?: boolean;
  createdAt: string;
}

/** Quote a CSV field when it contains the separator (« ; »), a double quote or a newline; inner quotes are doubled. */
function csvField(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Build a semicolon-separated CSV of the contact messages (Excel-friendly in FR locales),
 * for the admin back-office export. `Lu` and `Archivé` are rendered as « oui » / « non ».
 */
export function messagesToCsv(messages: ContactCsvRow[]): string {
  const head = "Date;Nom;Email;Sujet;Message;Lu;Archivé";
  const rows = messages.map((m) =>
    [
      frDateTime(m.createdAt),
      m.name,
      m.email,
      m.subject ?? "",
      m.message,
      m.read ? "oui" : "non",
      m.archived === undefined ? "" : m.archived ? "oui" : "non",
    ]
      .map(csvField)
      .join(";"),
  );
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
