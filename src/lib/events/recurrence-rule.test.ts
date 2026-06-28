import { describe, expect, it } from "vitest";

import {
  buildRecurrenceRule,
  describeRecurrenceRule,
  parseRecurrenceRule,
  recurrenceValueFromPreset,
} from "@/lib/events/recurrence-rule";

const anchor = new Date("2026-03-19T18:00:00.000Z"); // Thursday in Paris

describe("buildRecurrenceRule", () => {
  it("builds weekly recurrence with weekday selection", () => {
    const rule = buildRecurrenceRule(
      {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        byWeekday: ["TU", "TH"],
        monthlyMode: "day_of_month",
        end: { type: "never" },
      },
      anchor,
      false,
    );

    expect(rule).toBe("RRULE:FREQ=WEEKLY;BYDAY=TU,TH");
  });

  it("builds bi-weekly recurrence", () => {
    const rule = buildRecurrenceRule(
      recurrenceValueFromPreset("biweekly", anchor, {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        byWeekday: ["TH"],
        monthlyMode: "day_of_month",
        end: { type: "never" },
      }),
      anchor,
      false,
    );

    expect(rule).toBe("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TH");
  });

  it("builds monthly nth weekday recurrence", () => {
    const rule = buildRecurrenceRule(
      recurrenceValueFromPreset("monthly_weekday", anchor, {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        byWeekday: ["TH"],
        monthlyMode: "nth_weekday",
        end: { type: "never" },
      }),
      anchor,
      false,
    );

    expect(rule).toBe("RRULE:FREQ=MONTHLY;BYDAY=3TH");
  });

  it("builds recurrence ending after a count", () => {
    const rule = buildRecurrenceRule(
      {
        enabled: true,
        frequency: "daily",
        interval: 1,
        byWeekday: ["TH"],
        monthlyMode: "day_of_month",
        end: { type: "count", count: 10 },
      },
      anchor,
      false,
    );

    expect(rule).toBe("RRULE:FREQ=DAILY;COUNT=10");
  });

  it("returns null when recurrence is disabled", () => {
    expect(
      buildRecurrenceRule(
        {
          enabled: false,
          frequency: "weekly",
          interval: 1,
          byWeekday: ["TH"],
          monthlyMode: "day_of_month",
          end: { type: "never" },
        },
        anchor,
        false,
      ),
    ).toBeNull();
  });
});

describe("parseRecurrenceRule", () => {
  it("round-trips a weekly rule", () => {
    const stored = "RRULE:FREQ=WEEKLY;BYDAY=TU,TH";
    const parsed = parseRecurrenceRule(stored, anchor);

    expect(parsed.enabled).toBe(true);
    expect(parsed.frequency).toBe("weekly");
    expect(parsed.byWeekday).toEqual(["TU", "TH"]);
    expect(buildRecurrenceRule(parsed, anchor, false)).toBe(stored);
  });

  it("parses monthly nth weekday rules", () => {
    const parsed = parseRecurrenceRule("RRULE:FREQ=MONTHLY;BYDAY=3TH", anchor);

    expect(parsed.frequency).toBe("monthly");
    expect(parsed.monthlyMode).toBe("nth_weekday");
  });

  it("parses count and until endings", () => {
    expect(
      parseRecurrenceRule("RRULE:FREQ=DAILY;COUNT=5", anchor).end,
    ).toEqual({ type: "count", count: 5 });

    expect(
      parseRecurrenceRule("RRULE:FREQ=WEEKLY;UNTIL=20261231T215959Z", anchor)
        .end,
    ).toEqual({ type: "until", date: "2026-12-31" });
  });
});

describe("describeRecurrenceRule", () => {
  it("describes weekly recurrence in French", () => {
    expect(
      describeRecurrenceRule(
        {
          enabled: true,
          frequency: "weekly",
          interval: 1,
          byWeekday: ["TU"],
          monthlyMode: "day_of_month",
          end: { type: "never" },
        },
        anchor,
      ),
    ).toBe("Toutes les semaines, le mardi");
  });
});
