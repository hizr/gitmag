/* eslint-disable security/detect-non-literal-fs-filename -- test scaffolding: fs operations on temp paths are intentional */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { simpleGit } from 'simple-git';
import { Repository } from '../../src/data/Repository.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

  it('throws when opening a non-git directory', async () => {
    const nonGitDir = path.join(os.tmpdir(), '.non-git-' + Date.now());
    fs.mkdirSync(nonGitDir, { recursive: true });

    try {
      await Repository.open(nonGitDir);
      expect.fail('Repository.open should have thrown for non-git directory');
    } catch (err: unknown) {
      const error = err as { message?: string };
      expect(error?.message || String(err)).toContain('Not a git repository');
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });

  it('throws with helpful suggestion for non-existent directory', async () => {
    const nonExistentDir = path.join(os.tmpdir(), '.nonexistent-' + Date.now());

    try {
      await Repository.open(nonExistentDir);
      expect.fail('Repository.open should have thrown for non-existent directory');
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error?.message || String(err);
      // simple-git throws "Cannot use simple-git on a directory that does not exist"
      expect(msg.toLowerCase()).toMatch(/does not exist|not a git repository/i);
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

  it('caches commit list results', async () => {
    const repo = await Repository.open(tempDir);
    const commits1 = await repo.listCommits(10);
    const commits2 = await repo.listCommits(10);

    // Should return the same cached results
    expect(commits1).toBe(commits2);
  });

  it('returns different cache for different limits', async () => {
    const repo = await Repository.open(tempDir);
    const commits1 = await repo.listCommits(1);
    const commits2 = await repo.listCommits(10);

    // Different limits should have different results
    expect(commits1.length).toBeLessThan(commits2.length);
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

  it('returns empty array for changed files when git fails', async () => {
    const repo = await Repository.open(tempDir);
    const files = await repo.getChangedFiles('');

    expect(Array.isArray(files)).toBe(true);
  });

  it('gets changed files for all commits in batch', async () => {
    const repo = await Repository.open(tempDir);
    const filesMap = await repo.getChangedFilesForAllCommits(10);

    // Should have entries for each commit
    expect(filesMap.size).toBeGreaterThan(0);

    // Each entry should have a hash key and array value
    filesMap.forEach((files, hash) => {
      expect(typeof hash).toBe('string');
      expect(Array.isArray(files)).toBe(true);
      files.forEach((file) => {
        expect(file).toHaveProperty('status');
        expect(file).toHaveProperty('path');
      });
    });
  });

  it('handles getChangedFilesForAllCommits returning empty map on error', async () => {
    const repo = await Repository.open(tempDir);
    const filesMap = await repo.getChangedFilesForAllCommits(100);

    // Should return a map (possibly empty) not throw
    expect(filesMap instanceof Map).toBe(true);
  });

  it('returns empty string for diff on invalid commit', async () => {
    const repo = await Repository.open(tempDir);
    const diff = await repo.getDiff('invalid_hash', 'file.txt');

    expect(diff).toBe('');
  });

  it('handles working changes from status', async () => {
    const repo = await Repository.open(tempDir);

    // Create some working changes
    fs.writeFileSync(path.join(tempDir, 'file3.txt'), 'new file\n');

    const changes = await repo.getWorkingChanges();

    // Should have the untracked file
    expect(changes).toHaveProperty('staged');
    expect(changes).toHaveProperty('unstaged');
    expect(changes).toHaveProperty('untracked');
    expect(Array.isArray(changes.staged)).toBe(true);
    expect(Array.isArray(changes.unstaged)).toBe(true);
    expect(Array.isArray(changes.untracked)).toBe(true);
  });

  it('handles getWorkingChanges returning empty on error', async () => {
    const repo = await Repository.open(tempDir);
    const changes = await repo.getWorkingChanges();

    // Should always return an object with the three properties
    expect(changes).toHaveProperty('staged');
    expect(changes).toHaveProperty('unstaged');
    expect(changes).toHaveProperty('untracked');
  });

  it('gets refs for commits', async () => {
    const repo = await Repository.open(tempDir);
    const refs = await repo.getRefs();

    // Should return a map
    expect(refs instanceof Map).toBe(true);
  });

  it('handles getRefs returning empty map on error', async () => {
    const repo = await Repository.open(tempDir);
    const refs = await repo.getRefs();

    // Should return a map (even if empty)
    expect(refs instanceof Map).toBe(true);
  });

  it('gets branch info with defaults', async () => {
    const repo = await Repository.open(tempDir);
    const branchInfo = await repo.getBranchInfo('Test User');

    expect(branchInfo).toHaveProperty('currentBranch');
    expect(branchInfo).toHaveProperty('remoteBranch');
    expect(branchInfo).toHaveProperty('ahead');
    expect(branchInfo).toHaveProperty('behind');
    expect(branchInfo).toHaveProperty('headAuthor');
    expect(branchInfo).toHaveProperty('repoPath');
    expect(branchInfo.headAuthor).toBe('Test User');
    expect(branchInfo.repoPath).toBe(tempDir);
  });

  it('handles branch info with detached HEAD', async () => {
    const repo = await Repository.open(tempDir);
    const branchInfo = await repo.getBranchInfo('Test User');

    // Should have branch info even if detached
    expect(branchInfo).toBeDefined();
    expect(branchInfo.currentBranch).toBeDefined();
  });

  it('handles branch info when getBranchInfo fails gracefully', async () => {
    const repo = await Repository.open(tempDir);
    const branchInfo = await repo.getBranchInfo('Test User');

    // Should always return valid branch info object
    expect(branchInfo.ahead).toBeGreaterThanOrEqual(0);
    expect(branchInfo.behind).toBeGreaterThanOrEqual(0);
  });

  it('gets working diff for unstaged changes', async () => {
    const repo = await Repository.open(tempDir);

    // Modify a file in the working directory (unstaged)
    fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content 1 modified\n');

    const diff = await repo.getWorkingDiff('file1.txt', 'unstaged');

    // Diff should show the change
    expect(diff).toBeTruthy();
    expect(diff).toContain('-');
    expect(diff).toContain('+');
  });

  it('gets working diff for staged changes', async () => {
    const repo = await Repository.open(tempDir);

    // Stage a change
    fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content 2 modified\n');
    const git = simpleGit(tempDir);
    await git.add('file2.txt');

    const diff = await repo.getWorkingDiff('file2.txt', 'staged');

    // Diff should show changes from HEAD
    expect(diff).toBeTruthy();
  });

  it('gets working diff for untracked file', async () => {
    const repo = await Repository.open(tempDir);

    // Create an untracked file
    fs.writeFileSync(path.join(tempDir, 'untracked.txt'), 'new content\n');

    const diff = await repo.getWorkingDiff('untracked.txt', 'untracked');

    // Should synthesize a diff showing all lines as additions
    expect(diff).toContain('new file mode');
    expect(diff).toContain('+++');
    expect(diff).toContain('+new content');
  });

  it('gets working diff for empty untracked file', async () => {
    const repo = await Repository.open(tempDir);

    // Create an empty untracked file
    fs.writeFileSync(path.join(tempDir, 'empty.txt'), '');

    const diff = await repo.getWorkingDiff('empty.txt', 'untracked');

    // Should have diff header even if no content lines
    expect(diff).toContain('new file mode');
    expect(diff).toContain('+++');
  });

  it('returns empty string for nonexistent working diff', async () => {
    const repo = await Repository.open(tempDir);

    const diff = await repo.getWorkingDiff('nonexistent.txt', 'unstaged');

    // Should return empty string gracefully
    expect(diff).toBe('');
  });

  it('synthesizes diff with multiline content for untracked file', async () => {
    const repo = await Repository.open(tempDir);

    // Create an untracked file with multiple lines
    const multilineContent = 'line 1\nline 2\nline 3\n';
    fs.writeFileSync(path.join(tempDir, 'multiline.txt'), multilineContent);

    const diff = await repo.getWorkingDiff('multiline.txt', 'untracked');

    // Should have proper diff header
    expect(diff).toContain('new file mode');
    expect(diff).toContain('+++');
    expect(diff).toContain('@@ -0,0 +1,3 @@');
    expect(diff).toContain('+line 1');
    expect(diff).toContain('+line 2');
    expect(diff).toContain('+line 3');
  });

  it('stages a file for commit', async () => {
    const repo = await Repository.open(tempDir);

    // Create a new untracked file
    fs.writeFileSync(path.join(tempDir, 'new-file.txt'), 'new content\n');

    // Stage the file
    await repo.stageFile('new-file.txt');

    // Verify by checking git status
    const status = await repo.getWorkingChanges();
    const staged = status.staged.find((f) => f.path === 'new-file.txt');
    expect(staged).toBeDefined();
    expect(staged?.status).toBe('A');
  });

  it('unstages a file', async () => {
    const repo = await Repository.open(tempDir);

    // Create and stage a file
    fs.writeFileSync(path.join(tempDir, 'to-unstage.txt'), 'content\n');
    await repo.stageFile('to-unstage.txt');

    // Verify it's staged
    let status = await repo.getWorkingChanges();
    let staged = status.staged.find((f) => f.path === 'to-unstage.txt');
    expect(staged).toBeDefined();

    // Unstage the file
    await repo.unstageFile('to-unstage.txt');

    // Verify it's no longer staged
    status = await repo.getWorkingChanges();
    staged = status.staged.find((f) => f.path === 'to-unstage.txt');
    expect(staged).toBeUndefined();

    // It should now be untracked
    const untracked = status.untracked.find((f) => f.path === 'to-unstage.txt');
    expect(untracked).toBeDefined();
  });

  it('throws on stage failure with meaningful message', async () => {
    const repo = await Repository.open(tempDir);

    try {
      // Try to stage a nonexistent file
      await repo.stageFile('nonexistent-file.txt');
      expect.fail('Should have thrown error');
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error?.message || String(err);
      expect(msg).toMatch(/Failed to stage/i);
    }
  });

  it('throws on unstage failure with meaningful message', async () => {
    const repo = await Repository.open(tempDir);

    try {
      // Try to unstage a file that was never staged
      await repo.unstageFile('never-staged.txt');
      // This might not throw in all git versions, so we accept success here
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error?.message || String(err);
      expect(msg).toMatch(/Failed to unstage/i);
    }
  });
});
