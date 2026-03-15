import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Ink's useInput and useApp
vi.mock('ink', () => ({
  useInput: vi.fn(),
  useApp: vi.fn(),
}));

import { useQuit } from '../../src/hooks/useQuit.js';
import * as ink from 'ink';

describe('useQuit', () => {
  let mockExit: ReturnType<typeof vi.fn>;
  let capturedInputHandler: ((input: string, key: object) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.fn();
    capturedInputHandler = null;

    // Mock useApp to return exit function
    vi.mocked(ink.useApp).mockReturnValue({
      exit: mockExit,
      // other useApp properties not needed for this test
    } as never);

    // Mock useInput to capture the handler function
    vi.mocked(ink.useInput).mockImplementation((handler) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      capturedInputHandler = handler as any;
    });
  });

  it('calls exit when q is pressed', () => {
    renderHook(() => useQuit(true));

    expect(capturedInputHandler).not.toBeNull();
    capturedInputHandler?.('q', {});

    expect(mockExit).toHaveBeenCalledTimes(1);
  });

  it('does not call exit for other keys', () => {
    renderHook(() => useQuit(true));

    capturedInputHandler?.('j', {});
    capturedInputHandler?.('k', {});
    capturedInputHandler?.('enter', {});

    expect(mockExit).not.toHaveBeenCalled();
  });

  it('registers input handler with useInput', () => {
    renderHook(() => useQuit(true));

    expect(vi.mocked(ink.useInput)).toHaveBeenCalledTimes(1);
  });

  it('does not call exit when canQuit is false', () => {
    renderHook(() => useQuit(false));

    // Even if 'q' is pressed, exit should not be called when quitting is disabled.
    capturedInputHandler?.('q', {});

    expect(mockExit).not.toHaveBeenCalled();
  });
});
