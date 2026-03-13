import { simpleGit } from 'simple-git';
import { basename } from 'node:path';
import type { Repository, Author, Commit, FileChange } from '../types/index.js';

/**
 * Fetches git activity for a single repository since the given date.
 * Returns a Repository object with commits grouped by author.
 */
export async function getRepoActivity(repoPath: string, since: Date): Promise<Repository> {
  const git = simpleGit(repoPath);
  const name = basename(repoPath);

  // Get log with stat info since the given date.
  // --max-count caps memory usage when a repo has an unusually large number of
  // recent commits (e.g. automated commits, monorepos with many contributors).
  const MAX_COMMITS_PER_REPO = 500;
  const log = await git.log([
    `--since=${since.toISOString()}`,
    `--max-count=${MAX_COMMITS_PER_REPO}`,
    '--format=%H%n%an%n%ae%n%aI%n%s%n---END---',
    '--diff-filter=ACDMRT', // skip unmerged/broken
  ]);

  if (!log.all.length) {
    return { path: repoPath, name, authors: [], totalCommits: 0 };
  }

  // Get diff stats for each commit
  const authorMap = new Map<string, Author>();

  for (const entry of log.all) {
    const hash = entry.hash;
    const authorName = entry.author_name;
    const authorEmail = entry.author_email;
    const date = entry.date;
    const message = entry.message;

    // Get file stats for this commit
    const files = await getCommitFiles(git, hash);

    const commit: Commit = { hash: hash.slice(0, 7), message, date, files };

    const authorKey = `${authorName}<${authorEmail}>`;
    if (!authorMap.has(authorKey)) {
      authorMap.set(authorKey, {
        name: authorName,
        email: authorEmail,
        commits: [],
        totalAdditions: 0,
        totalDeletions: 0,
      });
    }

    const author = authorMap.get(authorKey)!;
    author.commits.push(commit);
    for (const f of files) {
      author.totalAdditions += f.additions;
      author.totalDeletions += f.deletions;
    }
  }

  // Sort authors by commit count descending
  const authors = Array.from(authorMap.values()).sort(
    (a, b) => b.commits.length - a.commits.length
  );

  return {
    path: repoPath,
    name,
    authors,
    totalCommits: log.all.length,
  };
}

/**
 * Returns the list of files changed in a given commit with addition/deletion counts.
 */
async function getCommitFiles(
  git: ReturnType<typeof simpleGit>,
  hash: string
): Promise<FileChange[]> {
  try {
    const diffSummary = await git.diffSummary([`${hash}^`, hash, '--']);

    return diffSummary.files.map((f) => ({
      path: f.file,
      additions: 'insertions' in f ? (f.insertions ?? 0) : 0,
      deletions: 'deletions' in f ? (f.deletions ?? 0) : 0,
      binary: f.binary,
    }));
  } catch {
    // First commit has no parent — diff against empty tree
    try {
      const raw = await git.raw(['diff-tree', '--no-commit-id', '-r', '--numstat', hash]);
      return parseNumstat(raw);
    } catch {
      return [];
    }
  }
}

/**
 * Parses the output of `git diff-tree --numstat`
 */
function parseNumstat(raw: string): FileChange[] {
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t');
      if (parts.length < 3) return null;
      const [add, del, path] = parts;
      const binary = add === '-' || del === '-';
      return {
        path: path ?? '',
        additions: binary ? 0 : parseInt(add ?? '0', 10),
        deletions: binary ? 0 : parseInt(del ?? '0', 10),
        binary,
      };
    })
    .filter((f): f is FileChange => f !== null);
}

/**
 * Gets the raw unified diff for a specific file in a specific commit.
 */
export async function getFileDiff(
  repoPath: string,
  hash: string,
  filePath: string
): Promise<string> {
  const git = simpleGit(repoPath);
  try {
    return await git.diff([`${hash}^`, hash, '--', filePath]);
  } catch {
    // First commit
    return await git.raw(['show', `${hash}:${filePath}`]);
  }
}
