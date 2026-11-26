/* Tests for elektrik-limiti/hesap.js. Run from the site root with either:
     node tools/test-elektrik-limiti.js
     /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tools/test-elektrik-limiti.js
*/
var EL;
if (typeof require === "function") {
  EL = require("../elektrik-limiti/hesap.js");
} else {
  load("elektrik-limiti/hesap.js");
  EL = this.ElektrikLimiti;
}
var out = typeof console !== "undefined" ? function (s) { console.log(s); } : print;
var passed = 0, failed = 0;

function eq(name, actual, expected) {
  var a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; }
  else { failed++; out("FAIL " + name + "\n  expected " + e + "\n  actual   " + a); }
}

// Tariff start: third calendar month after the month the limit is reached, day 1 (spec 7.2-3).
eq("May 2027 -> 1 Aug 2027", EL.tariffStart(2027, 5), { year: 2027, month: 8, day: 1 });
eq("Oct 2026 -> 1 Jan 2027", EL.tariffStart(2026, 10), { year: 2027, month: 1, day: 1 });
eq("Nov 2026 -> 1 Feb 2027", EL.tariffStart(2026, 11), { year: 2027, month: 2, day: 1 });
eq("Dec 2027 -> 1 Mar 2028", EL.tariffStart(2027, 12), { year: 2028, month: 3, day: 1 });
eq("Sep 2026 -> 1 Dec 2026", EL.tariffStart(2026, 9), { year: 2026, month: 12, day: 1 });
eq("Jan 2027 -> 1 Apr 2027", EL.tariffStart(2027, 1), { year: 2027, month: 4, day: 1 });

// Limits table.
eq("limit 2026", EL.LIMITS[2026], 4000);
eq("limit 2027", EL.LIMITS[2027], 3000);
eq("no limit 2028", EL.calculate({ year: 2028, usedKwh: 0, throughMonth: 0 }).error, "noLimit");

// Parsing.
eq("parse 3250", EL.parseKwh("3250"), 3250);
eq("parse 3.250", EL.parseKwh("3.250"), 3250);
eq("parse 3 250", EL.parseKwh(" 3 250 "), 3250);
eq("parse 312,5", EL.parseKwh("312,5"), 312.5);
eq("parse 1.312,5", EL.parseKwh("1.312,5"), 1312.5);
eq("parse 312.5", EL.parseKwh("312.5"), 312.5);
eq("parse empty", isNaN(EL.parseKwh("")), true);
eq("parse text", isNaN(EL.parseKwh("abc")), true);
eq("parse negative", isNaN(EL.parseKwh("-5")), true);

// Forecast: 2027, 2,625 kWh through April, 375/month -> reaches 3,000 at the end of May -> 1 Aug 2027.
var r = EL.calculate({ year: 2027, usedKwh: 2625, throughMonth: 4, monthlyKwh: 375 });
eq("May case status", r.status, "willExceed");
eq("May case percent", r.percent, 87.5);
eq("May case remaining", r.remaining, 375);
eq("May case budget", r.monthlyBudget, 375 / 8);
eq("May case cross", r.crossMonth, { year: 2027, month: 5 });
eq("May case tariff", r.tariff, { year: 2027, month: 8, day: 1 });

// Forecast: 2026, 3,700 through September, 400/month -> passes 4,000 in October -> 1 Jan 2027.
r = EL.calculate({ year: 2026, usedKwh: 3700, throughMonth: 9, monthlyKwh: 400 });
eq("Oct-1 case: 3,500 at 400/month reaches in November", EL.calculate({ year: 2026, usedKwh: 3500, throughMonth: 9, monthlyKwh: 400 }).crossMonth, { year: 2026, month: 11 });
eq("Oct case cross", r.crossMonth, { year: 2026, month: 10 });
eq("Oct case tariff", r.tariff, { year: 2027, month: 1, day: 1 });

// Forecast: 2027, 2,800 through November, 250/month -> December -> 1 Mar 2028.
r = EL.calculate({ year: 2027, usedKwh: 2800, throughMonth: 11, monthlyKwh: 250 });
eq("Dec case cross", r.crossMonth, { year: 2027, month: 12 });
eq("Dec case tariff", r.tariff, { year: 2028, month: 3, day: 1 });

// Reaching the limit exactly counts as reaching it.
r = EL.calculate({ year: 2027, usedKwh: 2000, throughMonth: 8, monthlyKwh: 250 });
eq("exact reach month", r.crossMonth, { year: 2027, month: 12 });

// Under the limit at this pace.
r = EL.calculate({ year: 2027, usedKwh: 1000, throughMonth: 6, monthlyKwh: 200 });
eq("under status", r.status, "under");
eq("under year end", r.yearEndKwh, 2200);
eq("under tariff", r.tariff, null);

// Preview of 2027 from zero (December 2026 launch wave): 300/month -> 3,000 at the end of October -> 1 Jan 2028.
r = EL.calculate({ year: 2027, usedKwh: 0, throughMonth: 0, monthlyKwh: 300 });
eq("preview cross", r.crossMonth, { year: 2027, month: 10 });
eq("preview tariff", r.tariff, { year: 2028, month: 1, day: 1 });
eq("preview budget", r.monthlyBudget, 250);

// Already exceeded, walk back with the monthly figure: 4,300 through Oct at 300/month -> reached in September.
r = EL.calculate({ year: 2026, usedKwh: 4300, throughMonth: 10, monthlyKwh: 300 });
eq("exceeded status", r.status, "exceeded");
eq("exceeded remaining", r.remaining, 0);
eq("exceeded budget hidden", r.monthlyBudget, null);
eq("exceeded cross", r.crossMonth, { year: 2026, month: 9 });
eq("exceeded tariff", r.tariff, { year: 2026, month: 12, day: 1 });

// Already exceeded without a monthly figure: latest possible start date from the last covered month.
r = EL.calculate({ year: 2026, usedKwh: 4100, throughMonth: 10 });
eq("exceeded latest flag", r.tariffIsLatest, true);
eq("exceeded latest tariff", r.tariff, { year: 2027, month: 1, day: 1 });

// Year finished under the limit.
r = EL.calculate({ year: 2026, usedKwh: 3900, throughMonth: 12, monthlyKwh: 300 });
eq("year done status", r.status, "underYearDone");

// No monthly figure: no forecast, but budget is shown.
r = EL.calculate({ year: 2027, usedKwh: 600, throughMonth: 2 });
eq("no forecast status", r.status, "noForecast");
eq("no forecast budget", r.monthlyBudget, 240);

// Input errors.
eq("error month for used", EL.calculate({ year: 2027, usedKwh: 10, throughMonth: 0 }).error, "monthForUsed");
eq("error used", EL.calculate({ year: 2027, usedKwh: NaN, throughMonth: 1 }).error, "used");
eq("error month", EL.calculate({ year: 2027, usedKwh: 10, throughMonth: 13 }).error, "month");

// Default covered month.
eq("default same year", EL.defaultThroughMonth(2026, new Date(2026, 10, 26)), 10);
eq("default January", EL.defaultThroughMonth(2027, new Date(2027, 0, 15)), 0);
eq("default next year", EL.defaultThroughMonth(2027, new Date(2026, 11, 28)), 0);
eq("default past year", EL.defaultThroughMonth(2026, new Date(2027, 0, 3)), 12);

out(passed + " passed, " + failed + " failed");
if (failed > 0) {
  if (typeof process !== "undefined") process.exit(1);
  else throw new Error(failed + " test(s) failed");
}
