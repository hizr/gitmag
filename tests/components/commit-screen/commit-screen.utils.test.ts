import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleClipboardSuccess,
  handleClipboardError,
  handleModuleError,
  buildFileLines,
  buildInfoLines,
  FILE_STATUS_COLOR,
} from '../../../src/components/commit-screen/commit-screen.utils.js';
import type { CommitEntry, ChangedFile, WorkingChanges } from '../../../src/data/mockRepos.js';

describe('commit-screen.utils', () => {
  // ── handleClipboardSuccess ────────────────────────────────────────────────

  describe('handleClipboardSuccess', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls setCopyStatus with success message', () => {
      const setCopyStatus = vi.fn();
      handleClipboardSuccess('abc123', setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledWith('Copied abc123 to clipboard');
    });

    it('includes the full hash in the success message', () => {
      const setCopyStatus = vi.fn();
      const hash = 'abc123def456ghi789';
      handleClipboardSuccess(hash, setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledWith(`Copied ${hash} to clipboard`);
    });

    it('clears status after 1500ms', () => {
      const setCopyStatus = vi.fn();
      handleClipboardSuccess('abc123', setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1500);
      expect(setCopyStatus).toHaveBeenCalledTimes(2);
      expect(setCopyStatus).toHaveBeenLastCalledWith(null);
    });

    it('does not clear status before 1500ms', () => {
      const setCopyStatus = vi.fn();
      handleClipboardSuccess('abc123', setCopyStatus);
      vi.advanceTimersByTime(1000);
      expect(setCopyStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ── handleClipboardError ──────────────────────────────────────────────────

  describe('handleClipboardError', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls setCopyStatus with error message', () => {
      const setCopyStatus = vi.fn();
      handleClipboardError(setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledWith('Clipboard unavailable — install wl-clipboard');
    });

    it('clears status after 1500ms', () => {
      const setCopyStatus = vi.fn();
      handleClipboardError(setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1500);
      expect(setCopyStatus).toHaveBeenCalledTimes(2);
      expect(setCopyStatus).toHaveBeenLastCalledWith(null);
    });
  });

  // ── handleModuleError ─────────────────────────────────────────────────────

  describe('handleModuleError', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls setCopyStatus with module error message', () => {
      const setCopyStatus = vi.fn();
      handleModuleError(setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledWith('Clipboard module unavailable');
    });

    it('clears status after 1500ms', () => {
      const setCopyStatus = vi.fn();
      handleModuleError(setCopyStatus);
      expect(setCopyStatus).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1500);
      expect(setCopyStatus).toHaveBeenCalledTimes(2);
      expect(setCopyStatus).toHaveBeenLastCalledWith(null);
    });
  });

  // ── buildFileLines ────────────────────────────────────────────────────────

  describe('buildFileLines', () => {
    it('returns array of file lines for regular commits', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'M', path: 'src/main.ts' },
          { status: 'A', path: 'src/feature.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);
      expect(fileLines).toHaveLength(2);
      expect(fileLines[0]).toEqual({ status: 'M', path: 'src/main.ts' });
      expect(fileLines[1]).toEqual({ status: 'A', path: 'src/feature.ts' });
    });

    it('maps changed files directly for regular commits', () => {
      const changedFiles: ChangedFile[] = [
        { status: 'M', path: 'file1.ts' },
        { status: 'D', path: 'file2.ts' },
        { status: 'A', path: 'file3.ts' },
      ];
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles,
      };
      const fileLines = buildFileLines(commit);
      expect(fileLines).toHaveLength(3);
      expect(fileLines).toEqual([
        { status: 'M', path: 'file1.ts' },
        { status: 'D', path: 'file2.ts' },
        { status: 'A', path: 'file3.ts' },
      ]);
    });

    it('returns empty array when no changed files', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const fileLines = buildFileLines(commit);
      expect(fileLines).toHaveLength(0);
    });

    // ── Working commit handling ───────────────────────────────────────────

    it('groups working changes by status (staged, unstaged, untracked)', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new-staged.ts' },
          { status: 'M', path: 'modified-unstaged.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);

      // Should have headers + files
      expect(fileLines.length).toBeGreaterThan(0);

      // Check for staged section
      const stagedHeader = fileLines.find((f) => f.isHeader && f.status === '📦');
      expect(stagedHeader).toBeDefined();

      // Check for unstaged section
      const unstagedHeader = fileLines.find((f) => f.isHeader && f.status === '✎');
      expect(unstagedHeader).toBeDefined();

      // Check for untracked section
      const untrackedHeader = fileLines.find((f) => f.isHeader && f.status === '?');
      expect(untrackedHeader).toBeDefined();
    });

    it('includes staged files header when staged files exist', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'existing.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);
      const stagedHeader = fileLines.find((f) => f.isHeader && f.path === 'Staged');
      expect(stagedHeader).toBeDefined();
      expect(stagedHeader?.status).toBe('📦');
    });

    it('includes unstaged files header when unstaged files exist', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'M', path: 'modified.ts' },
          { status: 'D', path: 'deleted.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);
      const unstagedHeader = fileLines.find((f) => f.isHeader && f.path === 'Unstaged');
      expect(unstagedHeader).toBeDefined();
      expect(unstagedHeader?.status).toBe('✎');
    });

    it('includes untracked files header when untracked files exist', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [{ status: '??', path: 'new-untracked.ts' }],
      };
      const fileLines = buildFileLines(commit);
      const untrackedHeader = fileLines.find((f) => f.isHeader && f.path === 'Untracked');
      expect(untrackedHeader).toBeDefined();
      expect(untrackedHeader?.status).toBe('?');
    });

    it('excludes section headers when no files in that section', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [{ status: 'M', path: 'modified.ts' }],
      };
      const fileLines = buildFileLines(commit);
      const stagedHeader = fileLines.find((f) => f.isHeader && f.status === '📦');
      const untrackedHeader = fileLines.find((f) => f.isHeader && f.status === '?');

      expect(stagedHeader).toBeUndefined();
      expect(untrackedHeader).toBeUndefined();
    });

    it('sets stagingState for working commit files', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new-staged.ts' },
          { status: 'M', path: 'modified-unstaged.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);

      // Find non-header files and check stagingState
      const stagedFile = fileLines.find((f) => f.path === 'new-staged.ts' && !f.isHeader);
      expect(stagedFile?.stagingState).toBe('staged');

      const unstagedFile = fileLines.find((f) => f.path === 'modified-unstaged.ts' && !f.isHeader);
      expect(unstagedFile?.stagingState).toBe('unstaged');

      const untrackedFile = fileLines.find((f) => f.path === 'untracked.ts' && !f.isHeader);
      expect(untrackedFile?.stagingState).toBe('untracked');
    });

    it('does not set stagingState for regular commit files', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'M', path: 'file1.ts' },
          { status: 'A', path: 'file2.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);

      expect(fileLines[0].stagingState).toBeUndefined();
      expect(fileLines[1].stagingState).toBeUndefined();
    });

    it('does not set stagingState for header rows in working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
        ],
      };
      const fileLines = buildFileLines(commit);

      const stagedHeader = fileLines.find((f) => f.isHeader && f.path === 'Staged');
      expect(stagedHeader?.stagingState).toBeUndefined();

      const unstagedHeader = fileLines.find((f) => f.isHeader && f.path === 'Unstaged');
      expect(unstagedHeader?.stagingState).toBeUndefined();
    });

    it('uses WorkingChanges for segregating __WORKING__ commit files', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const workingChanges: WorkingChanges = {
        staged: [{ status: 'A', path: 'new.ts' }],
        unstaged: [{ status: 'M', path: 'modified.ts' }],
        untracked: [{ status: '??', path: 'untracked.ts' }],
      };
      const fileLines = buildFileLines(commit, workingChanges);

      // Verify it uses WorkingChanges for grouping
      const stagedFile = fileLines.find((f) => f.path === 'new.ts' && !f.isHeader);
      expect(stagedFile?.stagingState).toBe('staged');

      const unstagedFile = fileLines.find((f) => f.path === 'modified.ts' && !f.isHeader);
      expect(unstagedFile?.stagingState).toBe('unstaged');

      const untrackedFile = fileLines.find((f) => f.path === 'untracked.ts' && !f.isHeader);
      expect(untrackedFile?.stagingState).toBe('untracked');
    });

    it('preserves file order within each section when using WorkingChanges', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const workingChanges: WorkingChanges = {
        staged: [
          { status: 'A', path: 'file1.ts' },
          { status: 'A', path: 'file2.ts' },
        ],
        unstaged: [
          { status: 'M', path: 'file3.ts' },
          { status: 'M', path: 'file4.ts' },
        ],
        untracked: [],
      };
      const fileLines = buildFileLines(commit, workingChanges);

      // Find staged files (skip header)
      const stagedFiles = fileLines.filter(
        (f) => !f.isHeader && f.path !== 'Staged' && f.stagingState === 'staged'
      );
      expect(stagedFiles[0]?.path).toBe('file1.ts');
      expect(stagedFiles[1]?.path).toBe('file2.ts');

      // Find unstaged files (skip header)
      const unstagedFiles = fileLines.filter(
        (f) => !f.isHeader && f.path !== 'Unstaged' && f.stagingState === 'unstaged'
      );
      expect(unstagedFiles[0]?.path).toBe('file3.ts');
      expect(unstagedFiles[1]?.path).toBe('file4.ts');
    });

    it('falls back to inferring from status codes when WorkingChanges not provided', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      // Call without WorkingChanges (undefined)
      const fileLines = buildFileLines(commit);

      // Should still work by inferring from status codes
      const stagedFile = fileLines.find((f) => f.path === 'new.ts' && !f.isHeader);
      expect(stagedFile?.stagingState).toBe('staged');

      const unstagedFile = fileLines.find((f) => f.path === 'modified.ts' && !f.isHeader);
      expect(unstagedFile?.stagingState).toBe('unstaged');

      const untrackedFile = fileLines.find((f) => f.path === 'untracked.ts' && !f.isHeader);
      expect(untrackedFile?.stagingState).toBe('untracked');
    });
  });

  // ── buildInfoLines ────────────────────────────────────────────────────────

  describe('buildInfoLines', () => {
    it('returns info lines for regular commits', () => {
      const commit: CommitEntry = {
        hash: 'abc123def456',
        message: 'feat: add feature',
        date: '2026-03-14',
        author: 'Alice Dev',
        body: 'Detailed description',
        parentHash: ['parent123'],
        refs: ['HEAD', 'main'],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);

      expect(result.infoLines).toBeDefined();
      expect(result.bodyLines).toBeDefined();
      expect(result.infoLines.length).toBeGreaterThan(0);
    });

    it('includes hash in info lines', () => {
      const commit: CommitEntry = {
        hash: 'abc123def456',
        message: 'feat: add feature',
        date: '2026-03-14',
        author: 'Alice Dev',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const hashLine = result.infoLines.find((l) => l.label === 'Hash  ');
      expect(hashLine?.value).toBe('abc123def456');
    });

    it('includes author in info lines', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Bob Builder',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const authorLine = result.infoLines.find((l) => l.label === 'Author');
      expect(authorLine?.value).toBe('Bob Builder');
    });

    it('includes date in info lines', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-20',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const dateLine = result.infoLines.find((l) => l.label === 'Date  ');
      expect(dateLine?.value).toBe('2026-03-20');
    });

    it('joins refs with comma when multiple refs exist', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: ['HEAD', 'main', 'v1.0.0'],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const refsLine = result.infoLines.find((l) => l.label === 'Refs  ');
      expect(refsLine?.value).toBe('HEAD, main, v1.0.0');
    });

    it('shows dash when no refs exist', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const refsLine = result.infoLines.find((l) => l.label === 'Refs  ');
      expect(refsLine?.value).toBe('—');
    });

    it('includes message with wrap flag set to true', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'feat: long message',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      const messageLine = result.infoLines.find((l) => l.label === 'Message');
      expect(messageLine?.value).toBe('feat: long message');
      expect(messageLine?.wrap).toBe(true);
    });

    it('splits body into lines', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: 'Line 1\nLine 2\nLine 3',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      expect(result.bodyLines).toContain('Line 1');
      expect(result.bodyLines).toContain('Line 2');
      expect(result.bodyLines).toContain('Line 3');
    });

    it('adds blank line before body', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: 'Body text',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      expect(result.bodyLines[0]).toBe('');
      expect(result.bodyLines[1]).toBe('Body text');
    });

    it('returns empty bodyLines when body is empty', () => {
      const commit: CommitEntry = {
        hash: 'abc123',
        message: 'test',
        date: '2026-03-14',
        author: 'Test',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [],
      };
      const result = buildInfoLines(commit);
      expect(result.bodyLines).toEqual([]);
    });

    // ── Working commit special case ───────────────────────────────────────

    it('returns working status for working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const result = buildInfoLines(commit);
      const statusLine = result.infoLines.find((l) => l.label === 'Status ');
      expect(statusLine?.value).toBe('Working directory changes');
    });

    it('counts staged files in working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new1.ts' },
          { status: 'A', path: 'new2.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const result = buildInfoLines(commit);
      const stagedLine = result.infoLines.find((l) => l.label === 'Staged ');
      expect(stagedLine?.value).toBe('2 file(s)');
    });

    it('counts unstaged files in working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified1.ts' },
          { status: 'M', path: 'modified2.ts' },
          { status: 'D', path: 'deleted.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      const result = buildInfoLines(commit);
      const unstagedLine = result.infoLines.find((l) => l.label === 'Unstaged');
      expect(unstagedLine?.value).toBe('3 file(s)');
    });

    it('counts untracked files in working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked1.ts' },
          { status: '??', path: 'untracked2.ts' },
        ],
      };
      const result = buildInfoLines(commit);
      const untrackedLine = result.infoLines.find((l) => l.label === 'Untracked');
      expect(untrackedLine?.value).toBe('2 file(s)');
    });

    it('returns empty bodyLines for working commit', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [{ status: 'M', path: 'test.ts' }],
      };
      const result = buildInfoLines(commit);
      expect(result.bodyLines).toEqual([]);
    });

    it('uses WorkingChanges for counting files when provided', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [], // Empty; will use WorkingChanges
      };
      const workingChanges: WorkingChanges = {
        staged: [
          { status: 'A', path: 'new1.ts' },
          { status: 'A', path: 'new2.ts' },
        ],
        unstaged: [{ status: 'M', path: 'modified.ts' }],
        untracked: [
          { status: '??', path: 'untracked1.ts' },
          { status: '??', path: 'untracked2.ts' },
        ],
      };
      const result = buildInfoLines(commit, workingChanges);

      const stagedLine = result.infoLines.find((l) => l.label === 'Staged ');
      expect(stagedLine?.value).toBe('2 file(s)');

      const unstagedLine = result.infoLines.find((l) => l.label === 'Unstaged');
      expect(unstagedLine?.value).toBe('1 file(s)');

      const untrackedLine = result.infoLines.find((l) => l.label === 'Untracked');
      expect(untrackedLine?.value).toBe('2 file(s)');
    });

    it('falls back to inferring from changedFiles when WorkingChanges not provided', () => {
      const commit: CommitEntry = {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: '2026-03-14',
        author: 'you',
        body: '',
        parentHash: [],
        refs: [],
        changedFiles: [
          { status: 'A', path: 'new.ts' },
          { status: 'M', path: 'modified.ts' },
          { status: '??', path: 'untracked.ts' },
        ],
      };
      // Call without WorkingChanges
      const result = buildInfoLines(commit);

      const stagedLine = result.infoLines.find((l) => l.label === 'Staged ');
      expect(stagedLine?.value).toBe('1 file(s)');

      const unstagedLine = result.infoLines.find((l) => l.label === 'Unstaged');
      expect(unstagedLine?.value).toBe('1 file(s)');

      const untrackedLine = result.infoLines.find((l) => l.label === 'Untracked');
      expect(untrackedLine?.value).toBe('1 file(s)');
    });
  });

  // ── FILE_STATUS_COLOR ─────────────────────────────────────────────────────

  describe('FILE_STATUS_COLOR', () => {
    it('defines color for Added status (A)', () => {
      expect(FILE_STATUS_COLOR['A']).toBe('green');
    });

    it('defines color for Modified status (M)', () => {
      expect(FILE_STATUS_COLOR['M']).toBe('yellow');
    });

    it('defines color for Deleted status (D)', () => {
      expect(FILE_STATUS_COLOR['D']).toBe('red');
    });

    it('defines color for Renamed status (R)', () => {
      expect(FILE_STATUS_COLOR['R']).toBe('cyan');
    });

    it('provides all expected status codes', () => {
      expect(Object.keys(FILE_STATUS_COLOR)).toContain('A');
      expect(Object.keys(FILE_STATUS_COLOR)).toContain('M');
      expect(Object.keys(FILE_STATUS_COLOR)).toContain('D');
      expect(Object.keys(FILE_STATUS_COLOR)).toContain('R');
    });
  });
});
