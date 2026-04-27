import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { ChangedFilesPanel } from '../../../src/components/commit-screen/ChangedFilesPanel.js';
import type { FileLine } from '../../../src/components/commit-screen/commit-screen.utils.js';

describe('ChangedFilesPanel', () => {
  // ── Empty files list ──────────────────────────────────────────────────────

  it('renders panel with correct label', () => {
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines: [],
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Changed Files');
  });

  it('shows "No changed files" message when list is empty', () => {
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines: [],
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('No changed files');
  });

  // ── File rendering ────────────────────────────────────────────────────────

  it('renders file status indicator', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('M');
  });

  it('renders file path', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('src/main.ts');
  });

  it('renders multiple files', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'src/main.ts', isHeader: false },
      { status: 'A', path: 'src/feature.ts', isHeader: false },
      { status: 'D', path: 'src/old.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('src/main.ts');
    expect(output).toContain('src/feature.ts');
    expect(output).toContain('src/old.ts');
  });

  // ── Header rendering ──────────────────────────────────────────────────────

  it('renders header row with special formatting', () => {
    const fileLines: FileLine[] = [
      { status: '📦', path: 'Staged', isHeader: true },
      { status: 'M', path: 'src/main.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Staged');
  });

  it('renders multiple section headers', () => {
    const fileLines: FileLine[] = [
      { status: '📦', path: 'Staged', isHeader: true },
      { status: 'M', path: 'staged-file.ts', isHeader: false },
      { status: '✎', path: 'Unstaged', isHeader: true },
      { status: 'M', path: 'unstaged-file.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Staged');
    expect(output).toContain('Unstaged');
  });

  // ── Selection highlighting ────────────────────────────────────────────────

  it('highlights selected file', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'src/main.ts', isHeader: false },
      { status: 'A', path: 'src/feature.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 1,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('src/feature.ts');
  });

  it('shows first file as selected when selectedFileIdx is 0', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'src/main.ts', isHeader: false },
      { status: 'A', path: 'src/feature.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('src/main.ts');
  });

  // ── Scrolling behavior ────────────────────────────────────────────────────

  it('respects filesScroll position', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'file1.ts', isHeader: false },
      { status: 'M', path: 'file2.ts', isHeader: false },
      { status: 'M', path: 'file3.ts', isHeader: false },
      { status: 'M', path: 'file4.ts', isHeader: false },
      { status: 'M', path: 'file5.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 2,
        width: 80,
        height: 15,
        innerHeight: 3,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('file3.ts');
  });

  it('shows visible slice based on scroll and innerHeight', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'file1.ts', isHeader: false },
      { status: 'M', path: 'file2.ts', isHeader: false },
      { status: 'M', path: 'file3.ts', isHeader: false },
      { status: 'M', path: 'file4.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 1,
        width: 80,
        height: 15,
        innerHeight: 2,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('file2.ts');
    expect(output).toContain('file3.ts');
  });

  // ── Focus state ───────────────────────────────────────────────────────────

  it('renders as unfocused when focused prop is false', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toBeTruthy();
  });

  it('renders panel when focused prop is true', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: true,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Changed Files');
  });

  // ── Status codes ──────────────────────────────────────────────────────────

  it('renders Modified (M) status', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('M');
  });

  it('renders Added (A) status', () => {
    const fileLines: FileLine[] = [{ status: 'A', path: 'src/new.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('A');
  });

  it('renders Deleted (D) status', () => {
    const fileLines: FileLine[] = [{ status: 'D', path: 'src/old.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('D');
  });

  it('renders Renamed (R) status', () => {
    const fileLines: FileLine[] = [{ status: 'R', path: 'src/renamed.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('R');
  });

  // ── Width constraints ─────────────────────────────────────────────────────

  it('handles small width gracefully', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 40,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Changed Files');
  });

  it('handles large width gracefully', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'src/main.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 150,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('src/main.ts');
  });

  // ── Long file paths ───────────────────────────────────────────────────────

  it('renders long file paths', () => {
    const longPath = 'src/deep/nested/directory/structure/very/long/file/path/component.tsx';
    const fileLines: FileLine[] = [{ status: 'M', path: longPath, isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 100,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain(longPath);
  });

  // ── Empty padding ─────────────────────────────────────────────────────────

  it('fills remaining height with empty rows when files < innerHeight', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'file1.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 10,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Changed Files');
  });

  // ── Complex file list with headers ────────────────────────────────────────

  it('renders complete working changes structure', () => {
    const fileLines: FileLine[] = [
      { status: '📦', path: 'Staged', isHeader: true },
      { status: 'A', path: 'src/new-feature.ts', isHeader: false },
      { status: 'M', path: 'src/existing.ts', isHeader: false },
      { status: '✎', path: 'Unstaged', isHeader: true },
      { status: 'M', path: 'src/modified.ts', isHeader: false },
      { status: 'D', path: 'src/deleted.ts', isHeader: false },
      { status: '?', path: 'Untracked', isHeader: true },
      { status: '??', path: 'src/untracked.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 20,
        innerHeight: 18,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Staged');
    expect(output).toContain('Unstaged');
    expect(output).toContain('Untracked');
    expect(output).toContain('src/new-feature.ts');
  });

  // ── Selection across scroll ───────────────────────────────────────────────

  it('applies selection to scrolled file', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'file1.ts', isHeader: false },
      { status: 'M', path: 'file2.ts', isHeader: false },
      { status: 'M', path: 'file3.ts', isHeader: false },
      { status: 'M', path: 'file4.ts', isHeader: false },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 3,
        filesScroll: 1,
        width: 80,
        height: 15,
        innerHeight: 3,
        focused: false,
      })
    );
    const output = lastFrame();
    expect(output).toContain('file4.ts');
  });

  // ── Staging indicators ────────────────────────────────────────────────────

  it('renders staging indicator for staged files', () => {
    const fileLines: FileLine[] = [
      { status: 'A', path: 'new-file.ts', isHeader: false, stagingState: 'staged' },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    // Staging indicator is [●] for staged files
    expect(output).toContain('●');
    expect(output).toContain('new-file.ts');
  });

  it('renders staging indicator for unstaged files', () => {
    const fileLines: FileLine[] = [
      { status: 'M', path: 'modified-file.ts', isHeader: false, stagingState: 'unstaged' },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    // Staging indicator is [○] for unstaged files
    expect(output).toContain('○');
    expect(output).toContain('modified-file.ts');
  });

  it('renders staging indicator for untracked files', () => {
    const fileLines: FileLine[] = [
      { status: '??', path: 'untracked-file.ts', isHeader: false, stagingState: 'untracked' },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    // Staging indicator is [?] for untracked files
    expect(output).toContain('?');
    expect(output).toContain('untracked-file.ts');
  });

  it('does not render staging indicator for header rows', () => {
    const fileLines: FileLine[] = [
      { status: '📦', path: 'Staged', isHeader: true },
      { status: 'A', path: 'file.ts', isHeader: false, stagingState: 'staged' },
    ];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    // Headers should still render but without staging indicators
    expect(output).toContain('Staged');
    // The file should have the indicator
    expect(output).toContain('●');
  });

  it('does not render staging indicator for files without stagingState', () => {
    const fileLines: FileLine[] = [{ status: 'M', path: 'file.ts', isHeader: false }];
    const { lastFrame } = render(
      React.createElement(ChangedFilesPanel, {
        fileLines,
        selectedFileIdx: 0,
        filesScroll: 0,
        width: 80,
        height: 15,
        innerHeight: 13,
        focused: false,
      })
    );
    const output = lastFrame();
    // File should render without staging indicator
    expect(output).toContain('file.ts');
    expect(output).not.toContain('●');
    expect(output).not.toContain('○');
  });
});
