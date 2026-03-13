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

  // fast-glob deep counts the number of path segments to traverse.
  // With depth=3, we find .git up to a/b/c/.git (repo root 3 levels below cwd).
  // depth=0 would find only cwd/.git (repo at cwd level), depth=3 finds up to 3 levels deep.
  const gitDirs = await fg('**/.git', {
    cwd: absoluteRoot,
    onlyDirectories: true,
    deep: depth,
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
