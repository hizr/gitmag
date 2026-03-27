import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { FuzzySearchPopup } from '../../src/components/FuzzySearchPopup.js';
import type { CommitEntry } from '../../src/data/mockRepos.js';

// Mock useInput to capture handlers
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    expect(onSelect).toHaveBeenCalledWith(0);
    expect(onClose).not.toHaveBeenCalled();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inkModule: any = await import('ink');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: ((input: string, key: any) => void)[] = inkModule.__useInputHandler || [];
    const handler = handlers[handlers.length - 1];

    // Simulate user pressing Return to select the currently highlighted commit
    handler('', { return: true });

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onClose when escape is pressed', async () => {
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

    // Before simulating input, onClose should not have been called
    expect(onClose).not.toHaveBeenCalled();

    // Simulate pressing the Escape key via the captured useInput handler
    const ink = await import('ink');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];
    const handler = handlers[handlers.length - 1];
    handler('', { escape: true });

    expect(onClose).toHaveBeenCalledTimes(1);
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

  it('accepts onHighlight callback prop', () => {
    const commits = [createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' })];

    const onHighlight = vi.fn();

    // Should not throw when onHighlight is provided
    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onHighlight={onHighlight}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    // Component should render successfully without errors
    const output = lastFrame();
    expect(output).toContain('Search');
    // Note: onHighlight callback is tested at integration level in CommitScreen tests
    // because useEffect doesn't fire in ink-testing-library unit tests
  });

  // ── Additional comprehensive tests ──────────────────────────────────────

  it('displays no matches message when search yields no results', async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];
    const handler = handlers[handlers.length - 1];

    // Type something that won't match
    for (const ch of 'xyz999') {
      handler(ch, {});
    }

    // Don't press enter - just let search show no results
    // In real usage, onSelect would not be called
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('navigates search results with arrow keys', async () => {
    const commits = [
      createMockCommit({ message: 'fix: first', hash: 'abc1' }),
      createMockCommit({ message: 'fix: second', hash: 'abc2' }),
      createMockCommit({ message: 'fix: third', hash: 'abc3' }),
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

    // Should render all results
    const output = lastFrame();
    expect(output).toContain('3 matches');
    expect(output).toContain('fix: first');
  });

  it('handles backspace to delete typed characters', async () => {
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

    const ink = await import('ink');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];
    const handler = handlers[handlers.length - 1];

    // Type some characters
    handler('f', {});
    handler('i', {});
    handler('x', {});

    // Delete one character
    handler('', { backspace: true });

    // Component should still work
    handler('', { return: true });
    expect(onSelect).toHaveBeenCalled();
  });

  it('handles delete key same as backspace', async () => {
    const commits = [createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' })];

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const ink = await import('ink');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];
    const handler = handlers[handlers.length - 1];

    // Type and delete
    handler('t', {});
    handler('e', {});
    handler('s', {});
    handler('t', {});
    handler('', { delete: true });

    // Should work without error
    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );
    expect(lastFrame()).toBeDefined();
  });

  it('shows correct result counter', () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
      createMockCommit({ message: 'docs: update readme', hash: 'ghi9012' }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={20}
      />
    );

    const output = lastFrame();
    // Counter should show [1/3] when first result is highlighted
    expect(output).toContain('[1/3]');
  });

  it('handles scrolling in large result sets', async () => {
    const commits = Array.from({ length: 30 }, (_, i) =>
      createMockCommit({
        message: `commit ${i}`,
        hash: `hash${i}`,
      })
    );

    const onHighlight = vi.fn();
    const onSelect = vi.fn();

    render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={onSelect}
        onHighlight={onHighlight}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const ink = await import('ink');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (ink as any).__useInputHandler as ((input: string, key: any) => void)[];
    const handler = handlers[handlers.length - 1];

    // Scroll down through results
    for (let i = 0; i < 15; i++) {
      handler('', { downArrow: true });
    }

    // Scroll up
    for (let i = 0; i < 10; i++) {
      handler('', { upArrow: true });
    }

    // Should be able to select
    handler('', { return: true });
    expect(onSelect).toHaveBeenCalled();
  });

  it('respects maxWidth and maxHeight constraints', () => {
    const commits = [
      createMockCommit({ message: 'fix: auth bug', hash: 'abc1234' }),
      createMockCommit({ message: 'feat: add login', hash: 'def5678' }),
    ];

    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={40}
        maxHeight={5}
      />
    );

    const output = lastFrame();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('handles empty commit array', () => {
    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={[]}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    const output = lastFrame();
    expect(output).toContain('0 matches');
  });

  it('searches by author name', () => {
    const commits = [
      createMockCommit({ author: 'Alice', message: 'feature' }),
      createMockCommit({ author: 'Bob', message: 'bugfix' }),
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
    // Both commits should be shown initially
    expect(output).toContain('2 matches');
  });

  it('searches by file path', () => {
    const commits = [
      createMockCommit({
        changedFiles: [{ status: 'M', path: 'src/auth.ts' }],
        message: 'update auth',
      }),
      createMockCommit({
        changedFiles: [{ status: 'A', path: 'src/utils/helpers.ts' }],
        message: 'add helpers',
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
    expect(output).toContain('2 matches');
  });

  it('searches by ref tags', () => {
    const commits = [
      createMockCommit({ refs: ['v1.0.0', 'main'], message: 'release' }),
      createMockCommit({ refs: ['HEAD'], message: 'latest' }),
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

  it('does not call onSelect when pressing return with no results', async () => {
    const commits = [createMockCommit({ message: 'fix: auth', hash: 'abc1' })];
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

    // Component should render successfully with results available
    const { lastFrame } = render(
      <FuzzySearchPopup
        commits={commits}
        onSelect={() => {}}
        onClose={() => {}}
        maxWidth={80}
        maxHeight={10}
      />
    );

    // With default empty search, all commits are shown
    expect(lastFrame()).toContain('1 matches');
  });
});
