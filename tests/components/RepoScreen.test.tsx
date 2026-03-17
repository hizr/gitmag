import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { RepoScreen } from '../../src/components/RepoScreen.js';
import type { ScanProgress } from '../../src/components/Scanner.js';
import type { RepoEntry } from '../../src/data/mockRepos.js';

describe('RepoScreen', () => {
  const mockScanProgress: ScanProgress = {
    phase: 'Finalizing...',
    done: true,
  };

  const mockRepos: RepoEntry[] = [
    {
      path: '~/dev/test-repo',
      commits: [
        {
          hash: '92f2ae8',
          message: 'feat: test commit',
          date: '2026-03-17',
          author: 'Test Author',
          body: 'Test body',
          parentHash: [],
          branchName: undefined,
          changedFiles: [],
        },
        {
          hash: '37108a1',
          message: 'fix: another test',
          date: '2026-03-16',
          author: 'Test Author',
          body: 'Test body 2',
          parentHash: ['92f2ae8'],
          branchName: undefined,
          changedFiles: [],
        },
      ],
    },
    {
      path: '~/dev/another-repo',
      commits: [
        {
          hash: 'abc1234',
          message: 'feat: initial setup',
          date: '2026-03-15',
          author: 'Test Author',
          body: 'Initial setup',
          parentHash: [],
          branchName: undefined,
          changedFiles: [],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with app name', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
  });

  it('renders repo paths from props', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    expect(output).toContain('test-repo');
    expect(output).toContain('another-repo');
  });

  it('renders commits with hash and message', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    // Check for commit hash and message
    expect(output).toMatch(/[a-f0-9]{7}/); // 7-char hex hash
    expect(output).toContain('feat:'); // typical commit prefix
  });

  it('displays scan phase in header', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    expect(output).toContain('Finalizing...');
  });

  it('renders without crashing with different scan progress states', () => {
    const inProgress: ScanProgress = {
      phase: 'Analyzing activity...',
      done: false,
    };
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: inProgress,
        selectedIdx: 0,
      })
    );
    expect(lastFrame()).toContain('gitmag');
    expect(lastFrame()).toContain('Analyzing activity...');
  });

  it('shows first repo as selected by default', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    // First repo should have selection indicator (> prefix)
    expect(output).toMatch(/>/);
  });

  it('includes navigation instructions', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 0,
      })
    );
    const output = lastFrame();
    expect(output).toMatch(/j|k|arrow/i);
  });

  it('accepts selectedIdx prop', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, {
        repos: mockRepos,
        scanProgress: mockScanProgress,
        selectedIdx: 1,
      })
    );
    expect(lastFrame()).toContain('gitmag');
  });
});
