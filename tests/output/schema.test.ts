import { describe, it, expect } from 'vitest';
import { toYaml, GITMAG_SCHEMA } from '../../src/output/schema.js';

describe('toYaml', () => {
  it('serialises a string', () => {
    expect(toYaml('hello')).toBe('hello');
  });

  it('quotes strings with special characters', () => {
    const result = toYaml('hello: world');
    expect(result).toMatch(/^"/);
  });

  it('serialises a number', () => {
    expect(toYaml(42)).toBe('42');
  });

  it('serialises booleans', () => {
    expect(toYaml(true)).toBe('true');
    expect(toYaml(false)).toBe('false');
  });

  it('serialises an empty array as []', () => {
    expect(toYaml([])).toBe('[]');
  });

  it('serialises an array of strings', () => {
    const result = toYaml(['a', 'b']);
    expect(result).toContain('- a');
    expect(result).toContain('- b');
  });

  it('serialises a flat object', () => {
    const result = toYaml({ foo: 'bar', num: 1 });
    expect(result).toContain('foo: bar');
    expect(result).toContain('num: 1');
  });

  it('serialises null as null', () => {
    expect(toYaml(null)).toBe('null');
  });
});

describe('GITMAG_SCHEMA', () => {
  it('is an OpenAPI 3.x document', () => {
    expect(GITMAG_SCHEMA.openapi).toMatch(/^3\./);
  });

  it('has the expected top-level component schemas', () => {
    const schemas = Object.keys(GITMAG_SCHEMA.components.schemas);
    expect(schemas).toContain('Repository');
    expect(schemas).toContain('Author');
    expect(schemas).toContain('Commit');
    expect(schemas).toContain('FileChange');
    expect(schemas).toContain('GitmapOutput');
  });
});
