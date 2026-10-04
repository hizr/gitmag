/* eslint-disable sonarjs/os-command -- test scaffolding: execSync with constructed path is intentional in integration tests */
/* eslint-disable security/detect-non-literal-fs-filename -- test scaffolding: fs operations on temp paths are intentional */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Repository } from '../../src/data/Repository.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * getBranchInfo() against a real upstream: a bare "origin" plus a second
 * clone that pushes a commit, so the local branch is both ahead and behind.
 */
describe('Repository.getBranchInfo() with an upstream (integration)', () => {
  let tempDir: string;
  let localPath: string;

  const git = (cwd: string, cmd: string) =>
    execSync(`git ${cmd}`, { cwd, stdio: 'pipe' }).toString().trim();

  const commitFile = (cwd: string, name: string, message: string) => {
    fs.writeFileSync(path.join(cwd, name), `${name}\n`);
    git(cwd, `add ${name}`);
    git(cwd, `commit -m "${message}"`);
  };

  const configureUser = (cwd: string) => {
    git(cwd, 'config user.email "test@example.com"');
    git(cwd, 'config user.name "Test User"');
  };

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitmag-upstream-'));
    const originPath = path.join(tempDir, 'origin.git');
    localPath = path.join(tempDir, 'local');
    const otherPath = path.join(tempDir, 'other');

    git(tempDir, `init --bare -b main "${originPath}"`);
    git(tempDir, `init -b main "${localPath}"`);
    configureUser(localPath);
    commitFile(localPath, 'base.txt', 'base');
    git(localPath, `remote add origin "${originPath}"`);
    git(localPath, 'push -u origin main');

    // Someone else pushes a commit → local is behind by 1
    git(tempDir, `clone "${originPath}" "${otherPath}"`);
    configureUser(otherPath);
    commitFile(otherPath, 'theirs.txt', 'theirs');
    git(otherPath, 'push origin main');
    git(localPath, 'fetch origin');

    // Two local commits → local is ahead by 2
    commitFile(localPath, 'mine1.txt', 'mine 1');
    commitFile(localPath, 'mine2.txt', 'mine 2');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports the tracking branch with ahead/behind counts', async () => {
    const repo = await Repository.open(localPath);
    const info = await repo.getBranchInfo('Test User');

    expect(info.currentBranch).toBe('main');
    expect(info.remoteBranch).toBe('origin/main');
    expect(info.ahead).toBe(2);
    expect(info.behind).toBe(1);
  });

  it('reports a detached HEAD by its short hash', async () => {
    const short = git(localPath, 'rev-parse --short HEAD~1');
    git(localPath, 'checkout --detach HEAD~1');
    try {
      const repo = await Repository.open(localPath);
      const info = await repo.getBranchInfo('Test User');
      expect(info.currentBranch).toBe(`(detached HEAD: ${short})`);
      expect(info.remoteBranch).toBeNull();
    } finally {
      git(localPath, 'checkout main');
    }
  });
});
