import type { CommitEntry } from '../data/mockRepos.js';

const STASH_REF_PREFIX = 'stash@{';

/** True if the commit is a stash entry (carries a `stash@{n}` ref). */
export function isStashCommit(commit: CommitEntry): boolean {
  return commit.refs.some((ref) => ref.startsWith(STASH_REF_PREFIX));
}

/**
 * Insert stash entries into a newest-first commit list, each directly before
 * its base commit (parentHash[0]). Stashes sharing a base keep their given
 * order (stash@{0} first). Stashes whose base is not loaded are skipped so the
 * graph never opens a lane that cannot close.
 */
export function mergeStashes(commits: CommitEntry[], stashes: CommitEntry[]): CommitEntry[] {
  if (stashes.length === 0) return commits;

  const stashesByBase = new Map<string, CommitEntry[]>();
  for (const stash of stashes) {
    const base = stash.parentHash[0];
    if (!base) continue;
    stashesByBase.set(base, [...(stashesByBase.get(base) ?? []), stash]);
  }

  return commits.flatMap((commit) => [...(stashesByBase.get(commit.hash) ?? []), commit]);
}
