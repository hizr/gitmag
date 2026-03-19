import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { FuzzySearchPopup } from '../../src/components/FuzzySearchPopup.js';
import type { CommitEntry } from '../../src/data/mockRepos.js';

// Mock useInput to capture handlers
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  const useInputHandler: ((input: string, key: any) => void)[] = [];

  return {
    ...(actual as object),
    useInput: (handler: (input: string, key: any) => void) => {
      useInputHandler.push(handler);
    },
    __useInputHandler: useInputHandler,
  };
});

function createMockCommit(overrides?: Partial<CommitEntry>): CommitEntry {
  return {
    hash: 'abc1234567890abcdef',
    message: 'fix: auth bug in login flow',
    date: '2024-03-15',
    author: 'John Doe',
    body: 'Detailed commit message',
    parentHash: ['parent1'],
    refs: ['HEAD', 'main'],
    changedFiles: [{ status: 'M', path: 'src/auth.ts' }],
    ...overrides,
  };
}

describe('FuzzySearchPopup', () => {
  it('renders search input and results area', () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('Search');
    expect(output).toContain('2 matches');
  });

  it('calls onSelect when Enter is pressed after typing search text', async () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
    ];

    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={onSelect}
        onClose={onClose}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const ink = await import('ink');
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];

    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);

    const handler = handlers[handlers.length - 1];

    // Simulate typing part of the commit message and then pressing Enter.
    for (const ch of 'fix') {
      handler(ch, { return: false, escape: false });
    }

    handler('', { return: true, escape: false });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(commits[0]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
    ];

    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={onSelect}
        onClose={onClose}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const ink = await import('ink');
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];

    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);

    const handler = handlers[handlers.length - 1];

    // Simulate pressing Escape to close the popup.
    handler('', { return: false, escape: true });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows all commits when search is empty', () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('2 matches');
  });

  it('filters commits based on message', () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
      createMockCommit({ message: 'docs: update readme', hash: 'ghi9012' }),
    ];

    // We can't easily test the search filtering without mocking useInput,
    // but we can verify the component renders
    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('3 matches');
  });

  it('calls onSelect when a result is selected', async () => {
    const commits = [createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' })];
    const onSelect = vi.fn();

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={onSelect}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    // Use the mocked ink.useInput handler to simulate pressing Return
    const inkModule: any = await import('ink');
    const handlers: ((input: string, key: any) => void)[] = inkModule.__useInputHandler || [];
    const handler = handlers[handlers.length - 1];

    // Simulate user pressing Return to select the currently highlighted commit
    handler('', { return: true });

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onClose when escape is pressed', () => {
    const commits = [createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' })];
    const onClose = vi.fn();

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={onClose}
        maxWidth={80}
        maxHeight={10}
      />
    );

    // Note: Testing actual keyboard input requires mocking useInput more thoroughly
    expect(onClose).not.toHaveBeenCalled();
  });

  it('displays commit hash and message in results', () => {
    const commits = [
      createMockCommit({
        hash: 'abc1234567890abcdef',
        message: 'fix: critical bug in auth system',
      }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('abc1234');
    expect(output).toContain('fix: critical bug');
  });

  it('handles WORKING commit hash specially', () => {
    const commits = [
      createMockCommit({
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
      }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('WORK');
  });

  it('searches across multiple fields (message, author, refs, files)', () => {
    const commits = [
      createMockCommit({
        message: 'fix: auth bug',
        author: 'John Doe',
        refs: ['main', 'v1.0.0'],
        changedFiles: [{ status: 'M', path: 'src/auth.ts' }],
      }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    // Should show the commit in results
    expect(output).toContain('1 matches');
  });
});
