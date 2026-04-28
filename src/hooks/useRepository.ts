import { useState, useEffect } from 'react';
import type { RepoEntry, CommitEntry, WorkingChanges, BranchInfo } from '../data/mockRepos.js';
import { Repository } from '../data/Repository.js';

export interface RepositoryState {
  repos: RepoEntry[];
  loading: boolean;
  error: string | null;
  phase: string;
  repository: Repository | null;
  workingChanges: WorkingChanges | null;
  refreshWorkingChanges: () => Promise<WorkingChanges | null>;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const base = err.message;
    if ('cause' in err && err.cause instanceof Error) {
      return `${base}\n(${err.cause.message})`;
    }
    return base;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'Unknown error loading repository';
}

/**
 * Hook to load a repository from the given path.
 * Returns loading/error states and a single-element repo array on success.
 * @param path Path to the git repository (e.g., process.cwd())
 */
export function useRepository(path: string): RepositoryState {
  const [state, setState] = useState<RepositoryState>({
    repos: [],
    loading: true,
    error: null,
    phase: 'Opening repository…',
    repository: null,
    workingChanges: null,
    refreshWorkingChanges: async () => null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadRepository = async () => {
      try {
        // Phase 1: Open repository
        const repo = await Repository.open(path);
        if (!isMounted) return;
        setState((prev) => ({ ...prev, phase: 'Loading commits…' }));

        // Phase 2: List commits
        const commits = await repo.listCommits(100);
        if (!isMounted) return;
        setState((prev) => ({ ...prev, phase: 'Indexing files…' }));

        // Phase 3: Get changed files for all commits in a single batch call
        const changedFilesMap = await repo.getChangedFilesForAllCommits(100);
        for (const commit of commits) {
          commit.changedFiles = changedFilesMap.get(commit.hash) || [];
        }

        if (!isMounted) return;
        setState((prev) => ({ ...prev, phase: 'Loading metadata…' }));

        // Phases 4, 5, 6: Run in parallel (all independent of each other)
        const headAuthor = commits.length > 0 ? commits[0].author : 'Unknown';
        const [refMap, workingChanges, branchInfo] = await Promise.all([
          repo.getRefs(),
          repo.getWorkingChanges(),
          repo.getBranchInfo(headAuthor),
        ]);

        if (!isMounted) return;
        finishLoadRepository(repo, commits, refMap, workingChanges, branchInfo);
      } catch (err) {
        if (isMounted) {
          // Cannot avoid nesting here (React callback pattern); suppress sonarjs rule

          setState((prev) => ({
            ...prev,
            repos: [],
            loading: false,
            error: extractErrorMessage(err),
            repository: null,
            // eslint-disable-next-line sonarjs/no-nested-functions
            refreshWorkingChanges: async () => null,
          }));
        }
      }
    };

    const finishLoadRepository = (
      repo: Repository,
      commits: CommitEntry[],
      refMap: Map<string, string[]>,
      workingChanges: WorkingChanges,
      branchInfo: BranchInfo
    ) => {
      // Attach refs to commits
      for (const commit of commits) {
        commit.refs = refMap.get(commit.hash) || [];
      }

      const refreshWorkingChanges = async (): Promise<WorkingChanges | null> => {
        if (!isMounted) return null;
        try {
          const updated = await repo.getWorkingChanges();
          // eslint-disable-next-line sonarjs/no-nested-functions
          setState((prev) => ({
            ...prev,
            workingChanges: updated,
          }));
          return updated;
        } catch {
          // Silently fail; keep existing workingChanges
          return null;
        }
      };

      setState({
        repos: [
          {
            path: repo.getPath(),
            commits,
            branchInfo,
          },
        ],
        loading: false,
        error: null,
        phase: 'Ready',
        repository: repo,
        workingChanges,
        refreshWorkingChanges,
      });
    };

    loadRepository();

    return () => {
      isMounted = false;
    };
  }, [path]);

  return state;
}
