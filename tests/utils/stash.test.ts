import { describe, it, expect } from 'vitest';
import { isStashCommit, mergeStashes } from '../../src/utils/stash.js';
import type { CommitEntry } from '../../src/data/mockRepos.js';

function commit(hash: string, parentHash: string[], refs: string[] = []): CommitEntry {
  return {
    hash,
    message: 'msg',
    date: '2026-01-01',
    author: 'Test',
    body: '',
    parentHash,
    refs,
    changedFiles: [],
  };
}

function stash(hash: string, base: string, index: number): CommitEntry {
  return commit(hash, [base], [`stash@{${index}}`]);
}

describe('isStashCommit', () => {
  it('returns true when a ref is a stash ref', () => {
    expect(isStashCommit(stash('s', 'a', 0))).toBe(true);
  });

  it('returns false for regular commits', () => {
    expect(isStashCommit(commit('a', [], ['main', 'HEAD']))).toBe(false);
  });
});

describe('mergeStashes', () => {
  const commits = [commit('a', ['b']), commit('b', ['c']), commit('c', [])];

  it('returns the commits unchanged when there are no stashes', () => {
    expect(mergeStashes(commits, [])).toEqual(commits);
  });

  it('inserts a stash directly before its base commit', () => {
    const s = stash('s', 'b', 0);
    const result = mergeStashes(commits, [s]);
    expect(result.map((c) => c.hash)).toEqual(['a', 's', 'b', 'c']);
  });

  it('keeps stash order (newest first) for stashes on the same base', () => {
    const s0 = stash('s0', 'c', 0);
    const s1 = stash('s1', 'c', 1);
    const result = mergeStashes(commits, [s0, s1]);
    expect(result.map((c) => c.hash)).toEqual(['a', 'b', 's0', 's1', 'c']);
  });

  it('skips stashes whose base is not among the loaded commits', () => {
    const result = mergeStashes(commits, [stash('s', 'zzz', 0)]);
    expect(result.map((c) => c.hash)).toEqual(['a', 'b', 'c']);
  });

  it('skips stashes without a base parent', () => {
    const orphan = commit('s', [], ['stash@{0}']);
    expect(mergeStashes(commits, [orphan]).map((c) => c.hash)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input arrays', () => {
    const input = [...commits];
    mergeStashes(input, [stash('s', 'a', 0)]);
    expect(input).toEqual(commits);
  });
});
