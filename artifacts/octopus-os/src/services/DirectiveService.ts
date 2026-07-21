import { Directive } from "../domain/models/directive";
import { DirectiveRepository } from "../repositories/DirectiveRepository";
import { BaseService } from "./BaseService";
import { apiClient } from "../core/ApiClient";

export class DirectiveService extends BaseService<DirectiveRepository, Directive> {
  constructor(directiveRepo: DirectiveRepository) {
    super(directiveRepo);
  }

  public async getDirectives(): Promise<Directive[]> {
    let directives = await this.repository.list();
    if (directives.length === 0) {
      directives = [
        {
          id: "dir-1",
          name: "Viral Weight Loss Campaign",
          category: "campaign",
          systemPrompt: "You are an expert affiliate marketer specializing in health & wellness products. Your campaigns must be emotionally compelling, highlight transformation stories, and drive immediate action.",
          userDirective: "Create a 30-day campaign targeting people aged 25-45 who want to lose weight. Focus on before/after transformations. Use urgency (limited time offers). Target TikTok and Instagram Reels. Promote Digistore24 weight loss products. Generate 3 videos per day.",
          platforms: ["TikTok", "Instagram"],
          affiliateNetwork: "Digistore24",
          tone: "Inspiring",
          language: "Arabic",
          createdAt: new Date().toISOString(),
          campaignCount: 3,
        }
      ];
      await this.repository.saveAll(directives);
    }
    return directives;
  }

  public async saveDirective(directive: Directive): Promise<Directive> {
    const directives = await this.getDirectives();
    const index = directives.findIndex(d => d.id === directive.id);
    if (index === -1) {
      directives.unshift(directive);
    } else {
      directives[index] = directive;
    }
    await this.repository.saveAll(directives);
    return directive;
  }

  public async testPrompt(token: string, prompt: string, agentName: string, systemPrompt: string): Promise<string> {
    const data = await apiClient.post<{ reply?: string; error?: string }>("/chat", {
      message: prompt,
      agentId: "prompt-studio-test",
      agentName,
      systemPrompt
    }, { token });
    
    return data.reply ?? JSON.stringify(data, null, 2);
  }

  public async optimizePrompt(token: string, directive: Directive): Promise<Directive> {
    const improved = { ...directive, systemPrompt: directive.systemPrompt + "\n\n[Optimized by Brain]" };
    return this.saveDirective(improved);
  }
}
