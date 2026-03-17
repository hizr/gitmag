import { simpleGit } from 'simple-git';
import type { CommitEntry, ChangedFile } from './mockRepos.js';
import type { SimpleGit } from 'simple-git';

/**
 * Repository wraps simple-git to provide typed, dedicated functions for
 * retrieving commit and file data from a git repository.
 * Includes caching for improved performance with large repositories.
 */
export class Repository {
  private constructor(
    private git: SimpleGit,
    private basePath: string,
    private commitCache: Map<number, CommitEntry[]> = new Map()
  ) {}

  /**
   * Factory: open a repository at the given path.
   * Throws if the path is not a git repository.
   */
  static async open(path: string): Promise<Repository> {
    const git = simpleGit(path);
    // Check if it's a valid repo by trying to get the status
    try {
      await git.revparse(['--git-dir']);
      return new Repository(git, path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      let helpMessage = `Not a git repository: ${path}`;

      // Provide helpful suggestions based on common error patterns
      if (message.toLowerCase().includes('fatal')) {
        helpMessage +=
          '\n\nSuggestion: Run "git init" to initialize this directory as a git repository.';
      } else if (message.toLowerCase().includes('permission')) {
        helpMessage += '\n\nSuggestion: Check that you have read permissions for this directory.';
      } else if (
        message.toLowerCase().includes('enoent') ||
        message.toLowerCase().includes('no such')
      ) {
        helpMessage += `\n\nSuggestion: The directory "${path}" does not exist.`;
      }

      throw new Error(helpMessage, { cause: err });
    }
  }

  /**
   * Return the repository root path.
   */
  getPath(): string {
    return this.basePath;
  }

  /**
   * Fetch a list of commits with full metadata (hash, message, author, date, etc.).
   * Results are cached based on limit to improve performance.
   * @param limit Max number of commits to fetch (default: 100)
   */
  async listCommits(limit = 100): Promise<CommitEntry[]> {
    // Check cache first
    if (this.commitCache.has(limit)) {
      return this.commitCache.get(limit)!;
    }

    const log = await this.git.log({ maxCount: limit, symmetric: false });

    const commits = log.all.map((entry: unknown) => {
      const e = entry as {
        hash: string;
        message: string;
        date?: string;
        author_name?: string;
        body?: string;
        parents?: string;
      };
      return {
        hash: e.hash,
        message: e.message,
        date: e.date ? new Date(e.date).toISOString().split('T')[0] : 'unknown',
        author: e.author_name || 'Unknown',
        body: e.body || '',
        parentHash: e.parents ? e.parents.split(' ').filter(Boolean) : [],
        branchName: undefined, // simple-git log doesn't expose branch name easily; leave undefined
        changedFiles: [], // Populated separately via getChangedFiles
      };
    });

    // Cache the results
    this.commitCache.set(limit, commits);
    return commits;
  }

  /**
   * Fetch the list of changed files for a specific commit.
   * Returns file path + status (M/A/D/R) for each file in the commit.
   * @param hash Commit hash
   */
  async getChangedFiles(hash: string): Promise<ChangedFile[]> {
    try {
      // Use raw git diff-tree command to get file statuses
      const output = await this.git.raw([
        'diff-tree',
        '--no-commit-id',
        '-r',
        '--name-status',
        hash,
      ]);

      // Parse output: each line is "<status>\t<path>"
      return output
        .split('\n')
        .filter(Boolean)
        .map((line: string) => {
          const [status, ...pathParts] = line.split('\t');
          const path = pathParts.join('\t'); // Handle paths with tabs (rare)
          return {
            status: status as 'M' | 'A' | 'D' | 'R',
            path,
          };
        });
    } catch {
      // Commit may not exist or have no files; return empty
      return [];
    }
  }

  /**
   * Fetch the unified diff for a specific file in a commit.
   * @param hash Commit hash
   * @param filePath Path to the file
   */
  async getDiff(hash: string, filePath: string): Promise<string> {
    try {
      // Use git diff to get the diff of this file in the commit
      const actualDiff = await this.git.diff([`${hash}^..${hash}`, '--', filePath]);
      return actualDiff;
    } catch {
      // File doesn't exist in this commit or commit is invalid
      return '';
    }
  }

  /**
   * Get the primary branch name that contains the given commit.
   * First tries the current HEAD branch, then falls back to first local branch.
   * @param hash Commit hash
   */
  async getBranchName(hash: string): Promise<string | undefined> {
    try {
      // Try to get the current branch first (where HEAD points)
      const status = await this.git.status();
      const currentBranch = status.current;

      // Check if this commit is reachable from the current branch
      if (currentBranch) {
        try {
          await this.git.raw(['merge-base', '--is-ancestor', hash, 'HEAD']);
          return currentBranch;
        } catch {
          // Not in current branch, try others
        }
      }

      // Fall back to getting all branches containing this commit
      const branches = await this.git.raw(['branch', '--contains', hash]);
      const branchList = branches
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => b.replace(/^\*\s+/, '')); // Remove '* ' prefix if present

      return branchList[0]; // Return first branch found
    } catch {
      // Could not determine branch; return undefined
      return undefined;
    }
  }

  /**
   * Fetch all remotes and update local branches.
   * Returns a result object with ok flag and human-readable message.
   * Does not throw; always returns a result so callers can display feedback.
   * @returns Promise with ok flag and message for UI display
   */
  async fetchAll(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.git.fetch(['--all', '--prune']);
      return { ok: true, message: 'Remote data fetched successfully' };
    } catch (err) {
      // Capture error message for display
      const message = err instanceof Error ? err.message : String(err);

      // Categorize the error to provide helpful feedback
      if (message.toLowerCase().includes('no remote')) {
        return { ok: false, message: 'No remote configured — using local data only' };
      } else if (message.toLowerCase().includes('could not resolve')) {
        return { ok: false, message: 'Network error — using local data only' };
      } else if (message.toLowerCase().includes('authentication') || message.includes('401')) {
        return { ok: false, message: 'Authentication failed — using local data only' };
      }

      // Generic error fallback
      return {
        ok: false,
        message: `Fetch error — using local data only (${message.substring(0, 40)})`,
      };
    }
  }
}
