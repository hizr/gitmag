import { simpleGit } from 'simple-git';
import type { CommitEntry, ChangedFile } from './mockRepos.js';
import type { SimpleGit } from 'simple-git';

/**
 * Repository wraps simple-git to provide typed, dedicated functions for
 * retrieving commit and file data from a git repository.
 */
export class Repository {
  private constructor(
    private git: SimpleGit,
    private basePath: string
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
      throw new Error(`Not a git repository: ${path}`, { cause: err });
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
   * @param limit Max number of commits to fetch (default: 100)
   */
  async listCommits(limit = 100): Promise<CommitEntry[]> {
    const log = await this.git.log({ maxCount: limit, symmetric: false });

    return log.all.map((entry: unknown) => {
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
}
