import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRepository } from '../../src/hooks/useRepository.js';
import { Repository } from '../../src/data/Repository.js';
import type { WorkingChanges } from '../../src/data/mockRepos.js';

vi.mock('../../src/data/Repository.js', () => ({ Repository: { open: vi.fn() } }));

const REPO_PATH = '/fake/repo';
const EMPTY_CHANGES: WorkingChanges = { staged: [], unstaged: [], untracked: [] };

const openMock = Repository.open as unknown as {
  mockResolvedValue: (val: unknown) => void;
  mockRejectedValue: (val: unknown) => void;
};

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    getPath: () => REPO_PATH,
    listCommits: vi.fn().mockResolvedValue([]),
    getChangedFilesForAllCommits: vi.fn().mockResolvedValue(new Map()),
    getRefs: vi.fn().mockResolvedValue(new Map()),
    listStashes: vi.fn().mockResolvedValue([]),
    getWorkingChanges: vi.fn().mockResolvedValue(EMPTY_CHANGES),
    getBranchInfo: vi.fn().mockResolvedValue({
      currentBranch: 'main',
      remoteBranch: null,
      ahead: 0,
      behind: 0,
      headAuthor: 'Unknown',
      repoPath: REPO_PATH,
    }),
    ...overrides,
  };
}

async function loadHook() {
  const hook = renderHook(() => useRepository(REPO_PATH));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useRepository error messages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appends the cause message when the error has an Error cause', async () => {
    openMock.mockRejectedValue(new Error('Not a git repository', { cause: new Error('fatal') }));
    const { result } = await loadHook();
    expect(result.current.error).toBe('Not a git repository\n(fatal)');
  });

  it('uses a thrown string as the error message', async () => {
    openMock.mockRejectedValue('boom');
    const { result } = await loadHook();
    expect(result.current.error).toBe('boom');
  });

  it('falls back to a generic message for unknown error values', async () => {
    openMock.mockRejectedValue(42);
    const { result } = await loadHook();
    expect(result.current.error).toBe('Unknown error loading repository');
    expect(await result.current.refreshWorkingChanges()).toBeNull();
  });
});

describe('useRepository loading details', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults refs and changed files to empty arrays when none are found', async () => {
    const commit = {
      hash: 'abc',
      message: 'm',
      date: '2026-01-01',
      author: 'A',
      body: '',
      parentHash: [],
      refs: ['stale'],
      changedFiles: [{ status: 'M', path: 'stale' }],
    };
    openMock.mockResolvedValue(makeRepo({ listCommits: vi.fn().mockResolvedValue([commit]) }));
    const { result } = await loadHook();
    expect(result.current.repos[0].commits[0].refs).toEqual([]);
    expect(result.current.repos[0].commits[0].changedFiles).toEqual([]);
  });
});

describe('useRepository refreshWorkingChanges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reloads working changes into state', async () => {
    const updated: WorkingChanges = {
      staged: [{ status: 'A', path: 'new.ts' }],
      unstaged: [],
      untracked: [],
    };
    const getWorkingChanges = vi
      .fn()
      .mockResolvedValueOnce(EMPTY_CHANGES)
      .mockResolvedValueOnce(updated);
    openMock.mockResolvedValue(makeRepo({ getWorkingChanges }));
    const { result } = await loadHook();

    let returned: WorkingChanges | null = null;
    await act(async () => {
      returned = await result.current.refreshWorkingChanges();
    });

    expect(returned).toEqual(updated);
    expect(result.current.workingChanges).toEqual(updated);
  });

  it('returns null and keeps the old state when git fails', async () => {
    const getWorkingChanges = vi
      .fn()
      .mockResolvedValueOnce(EMPTY_CHANGES)
      .mockRejectedValueOnce(new Error('git status failed'));
    openMock.mockResolvedValue(makeRepo({ getWorkingChanges }));
    const { result } = await loadHook();

    let returned: WorkingChanges | null = EMPTY_CHANGES;
    await act(async () => {
      returned = await result.current.refreshWorkingChanges();
    });

    expect(returned).toBeNull();
    expect(result.current.workingChanges).toEqual(EMPTY_CHANGES);
  });

  it('returns null without calling git after unmount', async () => {
    const repo = makeRepo();
    openMock.mockResolvedValue(repo);
    const { result, unmount } = await loadHook();
    const refresh = result.current.refreshWorkingChanges;

    unmount();

    expect(await refresh()).toBeNull();
    expect(repo.getWorkingChanges).toHaveBeenCalledTimes(1);
  });
});
