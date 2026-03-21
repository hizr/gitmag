import type { CommitEntry } from '../data/mockRepos.js';

export interface GraphLine {
  /** The commit this row represents */
  commit: CommitEntry;
  /**
   * Pre-rendered ASCII prefix to place left of the commit metadata.
   * e.g. "● ", "│ ● ", "│╲● "
   */
  prefix: string;
  /** Zero-based lane index where this commit's node sits */
  column: number;
}

/**
 * Find the first lane index pointing to this commit hash, or -1 if none.
 */
function findPrimaryLane(lanes: string[], hash: string): number {
  return lanes.indexOf(hash);
}

/**
 * Find all lane indices pointing to this commit hash.
 */
function findMatchingLanes(lanes: string[], hash: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i] === hash) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Update the lane array after processing a commit:
 *   - Replace the primary lane with the first parent (or remove it for root commits)
 *   - Open a new lane for the second parent of a merge commit
 *   - Remove duplicate lanes that were also waiting for the same hash
 */
function updateLanes(
  lanes: string[],
  column: number,
  firstParent: string | null,
  secondParent: string | null,
  matchingLaneIndices: number[]
): void {
  // Replace the primary lane with the first parent (or remove for root commits)
  if (firstParent !== null) {
    lanes[column] = firstParent;
  } else {
    lanes.splice(column, 1);
  }

  // Merge commit: open a lane for the second parent
  if (secondParent !== null && !lanes.includes(secondParent)) {
    lanes.push(secondParent);
  }

  // Close extra lanes that were also waiting for the same commit hash
  for (let i = matchingLaneIndices.length - 1; i >= 1; i--) {
    const dupIdx = matchingLaneIndices[i] as number;
    lanes.splice(dupIdx, 1);
  }
}

/**
 * Build one GraphLine per commit from a topologically-sorted list
 * (newest first, parents appearing after their children).
 *
 * Algorithm: maintain an array of "active lanes", each holding the hash of
 * the commit it is waiting to see as a parent. When a commit is processed:
 *   1. Find which lane(s) are waiting for this hash.
 *   2. The first such lane becomes this commit's column.
 *   3. Replace that lane slot with this commit's first parent (if any).
 *   4. For a merge commit, open a new lane for the second parent.
 *   5. Build the visual prefix from the current lane state.
 */
export function buildGraphLines(commits: CommitEntry[]): GraphLine[] {
  // Each entry is the hash this lane is still "waiting for" (its next commit)
  const lanes: string[] = [];
  const lines: GraphLine[] = [];

  for (const commit of commits) {
    const matchingLaneIndices = findMatchingLanes(lanes, commit.hash);

    // If no lane claimed this commit, it starts a new branch (root case or
    // an unattached head — open a new lane at the end)
    const primaryLane = findPrimaryLane(lanes, commit.hash);
    const column = primaryLane !== -1 ? primaryLane : lanes.length;

    if (matchingLaneIndices.length === 0) {
      lanes.push(commit.hash); // placeholder, replaced below
    }

    const firstParent = commit.parentHash[0] ?? null;
    const secondParent = commit.parentHash[1] ?? null;

    updateLanes(lanes, column, firstParent, secondParent, matchingLaneIndices);

    const laneCount = Math.max(lanes.length, column + 1);
    const prefix = buildPrefix(column, laneCount, commit.parentHash.length);

    lines.push({ commit, prefix, column });
  }

  return lines;
}

/**
 * Render a single-line prefix string for a commit node at `column` within
 * `totalLanes` active lanes.
 *
 * Symbols used:
 *   ●  node (this commit)
 *   │  straight lane continuation
 *   ╮  lane opening right (merge)
 *   ╯  lane closing right
 *   ╲  diagonal connector
 *   ─  horizontal bridge
 */
function buildPrefix(column: number, totalLanes: number, parentCount: number): string {
  const parts: string[] = [];

  for (let i = 0; i < totalLanes; i++) {
    if (i === column) {
      if (parentCount >= 2) {
        // Merge node
        parts.push('●╮');
      } else {
        parts.push('● ');
      }
    } else if (i < column) {
      parts.push('│ ');
    } else {
      // Lane to the right of the node
      if (parentCount >= 2 && i === column + 1) {
        parts.push('╲ ');
      } else {
        parts.push('  ');
      }
    }
  }

  return parts.join('');
}
