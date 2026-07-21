import { Directive } from "../domain/models/directive";
import { z } from "zod";

export const DirectiveSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(["campaign", "content", "audience", "monetization", "custom"]),
  systemPrompt: z.string(),
  userDirective: z.string(),
  platforms: z.array(z.string()),
  affiliateNetwork: z.string(),
  tone: z.string(),
  language: z.string(),
  createdAt: z.string(),
  lastUsed: z.string().optional(),
  campaignCount: z.number().default(0),
});

export class DirectiveRepository {
  private readonly storageKey = "octopus_directives";

  async list(): Promise<Directive[]> {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return z.array(DirectiveSchema).parse(parsed) as Directive[];
    } catch {
      return [];
    }
  }

  async saveAll(directives: Directive[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(directives));
  }
}
