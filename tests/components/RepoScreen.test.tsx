import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { RepoScreen } from '../../src/components/RepoScreen.js';
import type { ScanProgress } from '../../src/components/Scanner.js';

describe('RepoScreen', () => {
  const mockScanProgress: ScanProgress = {
    phase: 'Finalizing...',
    done: true,
  };

  it('renders header with app name', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, { scanProgress: mockScanProgress })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
  });

  it('renders repo paths from mock data', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, { scanProgress: mockScanProgress })
    );
    const output = lastFrame();
    expect(output).toContain('gitmag');
    expect(output).toContain('my-project');
    expect(output).toContain('api-server');
  });

  it('renders commits with hash and message', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, { scanProgress: mockScanProgress })
    );
    const output = lastFrame();
    // Check for at least one commit hash and message
    expect(output).toMatch(/[a-f0-9]{7}/); // 7-char hex hash
    expect(output).toContain('feat:'); // typical commit prefix
  });

  it('displays scan phase in header', () => {
    const { lastFrame } = render(
      React.createElement(RepoScreen, { scanProgress: mockScanProgress })
    );
    const output = lastFrame();
    expect(output).toContain('Finalizing...');
  });

  it('renders without crashing with different scan progress states', () => {
    const inProgress: ScanProgress = {
      phase: 'Analyzing activity...',
      done: false,
    };
    const { lastFrame } = render(React.createElement(RepoScreen, { scanProgress: inProgress }));
    expect(lastFrame()).toContain('gitmag');
    expect(lastFrame()).toContain('Analyzing activity...');
  });
});
