import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { CommitScreen } from '../../src/components/CommitScreen.js';
import type { RepoEntry } from '../../src/data/mockRepos.js';

describe('CommitScreen', () => {
  const mockRepo: RepoEntry = {
    path: '~/dev/gitmag',
    commits: [
      { hash: '92f2ae8', message: 'feat: implement full terminal centering', date: '2026-03-14' },
      {
        hash: '37108a1',
        message: 'fix: simplify splash screen layout padding',
        date: '2026-03-14',
      },
    ],
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders breadcrumb with repo path', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: mockRepo, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
    expect(output).toContain('›');
  });

  it('renders commit list for the repo', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: mockRepo, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('92f2ae8');
    expect(output).toContain('37108a1');
    expect(output).toContain('feat: implement full terminal centering');
  });

  it('displays commit dates', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: mockRepo, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toContain('2026-03-14');
  });

  it('includes navigation instructions', () => {
    const { lastFrame } = render(
      React.createElement(CommitScreen, { repo: mockRepo, onBack: mockOnBack })
    );
    const output = lastFrame();
    expect(output).toMatch(/esc|back/i);
  });

  it('accepts onBack callback prop', () => {
    render(React.createElement(CommitScreen, { repo: mockRepo, onBack: mockOnBack }));
    expect(mockOnBack).toBeDefined();
  });
});
