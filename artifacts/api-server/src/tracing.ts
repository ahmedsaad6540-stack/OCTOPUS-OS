/**
 * Distributed tracing bootstrap. Loaded first from `index.ts` so
 * auto-instrumentation can patch Node built-ins before anything else is
 * imported.
 *
 * Runtime behavior:
 *   - If `OTEL_EXPORTER_OTLP_ENDPOINT` is not set, tracing is disabled and
 *     this module is a no-op. This is the common case in production.
 *   - If it IS set, we try to dynamically load the OpenTelemetry SDK. The
 *     SDK packages are intentionally NOT bundled (see build.mjs externals),
 *     because auto-instrumentation must patch the real shared module
 *     instances of `http`, `express`, `pg`, etc. When tracing is enabled
 *     the deployment must install the `@opentelemetry/*` packages
 *     alongside the bundled `dist/`.
 *   - If the dynamic import fails (packages not installed in the runtime
 *     image), we log a warning and continue — tracing is optional and
 *     must never prevent the server from starting.
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
        [ATTR_SERVICE_VERSION]:
          process.env["npm_package_version"] ?? "0.0.0",
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

    process.on("SIGTERM", () => {
      sdk.shutdown().catch(() => {});
    });
    process.on("SIGINT", () => {
      sdk.shutdown().catch(() => {});
    });
  } catch (err) {
    console.warn(
      "[tracing] OpenTelemetry SDK unavailable, continuing without tracing:",
      err instanceof Error ? err.message : err,
    );
  }
}
