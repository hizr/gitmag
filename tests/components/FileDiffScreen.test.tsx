import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { FileDiffScreen } from '../../src/components/FileDiffScreen.js';
import type { RepoEntry, CommitEntry, ChangedFile } from '../../src/data/mockRepos.js';

// ── Minimal fixtures ──────────────────────────────────────────────────────────

const MOCK_REPO: RepoEntry = {
  path: '~/dev/gitmag',
  commits: [],
};

const MOCK_COMMIT: CommitEntry = {
  hash: '92f2ae8',
  message: 'feat: implement full terminal centering',
  date: '2026-03-14',
  author: 'Alice Müller',
  body: 'Use useStdout to obtain real terminal dimensions.',
  parentHash: [],
  branchName: 'main',
  changedFiles: [],
};

const MOCK_FILE_WITH_DIFF: ChangedFile = {
  status: 'M',
  path: 'src/components/SplashScreen.tsx',
  diff: `--- a/src/components/SplashScreen.tsx
+++ b/src/components/SplashScreen.tsx
@@ -10,7 +10,8 @@
 export function SplashScreen({ onComplete, scanProgress }: SplashScreenProps) {
   const { stdout } = useStdout();
-  const termCols = stdout.columns ?? 80;
-  const termRows = stdout.rows ?? 24;
+  const termCols = Math.max(stdout.columns ?? 80, 80);
+  const termRows = Math.max(stdout.rows ?? 24, 24);
+  // Use real terminal dimensions for proper centering
   
   // Render the splash screen centered
   return (`,
};

const MOCK_FILE_WITHOUT_DIFF: ChangedFile = {
  status: 'A',
  path: 'src/utils/helper.ts',
};

describe('FileDiffScreen', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  it('renders the breadcrumb with repo path', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
    expect(output).toContain('›');
    expect(output).toContain('~/dev/gitmag');
  });

  it('includes the commit hash in the breadcrumb', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('92f2ae8');
  });

  it('includes the file path in the breadcrumb', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('SplashScreen.tsx');
  });

  // ── Panel ─────────────────────────────────────────────────────────────────

  it('renders the File Diff panel label', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('File Diff');
  });

  // ── Diff content ──────────────────────────────────────────────────────────

  it('displays the diff content when available', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toContain('stdout.columns');
    expect(output).toContain('Math.max');
  });

  it('displays a placeholder message when diff is not available', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITHOUT_DIFF,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toMatch(/no diff|unavailable|available/i);
  });

  it('displays unified diff headers (@@)', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('@@');
  });

  // ── Footer ────────────────────────────────────────────────────────────────

  it('includes navigation instructions in the footer', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toMatch(/j\/k|scroll/i);
    expect(output).toMatch(/bksp|backspace/i);
  });

  // ── Props ─────────────────────────────────────────────────────────────────

  it('accepts onBack prop without throwing', () => {
    expect(() =>
      render(
        React.createElement(FileDiffScreen, {
          repo: MOCK_REPO,
          commit: MOCK_COMMIT,
          file: MOCK_FILE_WITH_DIFF,
          onBack: mockOnBack,
        })
      )
    ).not.toThrow();
  });

  it('renders with different file types', () => {
    const addedFile: ChangedFile = { status: 'A', path: 'src/new-file.ts' };
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: addedFile,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('new-file.ts');
  });
});
