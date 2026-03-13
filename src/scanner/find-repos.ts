import fg from 'fast-glob';
import { resolve, dirname, basename } from 'node:path';

export interface FindReposResult {
  repoPaths: string[];
  totalDirsScanned: number;
}

/**
 * Finds all git repositories under the given root directory up to the
 * specified depth. Skips node_modules and nested repos (a .git inside
 * another repo's working tree).
 */
export async function findRepos(
  rootDir: string,
  depth: number,
  onFound?: (repoPath: string, repoName: string) => void
): Promise<FindReposResult> {
  const absoluteRoot = resolve(rootDir);

  // fast-glob deep counts the number of path segments (directories) to traverse.
  // We want to find .git at any depth from 0 up to `depth`.
  // depth + 1 accounts for the .git segment itself.
  const gitDirs = await fg('**/.git', {
    cwd: absoluteRoot,
    onlyDirectories: true,
    deep: depth + 1,
    dot: true,
    followSymbolicLinks: false,
    ignore: ['**/node_modules'],
  });

  // Deduplicate: filter out nested repos (repo A contains repo B).
  // Sort by path depth so parents come first.
  const sorted = gitDirs
    .map((g) => resolve(absoluteRoot, dirname(g)))
    .sort((a, b) => a.split('/').length - b.split('/').length);

  const repoPaths: string[] = [];
  for (const repoPath of sorted) {
    const isNested = repoPaths.some((accepted) => repoPath.startsWith(accepted + '/'));
    if (!isNested) {
      repoPaths.push(repoPath);
      onFound?.(repoPath, basename(repoPath));
    }
  }

  return { repoPaths, totalDirsScanned: gitDirs.length };
}
