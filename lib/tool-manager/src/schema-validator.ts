import type { JsonSchema, JsonSchemaType, SchemaValidationResult } from "./types.js";

function typeOf(value: unknown): JsonSchemaType | "null" | "undefined" {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === "object") return t;
  return "undefined";
}

/**
 * Validates `value` against `schema`, collecting every violation (rather
 * than stopping at the first) so a caller can report everything wrong with
 * one request at once. Pure — no I/O, never throws.
 */
export function validateAgainstSchema(schema: JsonSchema, value: unknown, path = "$"): SchemaValidationResult {
  const errors: string[] = [];
  validate(schema, value, path, errors);
  return { valid: errors.length === 0, errors };
}

function validate(schema: JsonSchema, value: unknown, path: string, errors: string[]): void {
  const actualType = typeOf(value);
  if (actualType !== schema.type) {
    errors.push(`${path}: expected ${schema.type}, got ${actualType}`);
    return;
  }

  if (schema.enum && !schema.enum.some((allowed) => deepEqual(allowed, value))) {
    errors.push(`${path}: value is not one of the allowed enum values`);
  }

  if (schema.type === "object") {
    const obj = value as Record<string, unknown>;
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in obj)) {
        errors.push(`${path}.${requiredKey}: required property is missing`);
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          validate(propSchema, obj[key], `${path}.${key}`, errors);
        }
      }
    }
  }

  if (schema.type === "array" && schema.items) {
    const arr = value as unknown[];
    arr.forEach((item, index) => validate(schema.items!, item, `${path}[${index}]`, errors));
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
