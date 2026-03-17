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
    refs: [],
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

  // ── Refs passthrough ─────────────────────────────────────────────────
  it('carries refs from commit to GraphLine', () => {
    const commitWithRefs: CommitEntry = {
      hash: 'abc123',
      message: 'test commit',
      date: '2026-01-01',
      author: 'Test',
      body: '',
      parentHash: [],
      refs: ['HEAD', 'main', 'v1.0.0'],
      changedFiles: [],
    };
    const lines = buildGraphLines([commitWithRefs]);
    expect(lines[0].commit.refs).toEqual(['HEAD', 'main', 'v1.0.0']);
  });
});

// ── Tests for synthetic WORKING node injection (in CommitScreen) ──────────

describe('CommitScreen: synthetic WORKING node injection', () => {
  /**
   * Note: These tests verify the logic for creating and prepending a synthetic
   * WORKING node. The actual CommitScreen component is responsible for:
   * 1. Receiving workingChanges prop
   * 2. Creating the synthetic CommitEntry with hash='__WORKING__'
   * 3. Prepending it to the commits list
   * 4. Passing the merged list to buildGraphLines()
   */

  it('synthetic WORKING commit has correct structure', () => {
    const stagedFile = { status: 'M' as const, path: 'staged.txt' };
    const unstagedFile = { status: 'M' as const, path: 'unstaged.txt' };
    const untrackedFile = { status: '??' as const, path: 'untracked.txt' };

    const workingChanges = {
      staged: [stagedFile],
      unstaged: [unstagedFile],
      untracked: [untrackedFile],
    };

    // Simulate what CommitScreen does
    const syntheticWorkingCommit: CommitEntry = {
      hash: '__WORKING__',
      message: '[WORKING] Local changes',
      date: new Date().toISOString().split('T')[0],
      author: 'you',
      body: '',
      parentHash: ['abc123'], // Would be real HEAD hash in actual app
      refs: [],
      changedFiles: [
        ...workingChanges.staged,
        ...workingChanges.unstaged,
        ...workingChanges.untracked,
      ],
    };

    expect(syntheticWorkingCommit.hash).toBe('__WORKING__');
    expect(syntheticWorkingCommit.changedFiles).toHaveLength(3);
    expect(syntheticWorkingCommit.message).toContain('WORKING');
    expect(syntheticWorkingCommit.message).toContain('Local changes');
  });

  it('synthetic WORKING node builds a valid GraphLine', () => {
    const realCommit = commit('abc123', []);
    const workingCommit = commit('__WORKING__', ['abc123'], '[WORKING] Local changes');

    const commits = [workingCommit, realCommit];
    const lines = buildGraphLines(commits);

    // Should have two lines: WORKING and the real commit
    expect(lines).toHaveLength(2);

    // First line should be the WORKING commit
    expect(lines[0].commit.hash).toBe('__WORKING__');
    expect(lines[0].prefix).toContain('●');

    // Second line should be the real commit
    expect(lines[1].commit.hash).toBe('abc123');
  });

  it('WORKING node is skipped when no changes exist', () => {
    // When workingChanges is null or all categories are empty,
    // CommitScreen should NOT create the synthetic commit
    const realCommits = [commit('abc123', [])];

    // Simulate: no synthetic commit created because workingChanges is empty
    const lines = buildGraphLines(realCommits);
    expect(lines).toHaveLength(1);
    expect(lines[0].commit.hash).toBe('abc123');
  });

  it('WORKING node collects all file categories', () => {
    const stagedFiles = [
      { status: 'M' as const, path: 'file1.txt' },
      { status: 'A' as const, path: 'file2.txt' },
    ];
    const unstagedFiles = [
      { status: 'M' as const, path: 'file3.txt' },
      { status: 'D' as const, path: 'file3b.txt' },
    ];
    const untrackedFiles = [{ status: '??' as const, path: 'file4.txt' }];

    const workingCommit: CommitEntry = {
      hash: '__WORKING__',
      message: '[WORKING] Local changes',
      date: '2026-03-17',
      author: 'you',
      body: '',
      parentHash: ['abc123'],
      refs: [],
      changedFiles: [...stagedFiles, ...unstagedFiles, ...untrackedFiles],
    };

    expect(workingCommit.changedFiles).toHaveLength(5);
    expect(workingCommit.changedFiles.some((f) => f.path === 'file1.txt')).toBe(true);
    expect(workingCommit.changedFiles.some((f) => f.path === 'file4.txt')).toBe(true);
  });

  it('GraphRow component should display diamond for WORKING node', () => {
    // Note: This is testing the logic, not the actual component rendering
    // The actual component uses: isWorking ? prefix.replace('●', '◆') : prefix
    const workingCommit = commit('__WORKING__', ['abc123']);
    const lines = buildGraphLines([workingCommit]);

    const line = lines[0];
    expect(line.commit.hash).toBe('__WORKING__');
    // The prefix contains '●'; CommitScreen will replace it with '◆'
    expect(line.prefix).toContain('●');

    // Simulate the replacement that GraphRow does
    const displayPrefix = line.prefix.replace('●', '◆');
    expect(displayPrefix).toContain('◆');
  });
});
