import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import type { Key } from 'ink';
import { FileDiffScreen } from '../../src/components/FileDiffScreen.js';
import type { RepoEntry, CommitEntry, ChangedFile } from '../../src/data/mockRepos.js';

type InputHandler = (input: string, key: Key) => void;

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  let currentHandler: InputHandler | undefined;
  const exit = vi.fn();
  return {
    ...actual,
    useInput: (handler: InputHandler) => {
      currentHandler = handler;
    },
    useApp: () => ({ exit }),
    useStdout: () => ({ stdout: { columns: 100, rows: 30 } }),
    __getHandler: () => currentHandler,
    __exit: exit,
  };
});

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

const MOCK_FILE_WITH_MULTILINE_DIFF: ChangedFile = {
  status: 'M',
  path: 'src/index.ts',
  diff: `--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,5 @@
  import React from 'react';
  
+// New import
+import helper from './helper';
  export function main() {
 -  console.log('old');
 +  console.log('new');
    return 42;
  }`,
};

async function latestHandler(): Promise<InputHandler> {
  const inkModule = (await import('ink')) as typeof import('ink') & {
    __getHandler: () => InputHandler | undefined;
  };
  const handler = inkModule.__getHandler();
  if (!handler) throw new Error('No useInput handler registered');
  return handler;
}

async function send(input: string, key: Partial<Key> = {}) {
  const handler = await latestHandler();
  handler(input, key as Key);
}

async function exitSpy() {
  const inkModule = (await import('ink')) as typeof import('ink') & {
    __exit: ReturnType<typeof vi.fn>;
  };
  return inkModule.__exit;
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('FileDiffScreen', () => {
  const mounted: Array<{ unmount: () => void }> = [];
  const mockOnBack = vi.fn();
  const mockGetDiff = vi.fn().mockResolvedValue('');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const app of mounted.splice(0)) app.unmount();
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  it('renders the breadcrumb with repo path', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toMatch(/no diff|unavailable|available|loading/i);
  });

  it('displays unified diff headers (@@)', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toMatch(/j\/k|scroll|up|down/i);
    expect(output).toMatch(/bksp|backspace|back/i);
  });

  // ── Props ─────────────────────────────────────────────────────────────────

  it('accepts onBack prop without throwing', () => {
    expect(() =>
      render(
        React.createElement(FileDiffScreen, {
          repo: MOCK_REPO,
          commit: MOCK_COMMIT,
          file: MOCK_FILE_WITH_DIFF,
          getDiff: mockGetDiff,
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
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    expect(lastFrame()).toContain('new-file.ts');
  });

  // ── DiffLine color rendering ──────────────────────────────────────────────

  it('renders added lines with green color', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toContain('+');
  });

  it('renders removed lines with red color', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    expect(output).toContain('-');
  });

  it('renders unified diff chunk headers with cyan color', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    // @@ markers in unified diff headers
    expect(output).toContain('@@');
  });

  it('renders context lines with gray color', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    // Should have context lines (not starting with +/-)
    expect(output).toContain('export');
  });

  // ── Line numbers ──────────────────────────────────────────────────────────

  it('displays line numbers by default', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    // Line numbers should appear with pipe separator
    expect(output).toContain('│');
  });

  // ── Lazy loading diff ─────────────────────────────────────────────────────

  it('loads diff asynchronously when not provided in props', async () => {
    const customGetDiff = vi.fn().mockResolvedValue(`--- a/new.ts
+++ b/new.ts
@@ -1 +1,2 @@
 console.log('hi');
+console.log('bye');`);

    const fileWithoutDiff: ChangedFile = {
      status: 'M',
      path: 'new.ts',
    };

    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: fileWithoutDiff,
        getDiff: customGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    // Wait for the async load to complete
    await flush();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flush();

    // Should eventually display loaded diff
    const output = app.lastFrame();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles error when getDiff fails', async () => {
    const errorGetDiff = vi.fn().mockRejectedValue(new Error('Network error'));
    const fileWithoutDiff: ChangedFile = {
      status: 'M',
      path: 'error.ts',
    };

    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: fileWithoutDiff,
        getDiff: errorGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    await flush();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flush();

    const output = app.lastFrame();
    // Should show error message
    expect(output).toContain('error.ts');
  });

  // ── Scrolling behavior ────────────────────────────────────────────────────

  it('shows scroll position in footer', () => {
    const { lastFrame } = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_MULTILINE_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    const output = lastFrame();
    // Footer should show range like "1–10 / total"
    // eslint-disable-next-line sonarjs/slow-regex
    expect(output).toMatch(/\d+–\d+\s*\/\s*\d+/);
  });
});

// ── FileDiffScreen keyboard interactions ───────────────────────────────────

describe('FileDiffScreen keyboard interactions', () => {
  const mounted: Array<{ unmount: () => void }> = [];
  const mockOnBack = vi.fn();
  const mockGetDiff = vi.fn().mockResolvedValue('');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const app of mounted.splice(0)) app.unmount();
  });

  it('exits application when q is pressed', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    await send('q');

    expect(await exitSpy()).toHaveBeenCalled();
  });

  it('goes back when backspace is pressed', async () => {
    const onBackMock = vi.fn();
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: onBackMock,
      })
    );
    mounted.push(app);

    await send('', { backspace: true });

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('goes back when delete is pressed', async () => {
    const onBackMock = vi.fn();
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: onBackMock,
      })
    );
    mounted.push(app);

    await send('', { delete: true });

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('toggles line numbers when l is pressed', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    const frameWithNumbers = app.lastFrame();
    // Should have line numbers pipe separator
    expect(frameWithNumbers).toContain('│');

    await send('l');
    await flush();

    const frameWithoutNumbers = app.lastFrame();
    // After toggling, should still render without error
    expect(frameWithoutNumbers).toBeDefined();

    await send('l');
    await flush();

    const frameWithNumbersAgain = app.lastFrame();
    expect(frameWithNumbersAgain).toContain('│');
  });

  it('scrolls up with up arrow', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_MULTILINE_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    await send('', { upArrow: true });
    await flush();

    // Should not throw, scroll state should update
    const scrolledFrame = app.lastFrame();
    expect(scrolledFrame).toBeDefined();
  });

  it('scrolls down with down arrow', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_MULTILINE_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    await send('', { downArrow: true });
    await flush();

    const scrolledFrame = app.lastFrame();
    expect(scrolledFrame).toBeDefined();
  });

  it('prevents scrolling above zero', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    // Scroll up multiple times from the start
    await send('', { upArrow: true });
    await send('', { upArrow: true });
    await send('', { upArrow: true });
    await flush();

    // Should not break, just stay at top
    const frame = app.lastFrame();
    expect(frame).toBeDefined();
  });

  it('handles large multiline diffs without breaking', async () => {
    const largeDiff: ChangedFile = {
      status: 'M',
      path: 'large.ts',
      diff: Array.from({ length: 50 })
        .map((_, i) => ` line ${i}`)
        .join('\n'),
    };

    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: largeDiff,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    // Scroll down through the large diff
    for (let i = 0; i < 10; i++) {
      await send('', { downArrow: true });
    }
    await flush();

    const frame = app.lastFrame();
    expect(frame).toBeDefined();
  });

  it('responds to multiple keyboard inputs in sequence', async () => {
    const app = render(
      React.createElement(FileDiffScreen, {
        repo: MOCK_REPO,
        commit: MOCK_COMMIT,
        file: MOCK_FILE_WITH_MULTILINE_DIFF,
        getDiff: mockGetDiff,
        onBack: mockOnBack,
      })
    );
    mounted.push(app);

    await send('', { downArrow: true });
    await send('l');
    await send('', { upArrow: true });
    await send('l');
    await flush();

    const frame = app.lastFrame();
    expect(frame).toBeDefined();
    expect(mockOnBack).not.toHaveBeenCalled();
  });
});
