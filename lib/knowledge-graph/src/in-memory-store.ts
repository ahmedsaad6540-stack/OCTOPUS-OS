import { randomUUID } from "node:crypto";
import type { GraphNode, GraphEdge, GraphPath, KnowledgeGraphStore, NodeType } from "./types.js";

export class InMemoryKnowledgeGraphStore implements KnowledgeGraphStore {
  private readonly nodes: GraphNode[] = [];
  private readonly edges: GraphEdge[] = [];
  private readonly triples: { subject: string; predicate: string; object: string; userId?: string }[] = [];

  async addNode(node: Omit<GraphNode, 'id' | 'createdAt'>): Promise<GraphNode> {
    const record: GraphNode = { ...node, id: randomUUID(), createdAt: new Date() };
    this.nodes.push(record);
    return record;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.nodes.find(n => n.id === id) ?? null;
  }

  async findNodes(type: NodeType, label?: string): Promise<GraphNode[]> {
    return this.nodes.filter(n => n.type === type && (!label || n.label.includes(label)));
  }

  async addEdge(edge: Omit<GraphEdge, 'id' | 'createdAt'>): Promise<GraphEdge> {
    const record: GraphEdge = { ...edge, id: randomUUID(), createdAt: new Date() };
    this.edges.push(record);
    return record;
  }

  async getEdges(fromNodeId: string, relation?: string): Promise<GraphEdge[]> {
    return this.edges.filter(e => e.fromNodeId === fromNodeId && (!relation || e.relation === relation));
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
    this.triples.push({ subject, predicate, object, userId });
  }

  async queryTriples(subject?: string, predicate?: string, object?: string): Promise<{ subject: string; predicate: string; object: string }[]> {
    return this.triples.filter(t =>
      (!subject || t.subject === subject) &&
      (!predicate || t.predicate === predicate) &&
      (!object || t.object === object)
    );
  }
}
