import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { FooterNode } from '../../src/components/commit-screen/FooterNode.js';

describe('FooterNode', () => {
  it('includes navigation instructions in the default footer', () => {
    const { lastFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'graph',
        isWorkingCommit: false,
      })
    );

    const output = lastFrame();
    expect(output).toMatch(/navigate/i);
    expect(output).toMatch(/bksp\/del|backspace/i);
  });

  it('mentions copy SHA, enter/select-diff, and pick shortcuts in default footer', () => {
    const { lastFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'graph',
        isWorkingCommit: false,
      })
    );

    const output = lastFrame();
    expect(output).toMatch(/\[c\]|copy sha/i);
    expect(output).toMatch(/enter|select\/diff/i);
    expect(output).toMatch(/\[p\]\s+pick/i);
  });

  it('includes pick command between copy SHA and back commands', () => {
    const { lastFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'graph',
        isWorkingCommit: false,
      })
    );

    const output = lastFrame();
    if (!output) throw new Error('lastFrame() returned undefined');

    const cIndex = output.indexOf('[c]');
    const pIndex = output.indexOf('[p]');
    const bkspIndex = output.indexOf('[bksp/del]');

    expect(cIndex).toBeGreaterThanOrEqual(0);
    expect(pIndex).toBeGreaterThanOrEqual(0);
    expect(bkspIndex).toBeGreaterThanOrEqual(0);
    expect(cIndex).toBeLessThan(pIndex);
    expect(pIndex).toBeLessThan(bkspIndex);
  });

  it('renders match footer when matchCount is greater than zero', () => {
    const { lastFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 2,
        focus: 'graph',
        isWorkingCommit: false,
      })
    );

    const output = lastFrame();
    expect(output).toContain('[n/m] next/prev match (2 results)');
    expect(output).toContain('[/] new search');
  });

  it('renders copy status with highest priority', () => {
    const { lastFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: 'Copied abc123',
        matchCount: 3,
        focus: 'files',
        isWorkingCommit: true,
      })
    );

    const output = lastFrame();
    expect(output).toContain('Copied abc123');
    expect(output).not.toContain('[n/m] next/prev match');
    expect(output).not.toContain('[/] search');
  });

  it('shows stage/unstage hint only for files focus on working commit', () => {
    const { lastFrame: workingFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'files',
        isWorkingCommit: true,
      })
    );
    expect(workingFrame()).toContain('[+] stage/unstage');

    const { lastFrame: graphFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'graph',
        isWorkingCommit: true,
      })
    );
    expect(graphFrame()).not.toContain('[+] stage/unstage');

    const { lastFrame: nonWorkingFrame } = render(
      React.createElement(FooterNode, {
        copyStatus: null,
        matchCount: 0,
        focus: 'files',
        isWorkingCommit: false,
      })
    );
    expect(nonWorkingFrame()).not.toContain('[+] stage/unstage');
  });
});
