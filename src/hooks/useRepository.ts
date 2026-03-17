import { useState, useEffect } from 'react';
import type { RepoEntry, WorkingChanges } from '../data/mockRepos.js';
import { Repository } from '../data/Repository.js';

export interface RepositoryState {
  repos: RepoEntry[];
  loading: boolean;
  error: string | null;
  phase: string;
  repository: Repository | null;
  workingChanges: WorkingChanges | null;
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
  });

  useEffect(() => {
    let isMounted = true;

    const loadRepository = async () => {
      try {
        // Phase 1: Open repository
        const repo = await Repository.open(path);
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading commits…' }));
        }

        // Phase 2: List commits
        const commits = await repo.listCommits(100);
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Indexing files…' }));
        }

        // Phase 3: Get changed files for each commit
        for (const commit of commits) {
          commit.changedFiles = await repo.getChangedFiles(commit.hash);
        }
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading refs…' }));
        }

        // Phase 4: Get all refs (branches, tags, HEAD) in a single call
        const refMap = await repo.getRefs();
        for (const commit of commits) {
          commit.refs = refMap.get(commit.hash) || [];
        }

        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading working changes…' }));
        }

        // Phase 5: Get working directory changes
        const workingChanges = await repo.getWorkingChanges();

        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading branch info…' }));
        }

        // Phase 6: Get branch information
        const headAuthor = commits.length > 0 ? commits[0].author : 'Unknown';
        const branchInfo = await repo.getBranchInfo(headAuthor);

        if (isMounted) {
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
          });
        }
      } catch (err) {
        let errorMessage = 'Unknown error loading repository';

        if (err instanceof Error) {
          errorMessage = err.message;
          // Include underlying cause if available
          if ('cause' in err && err.cause instanceof Error) {
            errorMessage += `\n(${(err.cause as Error).message})`;
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        if (isMounted) {
          setState((prev) => ({
            ...prev,
            repos: [],
            loading: false,
            error: errorMessage,
            repository: null,
          }));
        }
      }
    };

    loadRepository();

    return () => {
      isMounted = false;
    };
  }, [path]);

  return state;
}
