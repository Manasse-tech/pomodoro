/* r10-b — build canonical + injected localStorage payloads for browser QA */
import { writeFileSync, readFileSync } from "node:fs";

const raw = readFileSync("/home/z/my-project/analysis/r10-b/original-default.json", "utf8");
const json = raw.replace(/^focusly\.v4: /, "").trim();
const parsed = JSON.parse(json);

// Canonical copy (byte-faithful JSON of the default session state)
writeFileSync("/home/z/my-project/analysis/r10-b/canonical.json", json);

// Injected demo state — dailyGoal 2 + streak history; the 2026-09-17 entry is
// preserved EXACTLY (2 pomodoros / 120 s / 0 breaks).
const inj = JSON.parse(json);
inj.state.settings.dailyGoal = 2;
const day = (p: number) => ({ pomodoros: p, focusSeconds: p * 300, breaks: 0 });
const d = inj.state.daily;

// Année 2025 (option passée du sélecteur) : 10 pomodoros
for (let i = 10; i <= 14; i++) d["2025-03-" + String(i).padStart(2, "0")] = day(2);
// Juin 2026 : 30 ×2 = 60 (objectif mensuel atteint exactement)
for (let i = 1; i <= 30; i++) d["2026-06-" + String(i).padStart(2, "0")] = day(2);
// Juillet 2026 : 31 ×2 = 62
for (let i = 1; i <= 31; i++) d["2026-07-" + String(i).padStart(2, "0")] = day(2);
// Septembre : semaines consécutives atteintes
for (let i = 1; i <= 4; i++) d["2026-09-0" + i] = day(10);
d["2026-09-07"] = day(8);
d["2026-09-08"] = day(6);
d["2026-09-14"] = day(6);
d["2026-09-15"] = day(4);
d["2026-09-16"] = day(4);
// 2026-09-17 reste l'entrée originale (2 / 120 s)

writeFileSync("/home/z/my-project/analysis/r10-b/injected.json", JSON.stringify(inj));

// Sanity: expected computed values
const sept = Object.entries(d)
  .filter(([k]) => k.startsWith("2026-09-"))
  .reduce((a, [, v]) => a + v.pomodoros, 0);
const y2026 = Object.entries(d)
  .filter(([k]) => k.startsWith("2026-"))
  .reduce((a, [, v]) => a + v.pomodoros, 0);
const y2025 = Object.entries(d)
  .filter(([k]) => k.startsWith("2025-"))
  .reduce((a, [, v]) => a + v.pomodoros, 0);
const kept = JSON.stringify(d["2026-09-17"]) === '{"pomodoros":2,"focusSeconds":120,"breaks":0}';
console.log(JSON.stringify({ kept2026_09_17: kept, sept, weekSept14_20: 16, y2026, y2025 }));
