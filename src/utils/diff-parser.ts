import { parse } from 'diff2html';

/**
 * A single rendered line for the side-by-side diff view.
 */
export interface DiffLine {
  lineNo: number | null;
  content: string; // strip leading +/-/space
  type: 'add' | 'del' | 'context' | 'empty';
}

/**
 * A pair of left/right lines for one row in the side-by-side view.
 */
export interface DiffRow {
  left: DiffLine;
  right: DiffLine;
}

/**
 * A contiguous hunk of changes within a file.
 */
export interface DiffHunk {
  header: string;
  rows: DiffRow[];
}

/**
 * The parsed representation of a unified diff for one file.
 */
export interface ParsedFileDiff {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
}

const EMPTY_LINE: DiffLine = { lineNo: null, content: '', type: 'empty' };

/**
 * Strips the leading diff character (+/-/ ) from a line's content.
 */
function stripLeading(content: string): string {
  return content.slice(1);
}

/**
 * Parses a raw unified diff string and returns a side-by-side structure
 * suitable for rendering in the Ink diff view.
 */
export function parseDiff(rawDiff: string): ParsedFileDiff[] {
  if (!rawDiff.trim()) return [];

  const files = parse(rawDiff);

  return files.map((file) => {
    const hunks: DiffHunk[] = file.blocks.map((block) => {
      // Build side-by-side pairs from the flat line list.
      // Strategy: collect deletes, then pair each delete with the next insert
      // if they appear consecutively. Context lines are paired directly.
      const rows: DiffRow[] = [];
      const pending: DiffLine[] = []; // buffered delete lines awaiting a matching insert

      for (const line of block.lines) {
        const content = stripLeading(line.content);

        if (line.type === 'delete') {
          pending.push({ lineNo: line.oldNumber ?? null, content, type: 'del' });
        } else if (line.type === 'insert') {
          if (pending.length > 0) {
            // Pair the oldest pending delete with this insert
            const del = pending.shift()!;
            rows.push({
              left: del,
              right: { lineNo: line.newNumber ?? null, content, type: 'add' },
            });
          } else {
            rows.push({
              left: EMPTY_LINE,
              right: { lineNo: line.newNumber ?? null, content, type: 'add' },
            });
          }
        } else {
          // context — flush any remaining pending deletes first
          while (pending.length > 0) {
            rows.push({ left: pending.shift()!, right: EMPTY_LINE });
          }
          const ctx: DiffLine = { lineNo: line.oldNumber ?? null, content, type: 'context' };
          rows.push({ left: ctx, right: { ...ctx, lineNo: line.newNumber ?? null } });
        }
      }

      // Flush remaining deletes
      while (pending.length > 0) {
        rows.push({ left: pending.shift()!, right: EMPTY_LINE });
      }

      return { header: block.header, rows };
    });

    return {
      oldPath: file.oldName,
      newPath: file.newName,
      hunks,
    };
  });
}
