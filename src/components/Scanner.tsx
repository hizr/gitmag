import { useEffect, useState } from 'react';
import type { RepoEntry } from '../data/mockRepos.js';
import { Repository } from '../data/Repository.js';

export interface ScanProgress {
  phase: string;
  done: boolean;
  error?: string;
}

export interface StartupState extends ScanProgress {
  repos: RepoEntry[];
  repoError: string | null;
}

/**
 * Hook to initialize the app: fetch from remote, load commits, index files, and resolve branches.
 * Returns real progress events as each stage completes.
 * Errors are non-fatal; the app continues with local data even if fetch fails.
 * @param repoPath Path to the git repository (e.g., process.cwd())
 */
export function useStartup(repoPath: string): StartupState {
  const [state, setState] = useState<StartupState>({
    phase: 'Connecting to remote…',
    done: false,
    repos: [],
    repoError: null,
  });

  useEffect(() => {
    let isMounted = true;

    const startup = async () => {
      try {
        // Step 1: Open repository
        const repo = await Repository.open(repoPath);

        // Step 2: Fetch from remote (non-blocking on failure)
        const fetchResult = await repo.fetchAll();
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            phase: fetchResult.ok ? 'Remote data synced' : fetchResult.message,
            error: fetchResult.ok ? undefined : fetchResult.message,
          }));
        }

        // Step 3: Load commits
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading commits…' }));
        }
        const commits = await repo.listCommits(100);

        // Step 4: Index changed files for each commit
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Indexing files…' }));
        }
        for (const commit of commits) {
          commit.changedFiles = await repo.getChangedFiles(commit.hash);
        }

        // Step 5: Resolve branch names for each commit
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Resolving branches…' }));
        }
        for (const commit of commits) {
          commit.branchName = await repo.getBranchName(commit.hash);
        }

        // Step 6: Mark complete
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            phase: 'Ready',
            done: true,
            repos: [{ path: repo.getPath(), commits }],
            repoError: null,
          }));
        }
      } catch (err) {
        let errorMessage = 'Unknown error initializing repository';

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
            phase: 'Error',
            done: true,
            repoError: errorMessage,
          }));
        }
      }
    };

    startup();

    return () => {
      isMounted = false;
    };
  }, [repoPath]);

  return state;
}
