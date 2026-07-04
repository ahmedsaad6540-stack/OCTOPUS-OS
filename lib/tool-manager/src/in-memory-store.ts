import type { ToolDefinition, ToolDefinitionStore, ToolListQuery } from "./types.js";

/** In-memory tool store for unit tests and local scripts. The api-server always wires up `DrizzleToolStore`. */
export class InMemoryToolStore implements ToolDefinitionStore {
  private readonly tools = new Map<string, ToolDefinition>();

  async insert(tool: ToolDefinition): Promise<ToolDefinition> {
    this.tools.set(tool.id, { ...tool });
    return { ...tool };
  }

  async update(id: string, tool: ToolDefinition): Promise<ToolDefinition | null> {
    if (!this.tools.has(id)) return null;
    this.tools.set(id, { ...tool });
    return { ...tool };
  }

  async delete(id: string): Promise<boolean> {
    return this.tools.delete(id);
  }

  async getById(id: string): Promise<ToolDefinition | null> {
    const tool = this.tools.get(id);
    return tool ? { ...tool } : null;
  }

  async getByName(name: string): Promise<ToolDefinition | null> {
    const tool = Array.from(this.tools.values()).find((t) => t.name === name);
    return tool ? { ...tool } : null;
  }

  async list(query: ToolListQuery): Promise<ToolDefinition[]> {
    let results = Array.from(this.tools.values());
    if (query.status) results = results.filter((t) => t.status === query.status);
    if (query.handlerName) results = results.filter((t) => t.handlerName === query.handlerName);
    if (query.userId) results = results.filter((t) => t.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((t) => ({ ...t }));
  }
}
