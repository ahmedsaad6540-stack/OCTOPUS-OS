export type NodeType =
  | 'product' | 'keyword' | 'video' | 'landing_page'
  | 'affiliate_network' | 'sale_event' | 'roi_record'
  | 'country' | 'audience' | 'competitor' | 'campaign' | 'cta' | 'hook';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  userId?: string;
  createdAt: Date;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation: string;   // e.g. "targets_country", "drives_sale", "uses_keyword", "converts_via"
  weight: number;     // 0-1 strength of relationship
  properties: Record<string, unknown>;
  userId?: string;
  createdAt: Date;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalWeight: number;
}

export interface KnowledgeGraphStore {
  addNode(node: Omit<GraphNode, 'id' | 'createdAt'>): Promise<GraphNode>;
  getNode(id: string): Promise<GraphNode | null>;
  findNodes(type: NodeType, label?: string): Promise<GraphNode[]>;
  addEdge(edge: Omit<GraphEdge, 'id' | 'createdAt'>): Promise<GraphEdge>;
  getEdges(fromNodeId: string, relation?: string): Promise<GraphEdge[]>;
  traverse(fromNodeId: string, relation: string, depth?: number): Promise<GraphNode[]>;
  pathQuery(fromNodeId: string, toNodeId: string): Promise<GraphPath[]>;
  addTriple(subject: string, predicate: string, object: string, userId?: string): Promise<void>;
  queryTriples(subject?: string, predicate?: string, object?: string): Promise<{ subject: string; predicate: string; object: string }[]>;
}
