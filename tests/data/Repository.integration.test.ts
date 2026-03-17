import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Repository } from '../../src/data/Repository.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Integration tests for Repository class using real git repositories.
 * These tests create temporary git repos to verify live git operations.
 */
describe('Repository Integration Tests', () => {
  let tempDir: string;
  let repoPath: string;

  beforeAll(() => {
    // Create a temporary directory for the test repo
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitmag-int-'));
    repoPath = path.join(tempDir, 'test-repo');
    fs.mkdirSync(repoPath);

    // Initialize git repo
    execSync('git init', { cwd: repoPath, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: repoPath, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: repoPath, stdio: 'pipe' });

    // Create initial commit
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Test Repo\n');
    execSync('git add README.md', { cwd: repoPath, stdio: 'pipe' });
    execSync('git commit -m "initial: add README"', { cwd: repoPath, stdio: 'pipe' });

    // Create second commit with file modification
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Test Repo\nDescription here\n');
    execSync('git add README.md', { cwd: repoPath, stdio: 'pipe' });
    execSync('git commit -m "docs: add description"', { cwd: repoPath, stdio: 'pipe' });

    // Create new file in third commit
    fs.writeFileSync(
      path.join(repoPath, 'lib.ts'),
      'export function add(a: number, b: number) {\n  return a + b;\n}\n'
    );
    execSync('git add lib.ts', { cwd: repoPath, stdio: 'pipe' });
    execSync('git commit -m "feat: add math utilities"', { cwd: repoPath, stdio: 'pipe' });

    // Create fourth commit that deletes lib.ts
    execSync('git rm lib.ts', { cwd: repoPath, stdio: 'pipe' });
    execSync('git commit -m "refactor: remove math utilities"', { cwd: repoPath, stdio: 'pipe' });

    // Create a branch for refs testing
    execSync('git checkout -b develop', { cwd: repoPath, stdio: 'pipe' });

    // Create a tag on the current commit
    execSync('git tag v1.0.0', { cwd: repoPath, stdio: 'pipe' });

    // Switch back to main/master
    execSync('git checkout -', { cwd: repoPath, stdio: 'pipe' });
  });

  afterAll(() => {
    // Cleanup: remove temporary directory
    execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' });
  });

  it('opens a real git repository', async () => {
    const repo = await Repository.open(repoPath);
    expect(repo).toBeDefined();
    expect(repo.getPath()).toBe(repoPath);
  });

  it('lists commits from a real repository', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    expect(commits).toHaveLength(4);
    expect(commits[0].message).toContain('refactor: remove math utilities');
    expect(commits[1].message).toContain('feat: add math utilities');
    expect(commits[2].message).toContain('docs: add description');
    expect(commits[3].message).toContain('initial: add README');
  });

  it('returns commit metadata correctly', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);
    const commit = commits[0];

    expect(commit.hash).toMatch(/^[a-f0-9]{40}$/);
    expect(commit.author).toBe('Test User');
    expect(commit.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(commit.body).toBeDefined();
  });

  it('gets changed files for a commit', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    // Commit that added lib.ts
    const addCommit = commits[1];
    const files = await repo.getChangedFiles(addCommit.hash);

    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.path.includes('lib.ts'))).toBe(true);
  });

  it('handles file statuses correctly (A/M/D)', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    // Commit that deleted lib.ts (the latest one = commits[0])
    const deleteCommit = commits[0];
    const files = await repo.getChangedFiles(deleteCommit.hash);

    expect(files.some((f) => f.path === 'lib.ts' && f.status === 'D')).toBe(true);
  });

  it('retrieves diff for a modified file', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    // Commit that modified README.md
    const modifyCommit = commits[2];
    const diff = await repo.getDiff(modifyCommit.hash, 'README.md');

    expect(diff).toBeTruthy();
    expect(diff).toContain('@@');
    expect(diff).toMatch(/[+-]/);
  });

  it('retrieves diff for an added file', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    // Commit that added lib.ts
    const addCommit = commits[1];
    const diff = await repo.getDiff(addCommit.hash, 'lib.ts');

    expect(diff).toBeTruthy();
    expect(diff).toContain('+');
  });

  it('handles diff for deleted file', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);

    // The commit that deleted lib.ts is the first (latest) commit
    const deleteCommit = commits[0];
    expect(deleteCommit.message).toContain('refactor: remove math utilities');

    const diff = await repo.getDiff(deleteCommit.hash, 'lib.ts');

    // When a file is deleted in a commit, git diff shows it with leading '-' on content lines
    // The diff should be non-empty since the file existed in the parent
    expect(diff.length).toBeGreaterThan(0);
  });

  it('returns empty string for non-existent file in commit', async () => {
    const repo = await Repository.open(repoPath);
    const commits = await repo.listCommits(10);
    const commit = commits[3]; // Initial commit, only has README.md

    const diff = await repo.getDiff(commit.hash, 'non-existent.txt');

    expect(diff).toBe('');
  });

  it('retrieves all refs (branches, tags, HEAD)', async () => {
    const repo = await Repository.open(repoPath);
    const refMap = await repo.getRefs();

    expect(refMap).toBeInstanceOf(Map);
    expect(refMap.size).toBeGreaterThan(0);

    // Should have HEAD ref
    let foundHead = false;
    for (const refs of refMap.values()) {
      if (refs.includes('HEAD')) {
        foundHead = true;
        break;
      }
    }
    expect(foundHead).toBe(true);

    // Should have refs with branch or tag names
    let foundBranchOrTag = false;
    for (const refs of refMap.values()) {
      for (const ref of refs) {
        if (ref !== 'HEAD' && (ref.includes('/') || /^v?\d+/.test(ref))) {
          foundBranchOrTag = true;
          break;
        }
      }
    }
    expect(foundBranchOrTag).toBe(true);
  });

  it('caches commit list results', async () => {
    const repo = await Repository.open(repoPath);

    // First call - fetches from git
    const commits1 = await repo.listCommits(5);
    expect(commits1).toHaveLength(4); // Only 4 commits exist

    // Second call - should return cached result
    const commits2 = await repo.listCommits(5);
    expect(commits2).toEqual(commits1);
  });

  it('returns different cache entries for different limits', async () => {
    const repo = await Repository.open(repoPath);

    const commits5 = await repo.listCommits(5);
    const commits10 = await repo.listCommits(10);

    // Both should have same content since repo only has 4 commits
    expect(commits5).toEqual(commits10);
  });

  it('throws on non-existent directory', async () => {
    const nonExistent = path.join(tempDir, 'does-not-exist');

    await expect(Repository.open(nonExistent)).rejects.toThrow();
  });

  it('throws on non-git directory', async () => {
    const nonGitDir = path.join(tempDir, 'not-a-repo');
    fs.mkdirSync(nonGitDir);

    await expect(Repository.open(nonGitDir)).rejects.toThrow('Not a git repository');
  });
});
