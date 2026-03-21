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
 *
 * Loading strategy:
 *   Phase 1 (sequential): open repo — required before anything else.
 *   Phase 2 (parallel):   listCommits → getChangedFiles[] run concurrently with
 *                         getRefs, getWorkingChanges, and getBranchInfo.
 *                         All four arms start at the same time.
 *
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
        // Phase 1: Open repository (required before all other calls)
        const repo = await Repository.open(path);
        if (isMounted) {
          setState((prev) => ({ ...prev, phase: 'Loading repository data…' }));
        }

        // Phase 2: Run all independent data fetches concurrently.
        //
        // Arm A: list commits, then fetch all changed-file lists in parallel
        //        (Promise.all over N diff-tree calls vs. the old sequential loop).
        // Arm B: fetch all refs in a single for-each-ref call.
        // Arm C: fetch working directory status in a single porcelain call.
        // Arm D: fetch branch / upstream / ahead-behind info.
        const [commits, refMap, workingChanges, branchInfo] = await Promise.all([
          // Arm A
          repo.listCommits(100).then(async (commits) => {
            const allChangedFiles = await Promise.all(
              commits.map((c) => repo.getChangedFiles(c.hash))
            );
            allChangedFiles.forEach((files, i) => {
              commits[i]!.changedFiles = files;
            });
            return commits;
          }),
          // Arm B
          repo.getRefs(),
          // Arm C
          repo.getWorkingChanges(),
          // Arm D
          repo.getBranchInfo(),
        ]);

        // Merge refs onto commits (requires both Arm A and Arm B to be done)
        commits.forEach((c) => {
          c.refs = refMap.get(c.hash) ?? [];
        });

        // Fill in the HEAD author from commits (getBranchInfo no longer takes it as a param)
        const headAuthor = commits.length > 0 ? commits[0]!.author : 'Unknown';
        const branchInfoWithAuthor = { ...branchInfo, headAuthor };

        if (isMounted) {
          setState({
            repos: [
              {
                path: repo.getPath(),
                commits,
                branchInfo: branchInfoWithAuthor,
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
