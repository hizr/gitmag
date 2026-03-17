import { useState, useEffect } from 'react';
import type { RepoEntry } from '../data/mockRepos.js';
import { Repository } from '../data/Repository.js';

export interface RepositoryState {
  repos: RepoEntry[];
  loading: boolean;
  error: string | null;
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
  });

  useEffect(() => {
    let isMounted = true;

    const loadRepository = async () => {
      try {
        const repo = await Repository.open(path);
        const commits = await repo.listCommits(100);

        // Populate changedFiles and branchName for each commit
        for (const commit of commits) {
          commit.changedFiles = await repo.getChangedFiles(commit.hash);
          commit.branchName = await repo.getBranchName(commit.hash);
        }

        if (isMounted) {
          setState({
            repos: [
              {
                path: repo.getPath(),
                commits,
              },
            ],
            loading: false,
            error: null,
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
          setState({
            repos: [],
            loading: false,
            error: errorMessage,
          });
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
