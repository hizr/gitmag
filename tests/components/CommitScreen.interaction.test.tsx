import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import type { Key } from 'ink';
import { CommitScreen } from '../../src/components/CommitScreen.js';
import type { RepoEntry, WorkingChanges } from '../../src/data/mockRepos.js';

type InputHandler = (input: string, key: Key) => void;

vi.mock('clipboardy', () => ({
  default: {
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

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

const MOCK_REPO: RepoEntry = {
  path: '~/dev/gitmag',
  branchInfo: {
    currentBranch: 'main',
    remoteBranch: 'origin/main',
    ahead: 0,
    behind: 0,
    headAuthor: 'Alice',
    repoPath: '~/dev/gitmag',
  },
  commits: [
    {
      hash: 'aaaaaaa',
      message: 'feat: first commit',
      date: '2026-03-14',
      author: 'Alice',
      body: 'first body',
      parentHash: ['bbbbbbb'],
      refs: ['HEAD', 'main'],
      changedFiles: [
        { status: 'M', path: 'src/a.ts' },
        { status: 'A', path: 'src/b.ts' },
      ],
    },
    {
      hash: 'bbbbbbb',
      message: 'fix: second commit',
      date: '2026-03-13',
      author: 'Bob',
      body: 'second body',
      parentHash: [],
      refs: ['v0.1.0'],
      changedFiles: [{ status: 'D', path: 'src/c.ts' }],
    },
  ],
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

describe('CommitScreen interactions', () => {
  const mounted: Array<{ unmount: () => void }> = [];

  afterEach(() => {
    for (const app of mounted.splice(0)) app.unmount();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    (await exitSpy()).mockClear();
  });

  it('handles q and p shortcuts', async () => {
    const onPickCommit = vi.fn();
    mounted.push(
      render(React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: vi.fn(), onPickCommit }))
    );

    await send('p');

    expect(onPickCommit).toHaveBeenCalledWith('aaaaaaa');
    expect(await exitSpy()).toHaveBeenCalledTimes(1);

    await send('q');
    expect(await exitSpy()).toHaveBeenCalledTimes(2);
  });

  it('opens search on slash and ignores global keys while search is open', async () => {
    const app = render(React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: vi.fn() }));
    mounted.push(app);

    await send('/');
    await flush();

    expect(app.lastFrame()).toContain('Search (');

    await send('q');
    expect(await exitSpy()).not.toHaveBeenCalled();

    await send('', { escape: true });
  });

  it('switches focus with enter and opens diff on second enter', async () => {
    const onBack = vi.fn();
    const onOpenDiff = vi.fn();
    mounted.push(
      render(
        React.createElement(CommitScreen, {
          repo: MOCK_REPO,
          onBack,
          onOpenDiff,
        })
      )
    );

    await send('', { return: true });
    await flush();
    await send('', { return: true });

    expect(onOpenDiff).toHaveBeenCalledTimes(1);
    expect(onOpenDiff).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'aaaaaaa' }),
      expect.objectContaining({ path: 'src/a.ts' }),
      0,
      0
    );

    await send('', { backspace: true });
    await flush();
    expect(onBack).not.toHaveBeenCalled();

    await send('', { delete: true });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('navigates graph and uses selected commit for diff open', async () => {
    const onOpenDiff = vi.fn();
    mounted.push(
      render(
        React.createElement(CommitScreen, {
          repo: MOCK_REPO,
          onBack: vi.fn(),
          onOpenDiff,
        })
      )
    );

    await send('', { downArrow: true });
    await flush();
    await send('', { return: true });
    await flush();
    await send('', { return: true });

    expect(onOpenDiff).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'bbbbbbb' }),
      expect.objectContaining({ path: 'src/c.ts' }),
      0,
      1
    );
  });

  it('handles working tree synthetic node and skips header rows for open diff', async () => {
    const workingChanges: WorkingChanges = {
      staged: [{ status: 'A', path: 'src/new.ts' }],
      unstaged: [{ status: 'M', path: 'src/mod.ts' }],
      untracked: [{ status: '??', path: 'tmp.txt' }],
    };
    const onOpenDiff = vi.fn();
    const app = render(
      React.createElement(CommitScreen, {
        repo: MOCK_REPO,
        onBack: vi.fn(),
        onOpenDiff,
        workingChanges,
      })
    );
    mounted.push(app);

    expect(app.lastFrame()).toContain('[WORKING] Local changes');

    await send('', { return: true });
    await flush();
    await send('', { return: true });
    expect(onOpenDiff).not.toHaveBeenCalled();

    await send('', { downArrow: true });
    await flush();
    await send('', { return: true });

    expect(onOpenDiff).toHaveBeenCalledTimes(1);
    expect(onOpenDiff).toHaveBeenCalledWith(
      expect.objectContaining({ hash: '__WORKING__' }),
      expect.objectContaining({ path: 'src/new.ts' }),
      1,
      0
    );
  });

  it('renders footer text for default and search match states', async () => {
    const app = render(React.createElement(CommitScreen, { repo: MOCK_REPO, onBack: vi.fn() }));
    mounted.push(app);

    expect(app.lastFrame()).toContain('[/] search');

    await send('/');
    await flush();
    await send('f');
    await send('i');
    await send('x');
    await flush();
    await send('', { return: true });
    await flush();

    expect(app.lastFrame()).toContain('[n/m] next/prev match');
  });
});
