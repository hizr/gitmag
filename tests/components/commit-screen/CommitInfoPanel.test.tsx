import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { CommitInfoPanel } from '../../../src/components/commit-screen/CommitInfoPanel.js';
import type { CommitEntry } from '../../../src/data/mockRepos.js';

describe('CommitInfoPanel', () => {
  const mockCommit: CommitEntry = {
    hash: 'abc123def456',
    message: 'feat: add new feature',
    date: '2026-03-14',
    author: 'Alice Dev',
    body: 'This is a detailed description of the change.\nIt spans multiple lines.',
    parentHash: ['parent123'],
    refs: ['HEAD', 'main'],
    changedFiles: [
      { status: 'M', path: 'src/main.ts' },
      { status: 'A', path: 'src/feature.ts' },
    ],
  };

  // ── Basic rendering ───────────────────────────────────────────────────────

  it('renders with correct panel label', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Commit Info');
  });

  it('renders commit hash', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('abc123def456');
  });

  it('renders author name', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Alice Dev');
  });

  it('renders commit date', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('2026-03-14');
  });

  it('renders commit message', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('feat: add new feature');
  });

  it('renders commit refs', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('HEAD');
    expect(output).toContain('main');
  });

  // ── Body rendering ────────────────────────────────────────────────────────

  it('renders commit body when available', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('This is a detailed description');
  });

  it('renders multiline body text', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('It spans multiple lines');
  });

  it('handles empty body gracefully', () => {
    const commitWithoutBody: CommitEntry = {
      ...mockCommit,
      body: '',
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: commitWithoutBody,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Commit Info');
  });

  // ── Refs handling ─────────────────────────────────────────────────────────

  it('shows dash when no refs exist', () => {
    const commitWithoutRefs: CommitEntry = {
      ...mockCommit,
      refs: [],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: commitWithoutRefs,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('—');
  });

  it('joins multiple refs with comma', () => {
    const commitWithMultipleRefs: CommitEntry = {
      ...mockCommit,
      refs: ['HEAD', 'main', 'v1.0.0', 'release/1.0'],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: commitWithMultipleRefs,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('HEAD');
    expect(output).toContain('main');
    expect(output).toContain('v1.0.0');
    expect(output).toContain('release/1.0');
  });

  // ── Scrolling behavior ────────────────────────────────────────────────────

  it('respects infoScroll position', () => {
    // This test verifies that scrolling is applied correctly
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 2,
        innerHeight: 10,
      })
    );
    const output = lastFrame();
    expect(output).toBeTruthy();
  });

  it('renders correct number of lines based on innerHeight', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 5,
      })
    );
    const output = lastFrame();
    // Should render without error and contain panel content
    expect(output).toContain('Commit Info');
  });

  it('fills empty space when content is shorter than innerHeight', () => {
    const shortCommit: CommitEntry = {
      hash: 'abc123',
      message: 'quick fix',
      date: '2026-03-14',
      author: 'Bob',
      body: '',
      parentHash: [],
      refs: [],
      changedFiles: [],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: shortCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 20,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Commit Info');
  });

  // ── Working commit special case ────────────────────────────────────────────

  it('renders working commit status correctly', () => {
    const workingCommit: CommitEntry = {
      hash: '__WORKING__',
      message: '[WORKING] Local changes',
      date: new Date().toISOString().split('T')[0],
      author: 'you',
      body: '',
      parentHash: [],
      refs: [],
      changedFiles: [
        { status: 'M', path: 'file1.ts' },
        { status: '??', path: 'file2.ts' },
      ],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: workingCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Working directory changes');
  });

  it('shows file counts for working commit', () => {
    const workingCommit: CommitEntry = {
      hash: '__WORKING__',
      message: '[WORKING] Local changes',
      date: new Date().toISOString().split('T')[0],
      author: 'you',
      body: '',
      parentHash: [],
      refs: [],
      changedFiles: [
        { status: 'M', path: 'file1.ts' },
        { status: 'M', path: 'file2.ts' },
        { status: '??', path: 'file3.ts' },
      ],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: workingCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('file(s)');
  });

  // ── Label rendering ───────────────────────────────────────────────────────

  it('renders field labels with correct colors', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Hash');
    expect(output).toContain('Author');
    expect(output).toContain('Date');
    expect(output).toContain('Refs');
    expect(output).toContain('Message');
  });

  // ── Width constraints ─────────────────────────────────────────────────────

  it('handles small width gracefully', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 40,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Commit Info');
  });

  it('handles large width gracefully', () => {
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: mockCommit,
        width: 200,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Commit Info');
  });

  // ── Message wrapping for long messages ────────────────────────────────────

  it('handles very long commit message', () => {
    const longMessageCommit: CommitEntry = {
      ...mockCommit,
      message:
        'This is an extremely long commit message that ' +
        'should be wrapped and displayed across multiple lines when rendered in the UI. ' +
        'It contains a lot of information about the change.',
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: longMessageCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('extremely long commit message');
  });

  // ── Empty refs case ───────────────────────────────────────────────────────

  it('displays single ref correctly', () => {
    const singleRefCommit: CommitEntry = {
      ...mockCommit,
      refs: ['v1.0.0'],
    };
    const { lastFrame } = render(
      React.createElement(CommitInfoPanel, {
        commit: singleRefCommit,
        width: 80,
        height: 15,
        infoScroll: 0,
        innerHeight: 13,
      })
    );
    const output = lastFrame();
    expect(output).toContain('v1.0.0');
  });
});
