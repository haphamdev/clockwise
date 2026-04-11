import { describe, expect, it } from "vitest";
import {
  defaultTimeWindow,
  detectRolling,
  formatDateISO,
  formatTimeWindowLabel,
  isPresetMatch,
  parseDateISO,
  resolvePreset,
  resolveRolling,
} from "./time-window-utils";

// Pin "today" to Wednesday 2025-03-19 for deterministic tests
const today = new Date(2025, 2, 19); // March 19, 2025 (Wed)

describe("resolvePreset", () => {
  it("today → same day", () => {
    expect(resolvePreset("today", today)).toEqual({
      dateFrom: "2025-03-19",
      dateTo: "2025-03-19",
      preset: "today",
    });
  });

  it("yesterday → day before", () => {
    expect(resolvePreset("yesterday", today)).toEqual({
      dateFrom: "2025-03-18",
      dateTo: "2025-03-18",
      preset: "yesterday",
    });
  });

  it("this-week → Mon to today (weekStartsOn: 1)", () => {
    expect(resolvePreset("this-week", today)).toEqual({
      dateFrom: "2025-03-17", // Monday
      dateTo: "2025-03-19",
      preset: "this-week",
    });
  });

  it("last-week → Mon-Sun of previous week", () => {
    expect(resolvePreset("last-week", today)).toEqual({
      dateFrom: "2025-03-10", // Monday
      dateTo: "2025-03-16", // Sunday
      preset: "last-week",
    });
  });

  it("this-month → 1st of month to today", () => {
    expect(resolvePreset("this-month", today)).toEqual({
      dateFrom: "2025-03-01",
      dateTo: "2025-03-19",
      preset: "this-month",
    });
  });

  it("last-month → full previous month", () => {
    expect(resolvePreset("last-month", today)).toEqual({
      dateFrom: "2025-02-01",
      dateTo: "2025-02-28",
      preset: "last-month",
    });
  });

  it("this-quarter → start of Q1 to today", () => {
    expect(resolvePreset("this-quarter", today)).toEqual({
      dateFrom: "2025-01-01",
      dateTo: "2025-03-19",
      preset: "this-quarter",
    });
  });

  it("last-quarter → full Q4 2024", () => {
    expect(resolvePreset("last-quarter", today)).toEqual({
      dateFrom: "2024-10-01",
      dateTo: "2024-12-31",
      preset: "last-quarter",
    });
  });

  it("last-week when today is Monday", () => {
    const monday = new Date(2025, 2, 17);
    expect(resolvePreset("last-week", monday)).toEqual({
      dateFrom: "2025-03-10",
      dateTo: "2025-03-16",
      preset: "last-week",
    });
  });

  it("this-week when today is Monday → single day", () => {
    const monday = new Date(2025, 2, 17);
    expect(resolvePreset("this-week", monday)).toEqual({
      dateFrom: "2025-03-17",
      dateTo: "2025-03-17",
      preset: "this-week",
    });
  });

  it("last-quarter at quarter boundary (Apr 1 → Q1)", () => {
    const apr1 = new Date(2025, 3, 1);
    expect(resolvePreset("last-quarter", apr1)).toEqual({
      dateFrom: "2025-01-01",
      dateTo: "2025-03-31",
      preset: "last-quarter",
    });
  });

  it("last-quarter mid-Q3 → Q2", () => {
    const aug15 = new Date(2025, 7, 15);
    expect(resolvePreset("last-quarter", aug15)).toEqual({
      dateFrom: "2025-04-01",
      dateTo: "2025-06-30",
      preset: "last-quarter",
    });
  });

  it("this-month when today is the 1st → single day", () => {
    const mar1 = new Date(2025, 2, 1);
    expect(resolvePreset("this-month", mar1)).toEqual({
      dateFrom: "2025-03-01",
      dateTo: "2025-03-01",
      preset: "this-month",
    });
  });
});

describe("resolveRolling", () => {
  it("last 7 days", () => {
    expect(resolveRolling(7, "days", today)).toEqual({
      dateFrom: "2025-03-12",
      dateTo: "2025-03-19",
    });
  });

  it("last 2 weeks", () => {
    expect(resolveRolling(2, "weeks", today)).toEqual({
      dateFrom: "2025-03-05",
      dateTo: "2025-03-19",
    });
  });

  it("last 3 months", () => {
    expect(resolveRolling(3, "months", today)).toEqual({
      dateFrom: "2024-12-19",
      dateTo: "2025-03-19",
    });
  });

  it("last 1 month handles varying month lengths", () => {
    const march31 = new Date(2025, 2, 31);
    // subMonths(March 31) → Feb 28
    expect(resolveRolling(1, "months", march31)).toEqual({
      dateFrom: "2025-02-28",
      dateTo: "2025-03-31",
    });
  });
});

describe("defaultTimeWindow", () => {
  it("returns last 30 days", () => {
    expect(defaultTimeWindow(today)).toEqual({
      dateFrom: "2025-02-17",
      dateTo: "2025-03-19",
    });
  });
});

describe("formatTimeWindowLabel", () => {
  it('detects "Today" preset', () => {
    const w = resolvePreset("today", today);
    expect(formatTimeWindowLabel(w)).toBe("Today");
  });

  it('detects "This week" preset', () => {
    const w = resolvePreset("this-week", today);
    expect(formatTimeWindowLabel(w)).toBe("This week");
  });

  it('detects "Last quarter" preset', () => {
    const w = resolvePreset("last-quarter", today);
    expect(formatTimeWindowLabel(w)).toBe("Last quarter");
  });

  it("formats single-day non-preset range", () => {
    expect(
      formatTimeWindowLabel({ dateFrom: "2025-01-15", dateTo: "2025-01-15" }),
    ).toBe("Jan 15, 2025");
  });

  it("formats same-year range", () => {
    expect(
      formatTimeWindowLabel({ dateFrom: "2025-02-01", dateTo: "2025-03-15" }),
    ).toBe("Feb 1 – Mar 15, 2025");
  });

  it("formats cross-year range", () => {
    expect(
      formatTimeWindowLabel({ dateFrom: "2024-12-01", dateTo: "2025-01-15" }),
    ).toBe("Dec 1, 2024 – Jan 15, 2025");
  });

  it("formats default 30-day window as date range (not a preset)", () => {
    const w = defaultTimeWindow(today);
    const label = formatTimeWindowLabel(w);
    // Last 30 days doesn't match any preset → falls back to range format
    expect(label).toBe("Feb 17 – Mar 19, 2025");
  });

  it('this-month on the 1st shows "This month" (preset tag disambiguates)', () => {
    const mar1 = new Date(2025, 2, 1);
    const w = resolvePreset("this-month", mar1);
    expect(formatTimeWindowLabel(w)).toBe("This month");
  });
});

describe("isPresetMatch", () => {
  it("returns true for a matching preset", () => {
    const w = resolvePreset("this-week", today);
    expect(isPresetMatch(w)).toBe(true);
  });

  it("returns false for a custom range", () => {
    expect(
      isPresetMatch({ dateFrom: "2025-02-01", dateTo: "2025-03-15" }),
    ).toBe(false);
  });

  it("returns false for a rolling window that is not a preset", () => {
    const w = resolveRolling(7, "days", today);
    expect(isPresetMatch(w)).toBe(false);
  });
});

describe("detectRolling", () => {
  it("detects days", () => {
    const w = resolveRolling(10, "days", today);
    expect(detectRolling(w, today)).toEqual({ n: 10, unit: "days" });
  });

  it("detects weeks (14 days → 2 weeks)", () => {
    const w = resolveRolling(2, "weeks", today);
    expect(detectRolling(w, today)).toEqual({ n: 2, unit: "weeks" });
  });

  it("detects months", () => {
    const w = resolveRolling(3, "months", today);
    expect(detectRolling(w, today)).toEqual({ n: 3, unit: "months" });
  });

  it("prefers months over days when both could match", () => {
    // 1 month back from Mar 19 = Feb 19 (28 days, divisible by 7)
    const w = resolveRolling(1, "months", today);
    expect(detectRolling(w, today)).toEqual({ n: 1, unit: "months" });
  });

  it("returns null when dateTo is not today", () => {
    expect(
      detectRolling({ dateFrom: "2025-01-01", dateTo: "2025-02-15" }, today),
    ).toBeNull();
  });

  it("returns null for same-day range (0 diff)", () => {
    expect(
      detectRolling({ dateFrom: "2025-03-19", dateTo: "2025-03-19" }, today),
    ).toBeNull();
  });
});

describe("formatDateISO / parseDateISO", () => {
  it("roundtrips correctly", () => {
    const d = new Date(2025, 0, 9); // Jan 9
    expect(formatDateISO(d)).toBe("2025-01-09");
    expect(parseDateISO("2025-01-09").getTime()).toBe(d.getTime());
  });

  it("parseDateISO creates local midnight (no timezone shift)", () => {
    const d = parseDateISO("2025-06-15");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // June
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });
});
