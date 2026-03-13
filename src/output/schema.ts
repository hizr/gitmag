/**
 * OpenAPI 3.x schema for the gitmag --json output.
 * This is the single source of truth — printed by --schema / --schema --yaml.
 */

export const GITMAG_SCHEMA = {
  openapi: '3.0.3',
  info: {
    title: 'GitMag JSON Output',
    version: '0.1.0',
    description: 'Schema for the structured JSON output produced by `gitmag --json`.',
  },
  paths: {},
  components: {
    schemas: {
      FileChange: {
        type: 'object',
        required: ['path', 'additions', 'deletions', 'binary'],
        properties: {
          path: { type: 'string', description: 'File path relative to repo root' },
          additions: { type: 'integer', minimum: 0 },
          deletions: { type: 'integer', minimum: 0 },
          binary: { type: 'boolean' },
        },
      },
      Commit: {
        type: 'object',
        required: ['hash', 'message', 'date', 'files'],
        properties: {
          hash: { type: 'string', description: '7-character abbreviated commit hash' },
          message: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          files: {
            type: 'array',
            items: { $ref: '#/components/schemas/FileChange' },
          },
        },
      },
      Author: {
        type: 'object',
        required: ['name', 'email', 'commits'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          commits: {
            type: 'array',
            items: { $ref: '#/components/schemas/Commit' },
          },
        },
      },
      Repository: {
        type: 'object',
        required: ['path', 'name', 'authors'],
        properties: {
          path: { type: 'string', description: 'Absolute path to the repository' },
          name: { type: 'string', description: 'Repository directory name' },
          authors: {
            type: 'array',
            items: { $ref: '#/components/schemas/Author' },
          },
        },
      },
      TimeWindow: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
        },
      },
      GitmapOutput: {
        type: 'object',
        required: ['scanDirectory', 'timeWindow', 'repositories'],
        properties: {
          scanDirectory: {
            type: 'string',
            description: 'The directory that was scanned',
          },
          timeWindow: { $ref: '#/components/schemas/TimeWindow' },
          repositories: {
            type: 'array',
            items: { $ref: '#/components/schemas/Repository' },
          },
        },
      },
    },
  },
} as const;

/**
 * Minimal YAML serializer — handles the simple object/string/number/boolean
 * structure of the schema without requiring a full YAML library.
 */
export function toYaml(obj: unknown, indent = 0): string {
  const pad = ' '.repeat(indent);

  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // Quote strings that contain special characters
    if (/[:#[\]{},\n|>!'"&*?]/.test(obj) || obj.trim() !== obj) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => `${pad}- ${toYaml(item, indent + 2).trimStart()}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, val]) => {
        const valStr = toYaml(val, indent + 2);
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return `${pad}${key}:\n${valStr}`;
        }
        if (Array.isArray(val) && (val as unknown[]).length > 0) {
          return `${pad}${key}:\n${valStr}`;
        }
        return `${pad}${key}: ${valStr}`;
      })
      .join('\n');
  }

  return String(obj);
}

/**
 * Prints the OpenAPI schema to stdout.
 * Pass yaml=true for YAML output, false for JSON.
 */
export function printSchema(yaml: boolean): void {
  if (yaml) {
    process.stdout.write(toYaml(GITMAG_SCHEMA) + '\n');
  } else {
    process.stdout.write(JSON.stringify(GITMAG_SCHEMA, null, 2) + '\n');
  }
}
