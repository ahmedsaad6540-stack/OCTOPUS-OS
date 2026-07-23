const TOKEN_RE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;

/**
 * Resolves a dot-path (e.g. `"input.taskId"`, `"steps.fetchUser.output.id"`)
 * against a plain context object. Returns `undefined` if any segment along
 * the path is missing.
 */
function resolvePath(context: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = context;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Deep-walks a value, replacing any string that is *exactly*
 * `"{{some.dot.path}}"` with the value resolved from that path against
 * `context` — the same whole-token-only templating `@workspace/rule-engine`
 * uses for its action payloads (a separate, generic implementation here:
 * the Workflow Engine's context shape — `{ input, steps: { name: { output }
 * } }` — has nothing to do with an event, so it isn't a fit for Rule
 * Engine's event-scoped renderer). Every other string, including one that
 * merely contains `{{...}}` alongside other text, is left untouched. A
 * token whose path doesn't resolve is left as the literal string rather
 * than silently becoming `undefined`, so a misconfigured step fails loudly
 * downstream instead of quietly dropping a field.
 */
export function renderTemplate(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    const match = TOKEN_RE.exec(value);
    if (!match) return value;
    const resolved = resolvePath(context, match[1]!);
    return resolved === undefined ? value : resolved;
  }
  if (Array.isArray(value)) {
    return value.map((item) => renderTemplate(item, context));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = renderTemplate(nested, context);
    }
    return result;
  }
  return value;
}
