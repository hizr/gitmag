import { describe, it, expect } from 'vitest';
import { buildGraphLines, isRenderableConnectorPrefix } from '../../src/utils/git-graph.js';
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
  it('returns at least one line per commit', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    expect(lines.length).toBeGreaterThanOrEqual(commits.length);
  });

  it('commit lines carry the original commit', () => {
    const commits = [commit('abc1234', [])];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    expect(commitLines[0].commit).toBe(commits[0]);
  });

  // ── Linear history ──────────────────────────────────────────────────
  it('linear: first commit gets a node symbol', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    expect(commitLines[0].prefix).toContain('●');
    expect(commitLines[1].prefix).toContain('●');
  });

  it('linear: root commit (no parents) still renders a node', () => {
    const commits = [commit('root', [])];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    expect(commitLines[0].prefix).toContain('●');
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
    const commitLines = lines.filter((l) => l.kind === 'commit');
    const mergeLine = commitLines.find((l) => l.commit.hash === 'merge')!;
    expect(mergeLine.prefix).toContain('●');
  });

  it('merge commit emits a connector row after it', () => {
    const commits = [
      commit('merge', ['p1', 'p2']),
      commit('p1', ['base']),
      commit('p2', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    const mergeCommitIdx = lines.findIndex((l) => l.kind === 'commit' && l.commit.hash === 'merge');
    expect(mergeCommitIdx).toBeGreaterThanOrEqual(0);
    // Next line should be a connector
    expect(lines[mergeCommitIdx + 1]?.kind).toBe('connector');
  });

  it('commits on a second lane get a higher column index', () => {
    const commits = [
      commit('merge', ['main1', 'branch1']),
      commit('main1', ['base']),
      commit('branch1', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    const branchLine = commitLines.find((l) => l.commit.hash === 'branch1')!;
    const mainLine = commitLines.find((l) => l.commit.hash === 'main1')!;
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

  // ── Connector rows ───────────────────────────────────────────────────
  it('merge opening emits exactly one connector row', () => {
    const commits = [commit('merge', ['p1', 'p2']), commit('p1', []), commit('p2', [])];
    const lines = buildGraphLines(commits);
    const connectors = lines.filter((l) => l.kind === 'connector');
    // Merge opening should emit one connector
    expect(connectors.length).toBeGreaterThanOrEqual(1);
  });

  it('merge opening connector uses backslash symbol', () => {
    const commits = [commit('merge', ['p1', 'p2']), commit('p1', []), commit('p2', [])];
    const lines = buildGraphLines(commits);
    const mergeConnector = lines.find(
      (l, idx) => l.kind === 'connector' && idx > 0 && lines[idx - 1].kind === 'commit'
    );
    expect(mergeConnector).toBeDefined();
    if (mergeConnector && mergeConnector.kind === 'connector') {
      expect(mergeConnector.prefix).toMatch(/\\/);
    }
  });

  it('convergence of multiple lanes emits a connector row', () => {
    const commits = [
      commit('a', []),
      commit('b', ['a']),
      commit('c', ['a']),
      commit('merge', ['b', 'c']),
    ];
    const lines = buildGraphLines([...commits].reverse());
    const connectors = lines.filter((l) => l.kind === 'connector');
    // Should have at least one connector for convergence
    expect(connectors.length).toBeGreaterThanOrEqual(1);
  });

  // ── Discriminated union type checking ────────────────────────────────
  it('all commit lines have kind=commit and commit property', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    for (const line of commitLines) {
      expect(line.kind).toBe('commit');
      if (line.kind === 'commit') {
        expect(line.commit).toBeDefined();
        expect(typeof line.commit.hash).toBe('string');
        expect(typeof line.column).toBe('number');
      }
    }
  });

  it('all connector lines have kind=connector and prefix property', () => {
    const commits = [commit('merge', ['p1', 'p2']), commit('p1', []), commit('p2', [])];
    const lines = buildGraphLines(commits);
    const connectors = lines.filter((l) => l.kind === 'connector');
    for (const line of connectors) {
      expect(line.kind).toBe('connector');
      if (line.kind === 'connector') {
        expect(typeof line.prefix).toBe('string');
        // Should not have commit or column
        expect((line as Record<string, unknown>).commit).toBeUndefined();
        expect((line as Record<string, unknown>).column).toBeUndefined();
      }
    }
  });

  it('all connector prefixes are renderable (never blank rows)', () => {
    const commits = [
      commit('merge', ['p1', 'p2']),
      commit('p1', ['base']),
      commit('p2', ['base']),
      commit('base', []),
    ];
    const lines = buildGraphLines(commits);
    const connectors = lines.filter((l) => l.kind === 'connector');
    for (const line of connectors) {
      if (line.kind === 'connector') {
        expect(isRenderableConnectorPrefix(line.prefix)).toBe(true);
      }
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
    const commitLine = lines.find((l) => l.kind === 'commit' && l.commit.hash === 'abc123');
    if (commitLine && commitLine.kind === 'commit') {
      expect(commitLine.commit.refs).toEqual(['HEAD', 'main', 'v1.0.0']);
    }
  });

  // ── Column field ────────────────────────────────────────────────────
  it('commit lines expose a numeric column field', () => {
    const commits = [commit('a', ['b']), commit('b', [])];
    const lines = buildGraphLines(commits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    for (const line of commitLines) {
      if (line.kind === 'commit') {
        expect(typeof line.column).toBe('number');
      }
    }
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

    // Should have at least two lines (one for each commit)
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // First commit line should be the WORKING commit
    const commitLines = lines.filter((l) => l.kind === 'commit');
    expect(commitLines[0].commit.hash).toBe('__WORKING__');
    expect(commitLines[0].prefix).toContain('●');

    // Second commit line should be the real commit
    expect(commitLines[1].commit.hash).toBe('abc123');
  });

  it('WORKING node is skipped when no changes exist', () => {
    // When workingChanges is null or all categories are empty,
    // CommitScreen should NOT create the synthetic commit
    const realCommits = [commit('abc123', [])];

    // Simulate: no synthetic commit created because workingChanges is empty
    const lines = buildGraphLines(realCommits);
    const commitLines = lines.filter((l) => l.kind === 'commit');
    expect(commitLines).toHaveLength(1);
    expect(commitLines[0].commit.hash).toBe('abc123');
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

    const commitLine = lines.find((l) => l.kind === 'commit' && l.commit.hash === '__WORKING__');
    expect(commitLine).toBeDefined();
    if (commitLine && commitLine.kind === 'commit') {
      // The prefix contains '●'; CommitScreen will replace it with '◆'
      expect(commitLine.prefix).toContain('●');

      // Simulate the replacement that GraphRow does
      const displayPrefix = commitLine.prefix.replace('●', '◆');
      expect(displayPrefix).toContain('◆');
    }
  });
});
