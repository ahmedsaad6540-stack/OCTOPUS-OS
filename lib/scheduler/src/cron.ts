/**
 * A real, minimal parser for standard 5-field cron expressions
 * (`minute hour day-of-month month day-of-week`). Supports `*`, single
 * values, comma lists (`1,2,3`), ranges (`1-5`), and step suffixes (a
 * wildcard or range followed by `/N`, e.g. every-15-minutes or `1-10`
 * stepped by 2) — the common subset most scheduling needs actually use.
 * Deliberately doesn't support `@daily`-style aliases, seconds, or
 * timezone-qualified expressions; those are real gaps, not silently
 * faked, and would be an explicit future enhancement.
 */

export interface CronSchedule {
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
}

const FIELD_RANGES = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
} as const;

function parseField(field: string, [min, max]: readonly [number, number]): Set<number> {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart !== undefined ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`Invalid cron step "${part}"`);
    }

    let rangeMin = min;
    let rangeMax = max;
    if (rangePart !== "*") {
      const rangeMatch = /^(\d+)(?:-(\d+))?$/.exec(rangePart!);
      if (!rangeMatch) throw new Error(`Invalid cron field segment "${part}"`);
      rangeMin = Number(rangeMatch[1]);
      rangeMax = rangeMatch[2] !== undefined ? Number(rangeMatch[2]) : rangeMin;
    }

    if (rangeMin < min || rangeMax > max || rangeMin > rangeMax) {
      throw new Error(`Cron field segment "${part}" is out of range [${min}, ${max}]`);
    }

    for (let v = rangeMin; v <= rangeMax; v += step) {
      values.add(v);
    }
  }

  return values;
}

/** Parses a standard 5-field cron expression. Throws on anything malformed rather than silently accepting it. */
export function parseCronExpression(expression: string): CronSchedule {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Cron expression must have exactly 5 fields, got ${fields.length}: "${expression}"`);
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string];

  return {
    minutes: parseField(minute, FIELD_RANGES.minute),
    hours: parseField(hour, FIELD_RANGES.hour),
    daysOfMonth: parseField(dayOfMonth, FIELD_RANGES.dayOfMonth),
    months: parseField(month, FIELD_RANGES.month),
    daysOfWeek: parseField(dayOfWeek, FIELD_RANGES.dayOfWeek),
  };
}

const MAX_MINUTES_TO_SEARCH = 4 * 366 * 24 * 60; // ~4 years, generously covers any real schedule

/**
 * Finds the next minute-aligned instant strictly after `from` that matches
 * `schedule`, by stepping forward one minute at a time — the same
 * brute-force approach most cron implementations actually use internally,
 * since cron schedules are minute-granular by definition. Operates in UTC.
 */
export function getNextRunTime(schedule: CronSchedule, from: Date): Date {
  const candidate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), from.getUTCHours(), from.getUTCMinutes() + 1, 0, 0));

  for (let i = 0; i < MAX_MINUTES_TO_SEARCH; i++) {
    if (
      schedule.minutes.has(candidate.getUTCMinutes()) &&
      schedule.hours.has(candidate.getUTCHours()) &&
      schedule.daysOfMonth.has(candidate.getUTCDate()) &&
      schedule.months.has(candidate.getUTCMonth() + 1) &&
      schedule.daysOfWeek.has(candidate.getUTCDay())
    ) {
      return candidate;
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("Could not find a matching cron run time within 4 years — check the expression");
}

/** Computes the next run time for either kind of `ScheduleSpec`. */
export function computeNextRunAt(
  schedule: { type: "cron"; expression: string } | { type: "interval"; intervalMs: number },
  from: Date,
): string {
  if (schedule.type === "interval") {
    return new Date(from.getTime() + schedule.intervalMs).toISOString();
  }
  return getNextRunTime(parseCronExpression(schedule.expression), from).toISOString();
}
