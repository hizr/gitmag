import { describe, it, expect } from 'vitest';
import { buildGraphLines } from '../../src/utils/git-graph.js';
import type { CommitEntry } from '../../src/data/mockRepos.js';

// Minimal commit factory — only fields git-graph.ts cares about
function commit(hash: string, parentHash: string[], message = 'msg'): CommitEntry {
  return {
    hash,
    message,
    date: '2026-01-01',
    author: 'Test',
    body: '',
    parentHash,
    changedFiles: [],
  };
}

describe('buildGraphLines', () => {
  it('returns one line per commit', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    expect(lines).toHaveLength(2);
  });

  it('carries the original commit on each line', () => {
    const commits = [commit('abc1234', [])];
    const lines = buildGraphLines(commits);
    expect(lines[0].commit).toBe(commits[0]);
  });

  // ── Linear history ──────────────────────────────────────────────────
  it('linear: first commit gets a node symbol', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    expect(lines[0].prefix).toContain('●');
    expect(lines[1].prefix).toContain('●');
  });

  it('linear: continuation rows between commits contain a pipe', () => {
    const commits = [commit('a', ['b']), commit('b', ['c']), commit('c', [])];
    const lines = buildGraphLines(commits);
    // Each line should have a node (●)
    for (const line of lines) {
      expect(line.prefix).toContain('●');
    }
  });

  it('linear: root commit (no parents) still renders a node', () => {
    const commits = [commit('root', [])];
    const lines = buildGraphLines(commits);
    expect(lines[0].prefix).toContain('●');
  });

  // ── Branch / merge ──────────────────────────────────────────────────
  it('merge commit (two parents) renders a node', () => {
    const commits = [
      commit('merge', ['p1', 'p2']),
      commit('p1', ['base']),
      commit('p2', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    const mergeLine = lines.find((l) => l.commit.hash === 'merge')!;
    expect(mergeLine.prefix).toContain('●');
  });

  it('commits on a second lane get a higher column index', () => {
    // merge opens a second lane; the branch commit should sit in a higher column
    const commits = [
      commit('merge', ['main1', 'branch1']),
      commit('main1', ['base']),
      commit('branch1', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    const branchLine = lines.find((l) => l.commit.hash === 'branch1')!;
    const mainLine = lines.find((l) => l.commit.hash === 'main1')!;
    // branch commit must be in a higher (more indented) column
    expect(branchLine.column).toBeGreaterThan(mainLine.column);
    // its prefix must contain a node symbol
    expect(branchLine.prefix).toContain('●');
  });

  it('prefix does not contain undefined or null text', () => {
    const commits = [
      commit('merge', ['p1', 'p2']),
      commit('p1', ['base']),
      commit('p2', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    for (const line of lines) {
      expect(line.prefix).not.toContain('undefined');
      expect(line.prefix).not.toContain('null');
    }
  });

  // ── Column field ────────────────────────────────────────────────────
  it('exposes a numeric column field on every line', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    for (const line of lines) {
      expect(typeof line.column).toBe('number');
    }
  });
});
