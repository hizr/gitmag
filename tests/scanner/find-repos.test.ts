import { describe, it, expect } from 'vitest';
import { findRepos } from '../../src/scanner/find-repos.js';

// Tests run from the gitmag repo root (cwd = /home/heizer/Documents/dev/gitmag)
// The repo's own .git dir is at depth 0 and should be found with depth >= 0.

describe('findRepos', () => {
  const cwd = process.cwd();

  it('finds the gitmag repo itself when scanning from cwd', async () => {
    const { repoPaths } = await findRepos(cwd, 1);
    expect(repoPaths).toContain(cwd);
  });

  it('calls onFound callback for each discovered repo', async () => {
    const found: string[] = [];
    await findRepos(cwd, 1, (_path, name) => found.push(name));
    expect(found).toContain('gitmag');
  });

  it('returns the repo path and totalDirsScanned', async () => {
    const result = await findRepos(cwd, 1);
    expect(result.repoPaths.length).toBeGreaterThan(0);
    expect(result.totalDirsScanned).toBeGreaterThan(0);
  });

  it('depth 0 still finds the root repo (.git is at the root)', async () => {
    // depth 0 means deep: 1 in fast-glob, which covers the .git at root level
    const { repoPaths } = await findRepos(cwd, 0);
    expect(repoPaths).toContain(cwd);
  });

  it('does not include nested repos as separate entries', async () => {
    const { repoPaths } = await findRepos(cwd, 3);
    for (let i = 0; i < repoPaths.length; i++) {
      for (let j = 0; j < repoPaths.length; j++) {
        if (i !== j) {
          expect(repoPaths[j]).not.toMatch(new RegExp(`^${repoPaths[i]}/`));
        }
      }
    }
  });

  it('does not find repos inside node_modules', async () => {
    const { repoPaths } = await findRepos(cwd, 3);
    for (const p of repoPaths) {
      expect(p).not.toContain('node_modules');
    }
  });
});
