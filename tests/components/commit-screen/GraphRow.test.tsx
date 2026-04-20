import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { GraphRow, GraphConnectorRow } from '../../../src/components/commit-screen/GraphRow.js';
import type { CommitEntry } from '../../../src/data/mockRepos.js';

const longCommit: CommitEntry = {
  hash: '1234567890abcdef',
  message:
    'feat: this is a deliberately long commit message to verify graph row clipping works reliably',
  date: '2026-04-20',
  author: 'Long Author Name',
  body: '',
  parentHash: ['abcdef1234567890'],
  refs: ['HEAD', 'main', 'origin/main', 'refs/tags/v123.456.789'],
  changedFiles: [],
};

describe('GraphRow', () => {
  it('clips commit row content to maxWidth without wrapping', () => {
    const { lastFrame } = render(
      React.createElement(GraphRow, {
        prefix: '│ ● ',
        commit: longCommit,
        selected: true,
        maxWidth: 60,
      })
    );

    const output = lastFrame();
    expect(output).toBeDefined();
    expect(output?.split('\n')).toHaveLength(1);
    expect(output?.length).toBeLessThanOrEqual(60);
  });

  it('clips connector row content to maxWidth without wrapping', () => {
    const { lastFrame } = render(
      React.createElement(GraphConnectorRow, {
        prefix: '│ \\ │ \\ │ \\ │ \\ ',
        maxWidth: 8,
      })
    );

    const output = lastFrame();
    expect(output).toBeDefined();
    expect(output?.split('\n')).toHaveLength(1);
    expect(output?.length).toBeLessThanOrEqual(8);
  });
});
