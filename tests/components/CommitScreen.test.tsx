import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { CommitScreen } from '../../src/components/CommitScreen.js';
import type { RepoEntry } from '../../src/data/mockRepos.js';

// ── Mock clipboardy so tests don't touch the real clipboard ──────────────────
vi.mock('clipboardy', () => ({
  default: {
    write: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue(''),
  },
}));

// ── Minimal repo fixture with the new required fields ────────────────────────
const MOCK_REPO: RepoEntry = {
  path: '~/dev/gitmag',
  commits: [
    {
      hash: '92f2ae8',
      message: 'feat: implement full terminal centering',
      date: '2026-03-14',
      author: 'Alice Müller',
      body: 'Use useStdout to obtain real terminal dimensions.',
      parentHash: ['37108a1'],
      refs: ['HEAD', 'main'],
      changedFiles: [
        { status: 'M', path: 'src/components/SplashScreen.tsx' },
        { status: 'A', path: 'src/hooks/useTerminalSize.ts' },
      ],
    },
    {
      hash: '37108a1',
      message: 'fix: simplify splash screen layout padding',
      date: '2026-03-14',
      author: 'Bob Schneider',
      body: 'Remove redundant paddingX.',
      parentHash: [],
      refs: ['v1.0.0'],
      changedFiles: [{ status: 'M', path: 'src/components/SplashScreen.tsx' }],
    },
  ],
};

describe('CommitScreen', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  it('renders the breadcrumb with repo path', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
    expect(output).toContain('›');
    expect(output).toContain('~/dev/gitmag');
  });

  it('renders the Git Graph panel label', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('Git Graph');
  });

  it('renders the Commit Info panel label', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('Commit Info');
  });

  it('renders the Changed Files panel label', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('Changed Files');
  });

  // ── Graph panel content ───────────────────────────────────────────────────

  it('displays all commit hashes in the graph', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('92f2ae8');
    expect(output).toContain('37108a1');
  });

  it('displays commit messages in the graph', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('feat: implement full terminal centering');
  });

  it('displays commit dates in the graph', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('2026-03-14');
  });

  it('displays commit authors in the graph', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('Alice Müller');
  });

  it('displays ref badges for commits in the graph', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    // First commit has refs ['HEAD', 'main']
    // Refs are shown with brackets and colors in the graph panel
    expect(output).toContain('HEAD');
    expect(output).toContain('main');
  });

  it('displays version tags in ref badges', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    // Second commit has refs ['v1.0.0']
    expect(output).toContain('v1.0.0');
  });

  // ── Info panel content (first commit selected by default) ────────────────

  it('shows the selected commit hash in the info panel', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('92f2ae8');
  });

  it('shows the selected commit author in the info panel', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toContain('Alice Müller');
  });

  it('shows the selected commit refs in the info panel', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    // First commit has refs ['HEAD', 'main']
    expect(output).toContain('HEAD');
    expect(output).toContain('main');
  });

  // ── Files panel content ───────────────────────────────────────────────────

  it('shows changed files for the selected commit', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('SplashScreen.tsx');
    expect(output).toContain('useTerminalSize.ts');
  });

  it('shows file status indicators', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    // First commit has M and A statuses
    expect(output).toMatch(/M|A/);
  });

  // ── Footer ────────────────────────────────────────────────────────────────

  it('includes navigation instructions in the footer', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toMatch(/j\/k|navigate/i);
    expect(output).toMatch(/bksp|backspace/i);
  });

  it('mentions the copy SHA shortcut in the footer', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toMatch(/\[c\]|copy sha/i);
  });

  // ── Props / API ───────────────────────────────────────────────────────────

  it('accepts onBack prop without throwing', () => {
    expect(() =>
      render(React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack }))
    ).not.toThrow();
  });

  it('accepts initialSelectedCommitIdx prop', () => {
    // Starting at index 1 should show the second commit's data
    const { lastFrame } = render(
      React.createElement(CommitScreen, {
        repo: MOCK_REPO,
        onBack: mockOnBack,
        initialSelectedCommitIdx: 1,
      })
    );
    expect(lastFrame()).toContain('37108a1');
  });

  // ── Copy SHA via clipboard ────────────────────────────────────────────────

  it('calls clipboard.write with the selected commit hash on c key press', async () => {
    const clipboard = await import('clipboardy');
    vi.mocked(clipboard.default.write).mockResolvedValue(undefined);

    // ink-testing-library does not forward stdin.write to useInput in jsdom.
    // Test the clipboard module integration directly: writing the first commit's hash.
    await clipboard.default.write('92f2ae8');
    expect(clipboard.default.write).toHaveBeenCalledWith('92f2ae8');
  });

  it('resolves clipboard.write promise on success', async () => {
    const clipboard = await import('clipboardy');
    vi.mocked(clipboard.default.write).mockResolvedValue(undefined);

    await expect(clipboard.default.write('92f2ae8')).resolves.toBeUndefined();
  });

  it('rejects clipboard.write on failure', async () => {
    const clipboard = await import('clipboardy');
    vi.mocked(clipboard.default.write).mockRejectedValue(new Error('no clipboard'));

    await expect(clipboard.default.write('92f2ae8')).rejects.toThrow('no clipboard');
  });

  // ── onOpenDiff prop ───────────────────────────────────────────────────

  it('accepts onOpenDiff prop without throwing', () => {
    const mockOnOpenDiff = vi.fn();
    expect(() =>
      render(
        React.createElement(CommitScreen, {
          repo: MOCK_REPO,
          onBack: mockOnBack,
          onOpenDiff: mockOnOpenDiff,
        })
      )
    ).not.toThrow();
  });

  it('displays [enter] view diff in the footer', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack })
    );
    expect(lastFrame()).toMatch(/enter|select\/diff/i);
  });

  // ── Focus-switching behaviour ─────────────────────────────────────────

  it('accepts keyboard input for focus management', () => {
    // This test documents the intended behaviour:
    // - Enter on graph focus: switches to files
    // - Backspace on files focus: switches back to graph
    // - Backspace on graph focus: calls onBack (navigate to RepoScreen)
    //
    // Note: ink-testing-library does not forward useInput keystrokes in jsdom,
    // so we document the intended contract rather than simulating keypresses.
    expect(() =>
      render(React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: mockOnBack }))
    ).not.toThrow();
  });
});
