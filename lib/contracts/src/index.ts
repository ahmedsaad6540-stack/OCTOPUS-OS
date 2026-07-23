export type ApprovalMode = "AUTO" | "SEMI_AUTO" | "MANUAL" | "LEARNING";

export interface SystemModeSettings {
  mode: ApprovalMode;
}

// Logger Interface
export interface ProfitEngineLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

// Inter-module decoupling signatures (Brain, Scheduler, AgentManager, ToolManager, WorkflowEngine)
export interface EventPublisher {
  publish<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: { correlationId?: string; causationId?: string; userId?: string }
  ): Promise<unknown>;
}

export interface RuleRegistrar {
  registerRule(rule: {
    name: string;
    pattern: string;
    priority?: number;
    evaluate(event: any): any;
  }): () => void;
}

export interface AgentRegistrar {
  create(input: {
    name: string;
    description?: string;
    instructions: string;
    capabilities?: string[];
    status?: "active" | "disabled";
    userId?: string;
  }): Promise<{ id: string }>;
  list(query?: { limit?: number }): Promise<{ id: string; name: string }[]>;
}

export interface ToolRegistrar {
  create(input: {
    name: string;
    description?: string;
    inputSchema: any;
    handlerName: string;
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
  registerHandler(handlerName: string, handler: { execute(input: any): Promise<any> }): void;
}

export interface WorkflowRegistrar {
  create(input: {
    name: string;
    description?: string;
    steps: any[];
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
}

export interface JobScheduler {
  create(input: {
    name: string;
    description?: string;
    schedule: { type: "cron"; expression: string } | { type: "interval"; intervalMs: number };
    target: { type: "workflow"; workflowId: string; input: any } | { type: "task"; taskType: string; payload: any };
    status?: "active" | "disabled";
  }): Promise<{ id: string }>;
}
