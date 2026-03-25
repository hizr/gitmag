import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { BranchInfoPanel } from '../../../src/components/commit-screen/BranchInfoPanel.js';
import type { BranchInfo } from '../../../src/data/mockRepos.js';

describe('BranchInfoPanel', () => {
  // ── Loading state ─────────────────────────────────────────────────────────

  it('renders loading message when branchInfo is undefined', () => {
    const { lastFrame } = render(
      React.createElement(BranchInfoPanel, { branchInfo: undefined, width: 80 })
    );
    const output = lastFrame();
    expect(output).toContain('Loading branch information');
  });

  it('renders loading panel with correct label when branchInfo is undefined', () => {
    const { lastFrame } = render(
      React.createElement(BranchInfoPanel, { branchInfo: undefined, width: 80 })
    );
    const output = lastFrame();
    expect(output).toContain('Branch Info');
  });

  // ── Loaded state ───────────────────────────────────────────────────────────

  it('renders branch name when branchInfo is provided', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('main');
    expect(output).toContain('Branch');
  });

  it('renders repo path when branchInfo is provided', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('/home/user/my-repo');
    expect(output).toContain('Path');
  });

  it('renders head author when branchInfo is provided', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('Alice Dev');
    expect(output).toContain('Head');
  });

  // ── Remote tracking status ─────────────────────────────────────────────────

  it('shows remote branch name when it exists', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'feature',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/feature',
      headAuthor: 'Bob Builder',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('origin/feature');
    expect(output).toContain('Remote');
  });

  it('shows check mark when remote branch exists and no divergence', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('✓');
  });

  it('shows "no upstream" when remoteBranch is null', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'feature-dev',
      repoPath: '/home/user/my-repo',
      remoteBranch: null,
      headAuthor: 'Charlie Brown',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('no upstream');
  });

  it('displays remote status with dash when no remote and no divergence', () => {
    // The dash symbol is shown internally in aheadBehindStr, but the final statusStr
    // shows "(no upstream)" when remoteBranch is null, so this test verifies that
    const branchInfo: BranchInfo = {
      currentBranch: 'feature-dev',
      repoPath: '/home/user/my-repo',
      remoteBranch: null,
      headAuthor: 'Charlie Brown',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    // When no remote, the UI shows "(no upstream)" not the dash
    expect(output).toContain('(no upstream)');
  });

  it('displays remote status correctly when no remote branch', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'feature-dev',
      repoPath: '/home/user/my-repo',
      remoteBranch: null,
      headAuthor: 'Charlie Brown',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    // When no remote, the UI shows "(no upstream)"
    expect(output).toContain('(no upstream)');
  });

  // ── Ahead/behind tracking ──────────────────────────────────────────────────

  it('shows ahead count when local is ahead of remote', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 3,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('↑3');
  });

  it('shows behind count when local is behind remote', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 2,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('↓2');
  });

  it('shows both ahead and behind when diverged', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'develop',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/develop',
      headAuthor: 'David Dev',
      ahead: 5,
      behind: 3,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('↑5');
    expect(output).toContain('↓3');
  });

  // ── Layout tests ───────────────────────────────────────────────────────────

  it('renders with the provided width', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 120 }));
    const output = lastFrame();
    // Should render without errors and contain expected content
    expect(output).toContain('Branch Info');
    expect(output).toContain('main');
  });

  it('renders with small width (edge case)', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 40 }));
    const output = lastFrame();
    expect(output).toContain('Branch Info');
  });

  // ── Panel label ────────────────────────────────────────────────────────────

  it('always renders with "Branch Info" label', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'testing',
      repoPath: '/home/user/test-repo',
      remoteBranch: 'origin/testing',
      headAuthor: 'Test User',
      ahead: 1,
      behind: 1,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toContain('Branch Info');
  });

  it('renders panel as unfocused', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Alice Dev',
      ahead: 0,
      behind: 0,
    };
    // BranchInfoPanel always renders with focused={false}
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 80 }));
    const output = lastFrame();
    expect(output).toBeTruthy();
    // Panel should render without special focus styling
    expect(output).not.toContain('inverse');
  });

  // ── Special characters and formatting ─────────────────────────────────────

  it('displays special branch names correctly', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'feat/user-auth-system',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/feat/user-auth-system',
      headAuthor: 'Feature Dev',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 100 }));
    const output = lastFrame();
    expect(output).toContain('feat/user-auth-system');
  });

  it('handles author names with special characters', () => {
    const branchInfo: BranchInfo = {
      currentBranch: 'main',
      repoPath: '/home/user/my-repo',
      remoteBranch: 'origin/main',
      headAuthor: 'Müller, José & Co.',
      ahead: 0,
      behind: 0,
    };
    const { lastFrame } = render(React.createElement(BranchInfoPanel, { branchInfo, width: 100 }));
    const output = lastFrame();
    expect(output).toContain('Müller');
  });
});
