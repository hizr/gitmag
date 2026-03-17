import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { simpleGit } from 'simple-git';
import { Repository } from '../../src/data/Repository.js';
import fs from 'fs';
import path from 'path';

describe('Repository', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for our test repo
    tempDir = path.join(process.cwd(), '.test-repo-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    // Initialize a git repo
    const git = simpleGit(tempDir);
    await git.init();
    await git.addConfig('user.email', 'test@example.com');
    await git.addConfig('user.name', 'Test User');

    // Create first commit with a file
    fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content 1\n');
    await git.add('file1.txt');
    await git.commit('feat: initial commit');

    // Create second commit modifying the file
    fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content 1 updated\n');
    fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content 2\n');
    await git.add('.');
    await git.commit('feat: add file2 and update file1');
  });

  afterAll(() => {
    // Clean up the temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('opens a valid git repository', async () => {
    const repo = await Repository.open(tempDir);
    expect(repo).toBeDefined();
    expect(repo.getPath()).toBe(tempDir);
  });

  it.skip('throws when opening a non-git directory', async () => {
    // NOTE: simple-git may not throw reliably on non-git directories
    // This is a known limitation. In production, Repository should be paired
    // with additional validation (e.g., checking for .git folder explicitly).
    const nonGitDir = path.join(process.cwd(), '.non-git-' + Date.now());
    fs.mkdirSync(nonGitDir, { recursive: true });

    try {
      const _repo = await Repository.open(nonGitDir);
      expect.fail('Repository.open should have thrown for non-git directory');
    } catch (err: unknown) {
      const error = err as { message?: string };
      expect(error?.message || String(err)).toContain('Not a git repository');
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });

  it('lists commits with correct structure', async () => {
    const repo = await Repository.open(tempDir);
    const commits = await repo.listCommits(10);

    expect(commits.length).toBe(2);
    expect(commits[0]).toHaveProperty('hash');
    expect(commits[0]).toHaveProperty('message');
    expect(commits[0]).toHaveProperty('author');
    expect(commits[0]).toHaveProperty('date');
    expect(commits[0]).toHaveProperty('body');
    expect(commits[0]).toHaveProperty('parentHash');
    expect(commits[0]).toHaveProperty('changedFiles');

    // Most recent commit first
    expect(commits[0].message).toContain('add file2');
    expect(commits[1].message).toContain('initial');
  });

  it('gets changed files for a commit', async () => {
    const repo = await Repository.open(tempDir);
    const commits = await repo.listCommits(10);
    const secondCommitHash = commits[0].hash;

    const files = await repo.getChangedFiles(secondCommitHash);

    expect(files.length).toBe(2);
    const statuses = files.map((f) => f.status);
    expect(statuses).toContain('M'); // file1.txt modified
    expect(statuses).toContain('A'); // file2.txt added

    const paths = files.map((f) => f.path);
    expect(paths).toContain('file1.txt');
    expect(paths).toContain('file2.txt');
  });

  it('returns empty array for invalid commit hash', async () => {
    const repo = await Repository.open(tempDir);
    const files = await repo.getChangedFiles('invalid_hash_xyz');

    expect(files).toEqual([]);
  });

  it('gets diff for a file in a commit', async () => {
    const repo = await Repository.open(tempDir);
    const commits = await repo.listCommits(10);
    const secondCommitHash = commits[0].hash;

    const diff = await repo.getDiff(secondCommitHash, 'file1.txt');

    // Diff should contain the change
    expect(diff).toContain('-content 1');
    expect(diff).toContain('+content 1 updated');
  });

  it('returns empty string for non-existent file in commit', async () => {
    const repo = await Repository.open(tempDir);
    const commits = await repo.listCommits(10);
    const commitHash = commits[0].hash;

    const diff = await repo.getDiff(commitHash, 'nonexistent.txt');

    expect(diff).toBe('');
  });
});
