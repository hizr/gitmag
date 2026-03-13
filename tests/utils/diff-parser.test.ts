import { describe, it, expect } from 'vitest';
import { parseDiff } from '../../src/utils/diff-parser.js';

const SAMPLE_DIFF = `diff --git a/src/foo.ts b/src/foo.ts
index abc1234..def5678 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,4 +1,5 @@
 const x = 1;
-const y = 2;
+const y = 99;
+const z = 3;
 export {};
`;

describe('parseDiff', () => {
  it('returns empty array for empty input', () => {
    expect(parseDiff('')).toEqual([]);
    expect(parseDiff('   ')).toEqual([]);
  });

  it('parses a single-file diff', () => {
    const result = parseDiff(SAMPLE_DIFF);
    expect(result).toHaveLength(1);
    expect(result[0]!.oldPath).toBe('src/foo.ts');
    expect(result[0]!.newPath).toBe('src/foo.ts');
  });

  it('produces at least one hunk', () => {
    const result = parseDiff(SAMPLE_DIFF);
    expect(result[0]!.hunks.length).toBeGreaterThan(0);
  });

  it('pairs delete+insert rows side-by-side', () => {
    const result = parseDiff(SAMPLE_DIFF);
    const rows = result[0]!.hunks[0]!.rows;
    // Find a row where left is del and right is add (the y=2 -> y=99 change)
    const modified = rows.find((r) => r.left.type === 'del' && r.right.type === 'add');
    expect(modified).toBeDefined();
    expect(modified!.left.content).toContain('2');
    expect(modified!.right.content).toContain('99');
  });

  it('emits an empty right side for unpaired inserts', () => {
    const result = parseDiff(SAMPLE_DIFF);
    const rows = result[0]!.hunks[0]!.rows;
    // const z = 3; is an extra insert with no matching delete
    const addOnly = rows.find((r) => r.left.type === 'empty' && r.right.type === 'add');
    expect(addOnly).toBeDefined();
    expect(addOnly!.right.content).toContain('3');
  });

  it('preserves context rows on both sides', () => {
    const result = parseDiff(SAMPLE_DIFF);
    const rows = result[0]!.hunks[0]!.rows;
    const contextRows = rows.filter((r) => r.left.type === 'context');
    expect(contextRows.length).toBeGreaterThan(0);
    // Both sides of a context row should have the same content
    for (const row of contextRows) {
      expect(row.left.content).toBe(row.right.content);
    }
  });

  it('strips the leading +/-/space from content', () => {
    const result = parseDiff(SAMPLE_DIFF);
    const rows = result[0]!.hunks[0]!.rows;
    for (const row of rows) {
      if (row.left.type !== 'empty') {
        expect(row.left.content).not.toMatch(/^[-+ ]/);
      }
      if (row.right.type !== 'empty') {
        expect(row.right.content).not.toMatch(/^[-+ ]/);
      }
    }
  });
});
