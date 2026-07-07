/**
 * Distributed tracing bootstrap. This must be imported before any other
 * module in the process — auto-instrumentation patches Node's built-ins
 * (`http`, etc.) and libraries (`express`, `pg`) at *require/import* time,
 * so anything imported earlier in `index.ts` than this file would run
 * unpatched. `@opentelemetry/*` is deliberately excluded from the esbuild
 * bundle (see `build.mjs`'s `external` list, which already anticipated
 * this) so the instrumentation packages patch the real, shared module
 * instances at runtime rather than a bundled copy.
 *
 * Exports real spans to the OTLP HTTP endpoint named by
 * `OTEL_EXPORTER_OTLP_ENDPOINT` if it's set; otherwise falls back to a
 * `ConsoleSpanExporter` so tracing is genuinely functional with zero
 * external collector — every span prints to stdout. No environment this
 * code has been run in during development had a reachable OTLP collector,
 * so the console path is what's actually been exercised; the OTLP path is
 * real code, not yet verified against a live collector.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];

const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "octopus-os-api-server",
    [ATTR_SERVICE_VERSION]: process.env["npm_package_version"] ?? "0.0.0",
  }),
  spanProcessors: [new SimpleSpanProcessor(traceExporter)],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Health checks and metrics scrapes are noise, not useful traces.
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => req.url === "/api/healthz" || req.url === "/api/metrics",
      },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().catch(() => {});
});
process.on("SIGINT", () => {
  sdk.shutdown().catch(() => {});
});
