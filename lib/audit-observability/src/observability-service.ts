import type { AuditObservabilityLogger, MetricsProbe, SystemStatus } from "./types.js";

const noopLogger: AuditObservabilityLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Aggregates a system status snapshot from independently-registered
 * `MetricsProbe`s. Never queries any store itself — every section of the
 * status comes from a probe someone else registered, so this class stays
 * decoupled from every other module the same way `Brain`/`DecisionEngine`
 * are. One probe throwing never stops the others from reporting: its
 * error is captured in `errors[probe.name]` and every other probe still
 * runs.
 */
export class ObservabilityService {
  private readonly probes = new Map<string, MetricsProbe>();

  constructor(private readonly logger: AuditObservabilityLogger = noopLogger) {}

  /** Registers (or replaces) a probe under `probe.name`. */
  registerProbe(probe: MetricsProbe): void {
    this.probes.set(probe.name, probe);
  }

  async getStatus(): Promise<SystemStatus> {
    const sections: Record<string, Record<string, unknown>> = {};
    const errors: Record<string, string> = {};

    for (const probe of this.probes.values()) {
      try {
        sections[probe.name] = await probe.collect();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors[probe.name] = message;
        this.logger.error({ probe: probe.name, error: message }, "observability_service.probe_failed");
      }
    }

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      sections,
      errors,
    };
  }
}
