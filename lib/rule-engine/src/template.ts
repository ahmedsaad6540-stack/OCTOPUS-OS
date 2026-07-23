import { resolveField } from "./conditions.js";
import type { RuleEvent } from "./types.js";

const TOKEN_RE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;

/**
 * Deep-walks a value (object/array/primitive), replacing any string that is
 * *exactly* `"{{some.dot.path}}"` with the value resolved from that path
 * against `event`. Every other string — including one that merely contains
 * `{{...}}` alongside other text — is left untouched. This is intentionally
 * not a general templating engine: whole-token substitution only, so a rule
 * definition can never be used to build or evaluate arbitrary expressions.
 * If the resolved value is `undefined` (the path didn't resolve), the
 * literal token string is left in place rather than silently becoming
 * `undefined`, so a misconfigured rule fails loudly downstream instead of
 * quietly dropping a field.
 */
export function renderTemplate(value: unknown, event: RuleEvent): unknown {
  if (typeof value === "string") {
    const match = TOKEN_RE.exec(value);
    if (!match) return value;
    const resolved = resolveField(event, match[1]!);
    return resolved === undefined ? value : resolved;
  }
  if (Array.isArray(value)) {
    return value.map((item) => renderTemplate(item, event));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = renderTemplate(nested, event);
    }
    return result;
  }
  return value;
}
