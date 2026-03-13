import Conf from 'conf';
import type { GitmapState } from '../types/index.js';
import { getTimeWindowStart } from '../utils/time.js';

const store = new Conf<GitmapState>({
  projectName: 'gitmag',
  schema: {
    lastRun: {
      type: ['string', 'null'],
      default: null,
    },
    repos: {
      type: 'object',
      default: {},
    },
  },
  defaults: {
    lastRun: null,
    repos: {},
  },
});

/**
 * Returns the timestamp of the last gitmag run, or null on first run.
 */
export function getLastRun(): Date | null {
  const raw = store.get('lastRun');
  return raw ? new Date(raw) : null;
}

/**
 * Records the current timestamp as the last run.
 * Called at the start of every invocation.
 */
export function recordRun(): void {
  store.set('lastRun', new Date().toISOString());
}

/**
 * Returns the start Date for the current display window.
 * Applies the 24h minimum floor unless sinceOverride is provided.
 */
export function getWindowStart(sinceOverride?: string): Date {
  const now = new Date();
  const lastRun = getLastRun();
  return getTimeWindowStart(now, lastRun, sinceOverride);
}

/**
 * Clears all persisted state.
 */
export function resetState(): void {
  store.clear();
}

/**
 * Updates the last-seen commit hash for a given repo path.
 */
export function recordRepoSeen(repoPath: string, commitHash: string): void {
  const repos = store.get('repos');
  store.set('repos', { ...repos, [repoPath]: { lastSeenCommit: commitHash } });
}
