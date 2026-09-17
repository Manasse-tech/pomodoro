/* r10-b smoke tests — records de séries + helpers sélecteur d'année (streaks.ts) */
import {
  availableGoalYears,
  bestMonthGoalStreak,
  bestWeekGoalStreak,
  daysInYear,
  monthGoalStreak,
  weekGoalStreak,
} from "/home/z/my-project/src/lib/focusly/streaks";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) {
    pass++;
    console.log("PASS —", label);
  } else {
    fail++;
    console.log("FAIL —", label);
  }
}

/** Build a DailyStat record from { "YYYY-MM-DD": pomodoros }. */
const D = (m: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(m).map(([k, p]) => [k, { pomodoros: p, focusSeconds: p * 60, breaks: 0 }]),
  );

/** Add `count` consecutive days of `p` pomodoros starting at [y, m0, d]. */
function fill(d: Record<string, number>, start: [number, number, number], count: number, p = 1) {
  const cur = new Date(start[0], start[1], start[2]);
  for (let i = 0; i < count; i++) {
    const k =
      cur.getFullYear() +
      "-" +
      String(cur.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(cur.getDate()).padStart(2, "0");
    d[k] = (d[k] ?? 0) + p;
    cur.setDate(cur.getDate() + 1);
  }
  return d;
}

/* ------------ Records : semaines ------------ */
const T = new Date(2026, 8, 17); // jeudi 2026-09-17 (horloge sandbox)

ok(bestWeekGoalStreak({}, 2, T) === 0, "week record: no data → 0");
ok(bestMonthGoalStreak({}, 2, T) === 0, "month record: no data → 0");

const some = D({ "2026-09-14": 5 });
ok(bestWeekGoalStreak(some, 0, T) === 0, "week record: dailyGoal 0 → 0 despite data");
ok(bestMonthGoalStreak(some, 0, T) === 0, "month record: dailyGoal 0 → 0 despite data");

const curOnlyD = D(fill({}, [2026, 8, 14], 4, 2)); // lun 14 → jeu 17 ×2 = 8 ≥ 7
ok(bestWeekGoalStreak(curOnlyD, 1, T) === 1, "week record: current week met alone → 1");
ok(weekGoalStreak(curOnlyD, 1, T).current === 1, "week current streak consistency → 1");

const past3: Record<string, number> = {};
fill(past3, [2026, 7, 10], 7, 1); // lun 10 août → dim 16
fill(past3, [2026, 7, 17], 7, 1); // lun 17 → dim 23
fill(past3, [2026, 7, 24], 7, 1); // lun 24 → dim 30
const past3D = D(past3);
ok(bestWeekGoalStreak(past3D, 1, T) === 3, "week record: 3 past consecutive then gap → 3");
const wcur = weekGoalStreak(past3D, 1, T);
ok(
  wcur.current === 0 && bestWeekGoalStreak(past3D, 1, T) > wcur.current,
  "week record 3 > current 0 (record > current)",
);

const twoPlusCur: Record<string, number> = {};
fill(twoPlusCur, [2026, 7, 31], 7, 1); // lun 31 août → dim 6
fill(twoPlusCur, [2026, 8, 7], 7, 1); // lun 7 → dim 13
fill(twoPlusCur, [2026, 8, 14], 4, 2); // lun 14 → jeu 17 ×2 = 8 ≥ 7
const twoPlusCurD = D(twoPlusCur);
ok(bestWeekGoalStreak(twoPlusCurD, 1, T) === 3, "week record: 2 past + current met → 3");
ok(weekGoalStreak(twoPlusCurD, 1, T).current === 3, "week current streak → 3");

const over = fill({}, [2026, 8, 14], 3, 5); // 15 ≥ 7
ok(bestWeekGoalStreak(D(over), 1, T) === 1, "week record: overshoot (15/7) counts → 1");

const tb = new Date(2026, 0, 8); // jeudi 2026-01-08
const boundary: Record<string, number> = {};
fill(boundary, [2025, 11, 22], 7, 1); // lun 22 déc 2025 → dim 28
fill(boundary, [2025, 11, 29], 7, 1); // lun 29 déc → dim 4 janv 2026 (traversée d'année)
fill(boundary, [2026, 0, 5], 7, 1); // lun 5 → dim 11 janv
ok(bestWeekGoalStreak(D(boundary), 1, tb) === 3, "week record: year boundary 2025→2026 → 3");

/* ------------ Records : mois ------------ */
const curMonth = fill({}, [2026, 8, 1], 17, 2); // sept 1→17 ×2 = 34 ≥ 30
ok(bestMonthGoalStreak(D(curMonth), 1, T) === 1, "month record: current month met → 1");
const mg = monthGoalStreak(D(curMonth), 1, T);
ok(mg.current === 1 && mg.currentMet === true, "month current streak consistency → 1 (met)");

const mb: Record<string, number> = {};
fill(mb, [2026, 5, 1], 30, 1); // juin 1→30 = 30 ≥ 30 (30 jours)
fill(mb, [2026, 6, 1], 31, 1); // juillet 1→31 = 31 ≥ 31 (31 jours)
fill(mb, [2026, 8, 1], 17, 2); // sept courant = 34 ≥ 30
const mbD = D(mb);
ok(
  bestMonthGoalStreak(mbD, 1, T) === 2,
  "month record: juin+juillet consecutive (30→31 jours) → 2",
);
ok(
  monthGoalStreak(mbD, 1, T).current === 1,
  "month current 1 (août vide casse) < record 2",
);

const tJan = new Date(2026, 0, 10);
const yb: Record<string, number> = {};
fill(yb, [2025, 11, 1], 31, 1); // déc 2025 = 31 ≥ 31
fill(yb, [2026, 0, 1], 31, 1); // janv 2026 = 31 ≥ 31
ok(bestMonthGoalStreak(D(yb), 1, tJan) === 2, "month record: déc 2025 + janv 2026 → 2");

const tFeb28 = new Date(2028, 1, 29);
const leapOk = fill({}, [2028, 1, 1], 29, 2); // 58 = 2 × 29
ok(
  bestMonthGoalStreak(D(leapOk), 2, tFeb28) === 1,
  "month record: févr. 2028 bissextile 58/58 → 1 (29 jours scannés)",
);
const leapKo = fill({}, [2028, 1, 1], 28, 2);
leapKo["2028-02-01"] = 3; // 57 < 58
ok(bestMonthGoalStreak(D(leapKo), 2, tFeb28) === 0, "month record: févr. 2028 57 < 58 → 0");
const feb26 = fill({}, [2026, 1, 1], 28, 2);
feb26["2026-02-01"] = 3; // 57 ≥ 56
ok(
  bestMonthGoalStreak(D(feb26), 2, new Date(2026, 1, 20)) === 1,
  "month record: févr. 2026 (28 j) 57 ≥ 56 → 1",
);

/* ------------ Sélecteur d'année + daysInYear ------------ */
const optsEmpty = availableGoalYears({}, 2026);
ok(optsEmpty.length === 1 && optsEmpty[0] === 2026, "years: empty daily → [2026]");

const opts = availableGoalYears(D({ "2024-05-01": 1, "2025-03-03": 2, "2026-09-17": 3 }), 2026);
ok(JSON.stringify(opts) === "[2026,2025,2024]", "years: extracted + sorted desc [2026,2025,2024]");

const optsDup = availableGoalYears(D({ "2025-01-01": 1, "2025-06-15": 2, "2026-01-02": 1 }), 2026);
ok(JSON.stringify(optsDup) === "[2026,2025]", "years: dedup same-year keys");

const many: Record<string, number> = {};
for (let y = 2019; y <= 2026; y++) many[y + "-06-15"] = 1;
const optsCap = availableGoalYears(D(many), 2026);
ok(
  optsCap.length === 5 && JSON.stringify(optsCap) === "[2026,2025,2024,2023,2022]",
  "years: capped at 5, desc",
);

const bad = availableGoalYears(
  { "xyz-01-01": { pomodoros: 1, focusSeconds: 0, breaks: 0 } },
  2026,
);
ok(JSON.stringify(bad) === "[2026]", "years: malformed key ignored");

ok(daysInYear(2024) === 366, "daysInYear(2024) = 366");
ok(daysInYear(2025) === 365, "daysInYear(2025) = 365");
ok(daysInYear(2026) === 365, "daysInYear(2026) = 365");
ok(daysInYear(2028) === 366, "daysInYear(2028) = 366");

console.log("\n" + pass + " PASS / " + fail + " FAIL / " + (pass + fail) + " assertions");
if (fail > 0) process.exit(1);
