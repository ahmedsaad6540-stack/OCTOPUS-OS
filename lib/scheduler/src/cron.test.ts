import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCronExpression, getNextRunTime, computeNextRunAt } from "./cron.js";

describe("parseCronExpression", () => {
  test("parses wildcards as full ranges", () => {
    const schedule = parseCronExpression("* * * * *");
    assert.equal(schedule.minutes.size, 60);
    assert.equal(schedule.hours.size, 24);
    assert.equal(schedule.daysOfMonth.size, 31);
    assert.equal(schedule.months.size, 12);
    assert.equal(schedule.daysOfWeek.size, 7);
  });

  test("parses single values", () => {
    const schedule = parseCronExpression("30 9 1 1 0");
    assert.deepEqual([...schedule.minutes], [30]);
    assert.deepEqual([...schedule.hours], [9]);
    assert.deepEqual([...schedule.daysOfMonth], [1]);
    assert.deepEqual([...schedule.months], [1]);
    assert.deepEqual([...schedule.daysOfWeek], [0]);
  });

  test("parses comma lists", () => {
    const schedule = parseCronExpression("0,15,30,45 * * * *");
    assert.deepEqual([...schedule.minutes].sort((a, b) => a - b), [0, 15, 30, 45]);
  });

  test("parses ranges", () => {
    const schedule = parseCronExpression("0 9-17 * * *");
    assert.deepEqual([...schedule.hours].sort((a, b) => a - b), [9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  test("parses steps on a wildcard", () => {
    const schedule = parseCronExpression("*/15 * * * *");
    assert.deepEqual([...schedule.minutes].sort((a, b) => a - b), [0, 15, 30, 45]);
  });

  test("parses steps on a range", () => {
    const schedule = parseCronExpression("0 0-10/2 * * *");
    assert.deepEqual([...schedule.hours].sort((a, b) => a - b), [0, 2, 4, 6, 8, 10]);
  });

  test("throws for the wrong number of fields", () => {
    assert.throws(() => parseCronExpression("* * * *"), /exactly 5 fields/);
    assert.throws(() => parseCronExpression("* * * * * *"), /exactly 5 fields/);
  });

  test("throws for an out-of-range value", () => {
    assert.throws(() => parseCronExpression("60 * * * *"), /out of range/);
    assert.throws(() => parseCronExpression("* 24 * * *"), /out of range/);
  });

  test("throws for a malformed segment", () => {
    assert.throws(() => parseCronExpression("abc * * * *"), /Invalid cron field segment/);
  });
});

describe("getNextRunTime", () => {
  test("finds the next occurrence of an exact minute/hour combination", () => {
    const schedule = parseCronExpression("30 9 * * *");
    const from = new Date(Date.UTC(2026, 0, 1, 8, 0, 0)); // Jan 1 2026, 08:00 UTC
    const next = getNextRunTime(schedule, from);
    assert.equal(next.toISOString(), "2026-01-01T09:30:00.000Z");
  });

  test("rolls over to the next day when today's time has passed", () => {
    const schedule = parseCronExpression("30 9 * * *");
    const from = new Date(Date.UTC(2026, 0, 1, 10, 0, 0)); // after 09:30 already
    const next = getNextRunTime(schedule, from);
    assert.equal(next.toISOString(), "2026-01-02T09:30:00.000Z");
  });

  test("is always strictly after `from`, even exactly on a match", () => {
    const schedule = parseCronExpression("0 * * * *");
    const from = new Date(Date.UTC(2026, 0, 1, 9, 0, 0)); // exactly on the hour
    const next = getNextRunTime(schedule, from);
    assert.equal(next.toISOString(), "2026-01-01T10:00:00.000Z");
  });

  test("respects day-of-week constraints", () => {
    // Every Monday (1) at 09:00. 2026-01-01 is a Thursday.
    const schedule = parseCronExpression("0 9 * * 1");
    const from = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const next = getNextRunTime(schedule, from);
    assert.equal(next.getUTCDay(), 1);
    assert.equal(next.toISOString(), "2026-01-05T09:00:00.000Z");
  });
});

describe("computeNextRunAt", () => {
  test("adds intervalMs for an interval schedule", () => {
    const from = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const next = computeNextRunAt({ type: "interval", intervalMs: 60_000 }, from);
    assert.equal(next, "2026-01-01T00:01:00.000Z");
  });

  test("delegates to getNextRunTime for a cron schedule", () => {
    const from = new Date(Date.UTC(2026, 0, 1, 8, 0, 0));
    const next = computeNextRunAt({ type: "cron", expression: "30 9 * * *" }, from);
    assert.equal(next, "2026-01-01T09:30:00.000Z");
  });
});
