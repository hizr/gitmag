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
        refs: [], // Populated separately via getRefs
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
   * Fetch all refs (branches, tags, HEAD) and map them to commit hashes.
   * Returns a Map<commitHash, string[]> where each value is an array of ref labels.
   * Example: "a1b2c3d4e5f6..." → ["HEAD", "main", "origin/main"]
   *
   * This is a single call (no per-commit overhead) and replaces the expensive
   * per-commit getBranchName() loop.
   */
  async getRefs(): Promise<Map<string, string[]>> {
    const refMap = new Map<string, string[]>();

    try {
      // Get all refs: local branches, remote tracking branches, and tags
      // Use %(objectname) for full hash (not :short) to match git log hashes
      const refOutput = await this.git.raw([
        'for-each-ref',
        '--format=%(objectname) %(refname:short)',
        'refs/heads',
        'refs/remotes',
        'refs/tags',
      ]);

      // Parse: each line is "<fullHash> <refName>"
      refOutput
        .split('\n')
        .filter(Boolean)
        .forEach((line: string) => {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            const hash = parts[0];
            const refName = parts.slice(1).join(' '); // Handle ref names with spaces
            if (!refMap.has(hash)) {
              refMap.set(hash, []);
            }
            refMap.get(hash)!.push(refName);
          }
        });

      // Also add HEAD (points to current branch/commit)
      try {
        const headOutput = await this.git.raw(['rev-parse', 'HEAD']);
        const headHash = headOutput.trim();
        if (headHash && !refMap.has(headHash)) {
          refMap.set(headHash, ['HEAD']);
        } else if (headHash) {
          const refs = refMap.get(headHash)!;
          if (!refs.includes('HEAD')) {
            refs.unshift('HEAD'); // Put HEAD first
          }
        }
      } catch {
        // HEAD may not exist in initial commit scenarios; ignore
      }

      return refMap;
    } catch {
      // git for-each-ref failed; return empty map
      return new Map();
    }
  }
}
