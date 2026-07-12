/**
 * Distributed tracing bootstrap. Loaded first from `index.ts` so
 * auto-instrumentation can patch Node built-ins before anything else is
 * imported.
 */

const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];

if (otlpEndpoint) {
  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { SimpleSpanProcessor } = await import(
      "@opentelemetry/sdk-trace-base"
    );
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
      "@opentelemetry/semantic-conventions"
    );

    const traceExporter = new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    });

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "octopus-os-api-server",
        [ATTR_SERVICE_VERSION]: process.env["npm_package_version"] ?? "0.0.0",
      }),
      spanProcessors: [new SimpleSpanProcessor(traceExporter)],
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-http": {
            ignoreIncomingRequestHook: (req) =>
              req.url === "/api/healthz" || req.url === "/api/metrics",
          },
        }),
      ],
    });

    sdk.start();

    process.on("SIGTERM", () => { sdk.shutdown().catch(() => {}); });
    process.on("SIGINT", () => { sdk.shutdown().catch(() => {}); });
  } catch (err) {
    console.warn(
      "[tracing] OpenTelemetry SDK unavailable, continuing without tracing:",
      err instanceof Error ? err.message : err,
    );
  }
}
