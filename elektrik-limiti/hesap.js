/* Elektrik Limiti — yearly residential electricity limit calculator (browser only).
   No network, no storage, no cookies: inputs are read from the form and results are written back to the page.
   Rule sources:
   - 2026 limit 4,000 kWh/yr: EPDK decision 13912, Resmi Gazete 31.10.2025 no. 33063
   - 2027 limit 3,000 kWh/yr: EPDK decision 15005, Resmi Gazete 31.10.2026 no. 33416
   - Start date: SKTT Communique art. 8(3), Resmi Gazete 20.01.2018 no. 30307 — the high tariff applies from the
     first day of the third calendar month after the calendar month in which the limit is reached; for consumers
     who were in this group before, it applies immediately. */
(function (root) {
  "use strict";

  var LIMITS = { 2026: 4000, 2027: 3000 }; // residential (mesken), kWh per calendar year
  var DELAY_MONTHS = 3;

  // First day of the third calendar month after (year, month). month is 1-12.
  function tariffStart(year, month) {
    var m = month + DELAY_MONTHS;
    var y = year;
    while (m > 12) { m -= 12; y += 1; }
    return { year: y, month: m, day: 1 };
  }

  // Accepts "3250", "3.250", "3 250", "312,5", "312.5". Returns NaN for anything else.
  function parseKwh(text) {
    if (text === null || text === undefined) return NaN;
    var s = String(text).trim().replace(/\s+/g, "");
    if (s === "") return NaN;
    if (s.indexOf(",") >= 0) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* input: { year, usedKwh, throughMonth (0 = nothing yet, 1-12 = total covers up to the end of that month),
              monthlyKwh (optional, >0 for a forecast), priorHigh: "no" | "yes" | "unknown" }
     Assumption (shown on the page): every remaining month uses monthlyKwh. */
  function calculate(input) {
    var year = input.year;
    var limit = LIMITS[year];
    if (!limit) return { error: "noLimit" };
    var used = input.usedKwh;
    var through = input.throughMonth;
    var monthly = input.monthlyKwh;
    var hasMonthly = typeof monthly === "number" && isFinite(monthly) && monthly > 0;
    if (!(typeof used === "number" && isFinite(used) && used >= 0)) return { error: "used" };
    if (!(through >= 0 && through <= 12 && Math.floor(through) === through)) return { error: "month" };
    if (through === 0 && used > 0) return { error: "monthForUsed" };
    if (typeof monthly === "number" && (!isFinite(monthly) || monthly < 0)) return { error: "monthly" };

    var r = {
      year: year,
      limit: limit,
      used: used,
      percent: used / limit * 100,
      remaining: Math.max(0, limit - used),
      monthsLeft: 12 - through,
      monthlyBudget: null,
      status: null,          // "exceeded" | "willExceed" | "under" | "underYearDone" | "noForecast"
      crossMonth: null,      // { year, month }
      crossEstimated: false,
      tariff: null,          // { year, month, day } for first-time entry
      tariffIsLatest: false, // exceeded without a monthly figure: start date given as "at the latest"
      yearEndKwh: null
    };

    if (used >= limit) {
      r.status = "exceeded";
      if (hasMonthly && through > 0) {
        // Walk back with the monthly average: cumulative at the end of month k = used - monthly * (through - k).
        var k = through - Math.floor((used - limit) / monthly);
        if (k < 1) k = 1;
        r.crossMonth = { year: year, month: k };
        r.crossEstimated = true;
      } else {
        r.crossMonth = { year: year, month: through };
        r.tariffIsLatest = true;
      }
      r.tariff = tariffStart(year, r.crossMonth.month);
      return r;
    }

    if (r.monthsLeft > 0) r.monthlyBudget = r.remaining / r.monthsLeft;

    if (r.monthsLeft === 0) {
      r.status = "underYearDone";
      r.yearEndKwh = used;
      return r;
    }
    if (!hasMonthly) {
      r.status = "noForecast";
      return r;
    }

    r.yearEndKwh = used + monthly * r.monthsLeft;
    var monthsToLimit = Math.ceil((limit - used) / monthly); // reaching the limit exactly counts ("erişildiği")
    var cross = through + monthsToLimit;
    if (cross > 12) {
      r.status = "under";
      return r;
    }
    r.status = "willExceed";
    r.crossMonth = { year: year, month: cross };
    r.crossEstimated = true;
    r.tariff = tariffStart(year, cross);
    return r;
  }

  // Default "total covers up to" month for a given year, relative to today.
  function defaultThroughMonth(year, today) {
    var cy = today.getFullYear();
    if (year < cy) return 12;
    if (year > cy) return 0;
    return today.getMonth(); // getMonth() is 0-based, so this is the previous month (0 in January)
  }

  var api = { LIMITS: LIMITS, tariffStart: tariffStart, parseKwh: parseKwh, calculate: calculate,
              defaultThroughMonth: defaultThroughMonth };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ElektrikLimiti = api;
})(typeof window !== "undefined" ? window : this);
