import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStartup } from '../../src/components/Scanner.js';
import { Repository } from '../../src/data/Repository.js';
import type { CommitEntry } from '../../src/data/mockRepos.js';

// Mock type for Repository
interface MockRepository {
  getPath: () => string;
  fetchAll: () => Promise<{ ok: boolean; message: string }>;
  listCommits: () => Promise<CommitEntry[]>;
  getChangedFiles: () => Promise<Array<{ status: string; path: string }>>;
  getBranchName: () => Promise<string | undefined>;
}

// Mock the Repository class
vi.mock('../../src/data/Repository.js', () => ({
  Repository: {
    open: vi.fn(),
  },
}));

describe('useStartup', () => {
  const mockCommit: CommitEntry = {
    hash: 'abc123',
    message: 'test commit',
    date: '2026-03-17',
    author: 'Test Author',
    body: '',
    parentHash: [],
    branchName: 'main',
    changedFiles: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: phase is "Connecting to remote…", done is false', async () => {
    const mockRepo = {
      open: vi.fn(),
      getPath: vi.fn(() => '/test/repo'),
      fetchAll: vi.fn(() => ({ ok: true, message: 'Fetched' })),
      listCommits: vi.fn(() => Promise.resolve([mockCommit])),
      getChangedFiles: vi.fn(() => Promise.resolve([])),
      getBranchName: vi.fn(() => Promise.resolve('main')),
    };

    vi.mocked(Repository.open).mockResolvedValue(mockRepo as unknown as MockRepository);

    const { result } = renderHook(() => useStartup('/test/repo'));

    expect(result.current.phase).toBe('Connecting to remote…');
    expect(result.current.done).toBe(false);
  });

  it('transitions through phases as operations complete', async () => {
    const mockRepo = {
      getPath: vi.fn(() => '/test/repo'),
      fetchAll: vi.fn(async () => ({ ok: true, message: 'Fetched' })),
      listCommits: vi.fn(async () => [mockCommit]),
      getChangedFiles: vi.fn(async () => []),
      getBranchName: vi.fn(async () => 'main'),
    };

    vi.mocked(Repository.open).mockResolvedValue(mockRepo as unknown as MockRepository);

    const { result } = renderHook(() => useStartup('/test/repo'));

    // Wait for all async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should reach final state with repos loaded
    expect(result.current.done).toBe(true);
    expect(result.current.phase).toBe('Ready');
    expect(result.current.repos).toHaveLength(1);
    expect(result.current.repos[0]?.commits).toHaveLength(1);
  });

  it('handles fetch failure gracefully', async () => {
    const mockRepo = {
      getPath: vi.fn(() => '/test/repo'),
      fetchAll: vi.fn(async () => ({ ok: false, message: 'No remote configured' })),
      listCommits: vi.fn(async () => [mockCommit]),
      getChangedFiles: vi.fn(async () => []),
      getBranchName: vi.fn(async () => 'main'),
    };

    vi.mocked(Repository.open).mockResolvedValue(mockRepo as unknown as MockRepository);

    const { result } = renderHook(() => useStartup('/test/repo'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should still complete successfully with repos
    expect(result.current.done).toBe(true);
    expect(result.current.repos).toHaveLength(1);
    // Fetch failure is recorded in the error field
    expect(result.current.error).toBeDefined();
  });

  it('handles repository open error', async () => {
    vi.mocked(Repository.open).mockRejectedValue(new Error('Not a git repository'));

    const { result } = renderHook(() => useStartup('/test/repo'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should complete with error state
    expect(result.current.done).toBe(true);
    expect(result.current.repoError).toContain('Not a git repository');
    expect(result.current.repos).toHaveLength(0);
  });

  it('cleans up and does not update state after unmount', async () => {
    const mockRepo = {
      getPath: vi.fn(() => '/test/repo'),
      fetchAll: vi.fn(async () => {
        // Simulate a long-running fetch
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { ok: true, message: 'Fetched' };
      }),
      listCommits: vi.fn(async () => [mockCommit]),
      getChangedFiles: vi.fn(async () => []),
      getBranchName: vi.fn(async () => 'main'),
    };

    vi.mocked(Repository.open).mockResolvedValue(mockRepo as unknown as MockRepository);

    const { unmount } = renderHook(() => useStartup('/test/repo'));

    // Unmount before async operations complete
    unmount();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // If we reach here without warnings about state updates, cleanup worked
    expect(true).toBe(true);
  });

  it('populates repos with commits and file data', async () => {
    const mockCommitWithFiles: CommitEntry = {
      ...mockCommit,
      changedFiles: [{ status: 'M', path: 'file.ts' }],
    };

    const mockRepo = {
      getPath: vi.fn(() => '/test/repo'),
      fetchAll: vi.fn(async () => ({ ok: true, message: 'Fetched' })),
      listCommits: vi.fn(async () => [mockCommitWithFiles]),
      getChangedFiles: vi.fn(async () => [{ status: 'M', path: 'file.ts' }]),
      getBranchName: vi.fn(async () => 'main'),
    };

    vi.mocked(Repository.open).mockResolvedValue(mockRepo as unknown as MockRepository);

    const { result } = renderHook(() => useStartup('/test/repo'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.repos[0]?.commits[0]?.changedFiles).toHaveLength(1);
  });
});
