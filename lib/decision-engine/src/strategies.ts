import type { ArbitrationCandidate, ArbitrationStrategy } from "./types.js";

/**
 * Every actionable candidate acts, independently. This is the historical
 * Brain behavior (every matching rule acts on its own) and the default for
 * `DecisionEngine` so adding arbitration never silently changes existing
 * deployments that only ever had one rule matching any given event type.
 */
export const allMatchStrategy: ArbitrationStrategy = {
  name: "all-match",
  arbitrate(candidates) {
    return [...candidates];
  },
};

/** Only the first-registered candidate acts; every other candidate is superseded. */
export const firstMatchStrategy: ArbitrationStrategy = {
  name: "first-match",
  arbitrate(candidates) {
    return candidates.length > 0 ? [candidates[0]!] : [];
  },
};

/**
 * The highest-`priority` candidate acts; ties go to whichever of the tied
 * candidates was registered first (candidates arrive in registration
 * order, so a stable `reduce` preserves that). Every other candidate is
 * superseded.
 */
export const priorityStrategy: ArbitrationStrategy = {
  name: "priority",
  arbitrate(candidates) {
    if (candidates.length === 0) return [];
    const winner = candidates.reduce((best, candidate) =>
      candidate.priority > best.priority ? candidate : best,
    );
    return [winner];
  },
};
