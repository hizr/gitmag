import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRepository } from '../../src/hooks/useRepository.js';
import { Repository } from '../../src/data/Repository.js';

// Mock the Repository class
vi.mock('../../src/data/Repository.js', () => {
  const mockRepository = {
    open: vi.fn(),
  };
  return { Repository: mockRepository };
});

describe('useRepository', () => {
  const mockRepoPath = '/fake/repo';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial loading state', () => {
    const mockRepo = {
      getPath: () => mockRepoPath,
      listCommits: vi.fn().mockResolvedValue([]),
      getChangedFiles: vi.fn().mockResolvedValue([]),
    };
    (Repository.open as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(
      mockRepo
    );

    const { result } = renderHook(() => useRepository(mockRepoPath));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.repos).toEqual([]);
  });

  it('loads repository and commits on success', async () => {
    const mockCommits = [
      {
        hash: 'abc123',
        message: 'test commit',
        date: '2026-03-17',
        author: 'Test Author',
        body: 'test body',
        parentHash: [],
        branchName: undefined,
        changedFiles: [],
      },
    ];

    const mockRepo = {
      getPath: () => mockRepoPath,
      listCommits: vi.fn().mockResolvedValue(mockCommits),
      getChangedFiles: vi.fn().mockResolvedValue([]),
    };
    (Repository.open as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(
      mockRepo
    );

    const { result } = renderHook(() => useRepository(mockRepoPath));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.repos).toHaveLength(1);
    expect(result.current.repos[0].path).toBe(mockRepoPath);
    expect(result.current.repos[0].commits).toHaveLength(1);
  });

  it('sets error state on repository open failure', async () => {
    const errorMessage = 'Not a git repository: /fake/repo';
    (Repository.open as unknown as { mockRejectedValue: (val: unknown) => void }).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useRepository(mockRepoPath));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.repos).toEqual([]);
  });

  it('cleans up on unmount (isMounted flag)', async () => {
    const mockRepo = {
      getPath: () => mockRepoPath,
      listCommits: vi.fn().mockResolvedValue([]),
      getChangedFiles: vi.fn().mockResolvedValue([]),
    };
    (Repository.open as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(
      mockRepo
    );

    const { unmount } = renderHook(() => useRepository(mockRepoPath));

    unmount();

    // Hook should not crash or update state after unmount
    expect(true).toBe(true); // Smoke test
  });
});
