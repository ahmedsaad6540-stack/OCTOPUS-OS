import { and, eq, like } from "drizzle-orm";
import { graphNodesTable, graphEdgesTable, knowledgeGraphTable } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { GraphNode, GraphEdge, GraphPath, KnowledgeGraphStore, NodeType } from "./types.js";
import { randomUUID } from "node:crypto";

type Db = NodePgDatabase<any>;

function toGraphNode(row: typeof graphNodesTable.$inferSelect): GraphNode {
  return {
    id: row.id,
    type: row.type as NodeType,
    label: row.label,
    properties: (row.properties as Record<string, unknown>) ?? {},
    userId: row.userId ?? undefined,
    createdAt: row.createdAt,
  };
}

function toGraphEdge(row: typeof graphEdgesTable.$inferSelect): GraphEdge {
  return {
    id: row.id,
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    relation: row.relation,
    weight: row.weight ?? 1.0,
    properties: (row.properties as Record<string, unknown>) ?? {},
    userId: row.userId ?? undefined,
    createdAt: row.createdAt,
  };
}

export class DrizzleKnowledgeGraphStore implements KnowledgeGraphStore {
  constructor(private readonly db: Db) {}

  async addNode(node: Omit<GraphNode, 'id' | 'createdAt'>): Promise<GraphNode> {
    const id = randomUUID();
    const now = new Date();
    await this.db.insert(graphNodesTable).values({
      id,
      type: node.type,
      label: node.label,
      properties: node.properties,
      userId: node.userId ?? null,
      createdAt: now,
    });
    return { ...node, id, createdAt: now };
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const rows = await this.db
      .select()
      .from(graphNodesTable)
      .where(eq(graphNodesTable.id, id))
      .limit(1);
    return rows[0] ? toGraphNode(rows[0]) : null;
  }

  async findNodes(type: NodeType, label?: string): Promise<GraphNode[]> {
    const conditions = [eq(graphNodesTable.type, type)];
    if (label) conditions.push(like(graphNodesTable.label, `%${label}%`));
    const rows = await this.db
      .select()
      .from(graphNodesTable)
      .where(and(...conditions));
    return rows.map(toGraphNode);
  }

  async addEdge(edge: Omit<GraphEdge, 'id' | 'createdAt'>): Promise<GraphEdge> {
    const id = randomUUID();
    const now = new Date();
    await this.db.insert(graphEdgesTable).values({
      id,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      relation: edge.relation,
      weight: edge.weight,
      properties: edge.properties,
      userId: edge.userId ?? null,
      createdAt: now,
    });
    return { ...edge, id, createdAt: now };
  }

  async getEdges(fromNodeId: string, relation?: string): Promise<GraphEdge[]> {
    const conditions = [eq(graphEdgesTable.fromNodeId, fromNodeId)];
    if (relation) conditions.push(eq(graphEdgesTable.relation, relation));
    const rows = await this.db
      .select()
      .from(graphEdgesTable)
      .where(and(...conditions));
    return rows.map(toGraphEdge);
  }

  async traverse(fromNodeId: string, relation: string, depth = 2): Promise<GraphNode[]> {
    const visited = new Set<string>();
    const result: GraphNode[] = [];
    const queue: { nodeId: string; depth: number }[] = [{ nodeId: fromNodeId, depth: 0 }];

    while (queue.length > 0) {
      const { nodeId, depth: currentDepth } = queue.shift()!;
      if (visited.has(nodeId) || currentDepth > depth) continue;
      visited.add(nodeId);

      const outgoing = await this.getEdges(nodeId, relation);
      for (const edge of outgoing) {
        const neighbor = await this.getNode(edge.toNodeId);
        if (neighbor && !visited.has(neighbor.id)) {
          result.push(neighbor);
          queue.push({ nodeId: neighbor.id, depth: currentDepth + 1 });
        }
      }
    }
    return result;
  }

  async pathQuery(fromNodeId: string, toNodeId: string): Promise<GraphPath[]> {
    const queue: { path: GraphNode[]; edges: GraphEdge[] }[] = [];
    const startNode = await this.getNode(fromNodeId);
    if (!startNode) return [];
    queue.push({ path: [startNode], edges: [] });

    const paths: GraphPath[] = [];
    const visited = new Set<string>();

    while (queue.length > 0 && paths.length < 5) {
      const { path, edges } = queue.shift()!;
      const current = path[path.length - 1];
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.id === toNodeId) {
        const totalWeight = edges.reduce((sum, e) => sum + e.weight, 0);
        paths.push({ nodes: [...path], edges: [...edges], totalWeight });
        continue;
      }

      const outgoing = await this.getEdges(current.id);
      for (const edge of outgoing) {
        const neighbor = await this.getNode(edge.toNodeId);
        if (neighbor && !visited.has(neighbor.id)) {
          queue.push({ path: [...path, neighbor], edges: [...edges, edge] });
        }
      }
    }
    return paths.sort((a, b) => b.totalWeight - a.totalWeight);
  }

  async addTriple(subject: string, predicate: string, object: string, userId?: string): Promise<void> {
    const id = randomUUID();
    await this.db.insert(knowledgeGraphTable).values({
      id,
      subject,
      predicate,
      object,
      userId: userId ?? null,
    });
  }

  async queryTriples(subject?: string, predicate?: string, object?: string): Promise<{ subject: string; predicate: string; object: string }[]> {
    const conditions = [];
    if (subject) conditions.push(eq(knowledgeGraphTable.subject, subject));
    if (predicate) conditions.push(eq(knowledgeGraphTable.predicate, predicate));
    if (object) conditions.push(eq(knowledgeGraphTable.object, object));

    const rows = await this.db
      .select()
      .from(knowledgeGraphTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return rows.map(r => ({
      subject: r.subject,
      predicate: r.predicate,
      object: r.object,
    }));
  }
}
