import type { BusinessPolicy, PolicyContext, PolicyDecision } from "../types.js";

const DEFAULT_BANNED: string[] = [
  "gambling", "casino", "adult", "porn", "drugs", "weapons", "crypto-scam",
  "mlm", "pyramid", "payday-loan", "counterfeit", "hacking",
];

export class BannedNichesPolicy implements BusinessPolicy {
  readonly id = "BANNED_NICHES";
  readonly name = "Banned Niches Blocklist";
  readonly description = "Blocks any campaign or product in prohibited niches";
  readonly category = "ethical" as const;

  private readonly blocklist: Set<string>;

  constructor(additionalBanned: string[] = []) {
    this.blocklist = new Set([...DEFAULT_BANNED, ...additionalBanned].map(n => n.toLowerCase()));
  }

  evaluate(context: PolicyContext): PolicyDecision {
    const niche = (context.niche ?? "").toLowerCase();
    if (!niche) return { kind: "allow", policyId: this.id, reason: "No niche specified." };
    for (const banned of this.blocklist) {
      if (niche.includes(banned)) {
        return {
          kind: "block",
          policyId: this.id,
          reason: `Niche "${niche}" matches banned category "${banned}". This violates company ethical policy.`,
        };
      }
    }
    return { kind: "allow", policyId: this.id, reason: `Niche "${niche}" is not in the blocklist.` };
  }
}
