import { and, desc, eq } from "drizzle-orm";
import { toolsTable, type ToolRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { JsonSchema, ToolDefinition, ToolDefinitionStore, ToolListQuery, ToolStatus } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toTool(record: ToolRecord): ToolDefinition {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    inputSchema: record.inputSchema as JsonSchema,
    handlerName: record.handlerName,
    status: record.status as ToolStatus,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleToolStore implements ToolDefinitionStore {
  constructor(private readonly db: Db) {}

  async insert(tool: ToolDefinition): Promise<ToolDefinition> {
    await this.db.insert(toolsTable).values({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handlerName: tool.handlerName,
      status: tool.status,
      userId: tool.userId ?? null,
      createdAt: new Date(tool.createdAt),
      updatedAt: new Date(tool.updatedAt),
    });
    return tool;
  }

  async update(id: string, tool: ToolDefinition): Promise<ToolDefinition | null> {
    const rows = await this.db
      .update(toolsTable)
      .set({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        handlerName: tool.handlerName,
        status: tool.status,
        updatedAt: new Date(tool.updatedAt),
      })
      .where(eq(toolsTable.id, id))
      .returning();
    return rows[0] ? toTool(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(toolsTable).where(eq(toolsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<ToolDefinition | null> {
    const rows = await this.db.select().from(toolsTable).where(eq(toolsTable.id, id)).limit(1);
    return rows[0] ? toTool(rows[0]) : null;
  }

  async getByName(name: string): Promise<ToolDefinition | null> {
    const rows = await this.db.select().from(toolsTable).where(eq(toolsTable.name, name)).limit(1);
    return rows[0] ? toTool(rows[0]) : null;
  }

  async list(query: ToolListQuery): Promise<ToolDefinition[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(toolsTable.status, query.status));
    if (query.handlerName) conditions.push(eq(toolsTable.handlerName, query.handlerName));
    if (query.userId) conditions.push(eq(toolsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(toolsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(toolsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toTool);
  }
}
