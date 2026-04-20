import type { CommitEntry } from '../data/mockRepos.js';

/**
 * A GraphLine represents one row in the output — either a commit row with a node symbol,
 * or a pure connector row (pipe/slash connectors) with no commit.
 *
 * Discriminated union: exhaustive pattern matching enforces type safety.
 */
export type GraphLine =
  | {
      kind: 'commit';
      /** The commit this row represents */
      commit: CommitEntry;
      /**
       * Pre-rendered ASCII prefix to place left of the commit metadata.
       * e.g. "● ", "│ ● ", "│ │ ● "
       */
      prefix: string;
      /** Zero-based lane index where this commit's node sits */
      column: number;
    }
  | {
      kind: 'connector';
      /**
       * Pre-rendered ASCII prefix for pure connector rows (no commit node).
       * e.g. "│ \ ", "|/ "
       */
      prefix: string;
    };

export function isRenderableConnectorPrefix(prefix: string): boolean {
  return /[│/\\]/.test(prefix);
}

/**
 * Build all graph lines from a topologically-sorted commit list (newest first).
 *
 * Matches git log --graph --oneline output exactly:
 *
 *   * commit A
 *   *   merge commit
 *   |\
 *   | * branch commit
 *   |/
 *   * base commit
 *
 * Algorithm:
 *   lanes[] holds the hash each active lane is waiting for (its next commit).
 *
 *   For each commit:
 *     1. Find which lane(s) claim this hash.
 *     2. If multiple lanes claim it → emit a "|/" close connector BEFORE this commit.
 *     3. The primary lane (first match, or new lane) is this commit's column.
 *     4. Emit the commit row using the PRE-UPDATE lane state for width.
 *     5. Update lanes: replace primary lane with firstParent (or remove if root),
 *        append secondParent if this is a merge and it's not already tracked.
 *     6. If a new lane was opened (merge) → emit a "|\\" open connector AFTER the commit.
 */
/** Find all lane indices that point to this commit hash. */
function findClaimingLanes(lanes: string[], hash: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i] === hash) result.push(i);
  }
  return result;
}

/** Collapse duplicate claiming lanes (right to left). Returns graphLine prefix if emitted. */
function collapseConvergingLanes(lanes: string[], claimingLanes: number[]): string {
  const primary = claimingLanes[0]!;
  const prefix = buildCloseConnector(claimingLanes, primary, lanes.length);
  for (let i = claimingLanes.length - 1; i >= 1; i--) {
    lanes.splice(claimingLanes[i] as number, 1);
  }
  return prefix;
}

/** Update lanes after emitting a commit row. Returns true if a new merge lane was opened. */
function updateLanesAfterCommit(
  lanes: string[],
  column: number,
  firstParent: string | null,
  secondParent: string | null
): boolean {
  if (firstParent) {
    lanes[column] = firstParent;
  } else {
    lanes.splice(column, 1);
  }
  if (secondParent && !lanes.includes(secondParent)) {
    lanes.push(secondParent);
    return true;
  }
  return false;
}

export function buildGraphLines(commits: CommitEntry[]): GraphLine[] {
  const lanes: string[] = [];
  const lines: GraphLine[] = [];

  for (const commit of commits) {
    const claimingLanes = findClaimingLanes(lanes, commit.hash);

    // ── Step 1: Converging lanes → close connector BEFORE commit ──
    if (claimingLanes.length > 1) {
      const prefix = collapseConvergingLanes(lanes, claimingLanes);
      if (isRenderableConnectorPrefix(prefix)) {
        lines.push({ kind: 'connector', prefix });
      }
    }

    // ── Step 2: Determine commit column ──
    const singleClaimIdx = lanes.indexOf(commit.hash);
    const column = singleClaimIdx !== -1 ? singleClaimIdx : lanes.length;
    if (singleClaimIdx === -1) lanes.push(commit.hash);

    // ── Step 3: Emit commit row ──
    lines.push({ kind: 'commit', commit, prefix: buildCommitPrefix(column, lanes.length), column });

    // ── Step 4: Update lanes; open connector if merge ──
    const firstParent = commit.parentHash[0] ?? null;
    const secondParent = commit.parentHash[1] ?? null;
    const mergeOpened = updateLanesAfterCommit(lanes, column, firstParent, secondParent);

    if (mergeOpened) {
      const prefix = buildOpenConnector(column, lanes.length);
      if (isRenderableConnectorPrefix(prefix)) {
        lines.push({ kind: 'connector', prefix });
      }
    }
  }

  return lines;
}

/**
 * Build the commit row prefix.
 * - Lanes left of column: "│ "
 * - The column itself: "● "
 * - Lanes right of column: "  " (they pass through but are not shown on commit row)
 *
 * Total width = laneCount * 2 characters.
 */
function buildCommitPrefix(column: number, laneCount: number): string {
  const parts: string[] = [];
  for (let i = 0; i < laneCount; i++) {
    if (i < column) {
      parts.push('│ ');
    } else if (i === column) {
      parts.push('● ');
    } else {
      parts.push('  ');
    }
  }
  return parts.join('');
}

/**
 * Build a merge-open connector row ("|\\" style).
 * Emitted AFTER a merge commit. The new branch lane is at the rightmost position
 * (lanes.length - 1 after update).
 *
 * git output for column=0, totalLanes=2:
 *   "| \ "   →  │ at 0, \ at 1
 *
 * Each lane that existed before contributes "│ ", the new rightmost lane contributes "\ ".
 * Lanes right of the new one: "  ".
 */
function buildOpenConnector(mergeColumn: number, postLaneCount: number): string {
  // The new branch lane is at index postLaneCount - 1
  const newBranchLane = postLaneCount - 1;
  const parts: string[] = [];
  for (let i = 0; i < postLaneCount; i++) {
    if (i < mergeColumn) {
      parts.push('│ ');
    } else if (i === mergeColumn) {
      parts.push('│ ');
    } else if (i === newBranchLane) {
      parts.push('\\ ');
    } else {
      parts.push('  ');
    }
  }
  return parts.join('');
}

/**
 * Build a merge-close connector row ("|/" style).
 * Emitted BEFORE the converging commit. All claiming lanes close into the primary lane.
 *
 * git output for column=0, secondary=1, preLaneCount=2:
 *   "|/  "  →  │ at 0, / at 1
 *
 * For each lane i:
 *   - i < primary: "│ "
 *   - i === primary: "│ "
 *   - i > primary (converging): "/" for the last (rightmost) one, "│ " otherwise...
 *     but for the simple case we just show "/" at each converging lane.
 */
function buildCloseConnector(
  claimingLanes: number[],
  primaryLane: number,
  preLaneCount: number
): string {
  const parts: string[] = [];
  for (let i = 0; i < preLaneCount; i++) {
    if (i === primaryLane) {
      parts.push('│ ');
    } else if (claimingLanes.includes(i)) {
      parts.push('/ ');
    } else if (i < primaryLane) {
      parts.push('│ ');
    } else {
      // Lane to the right that is NOT converging: still active, show │
      parts.push('│ ');
    }
  }
  return parts.join('');
}
