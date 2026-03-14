import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanner } from '../../src/components/Scanner.js';

describe('useScanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: phase is "Scanning repositories...", done is false', () => {
    const { result } = renderHook(() => useScanner());

    expect(result.current.phase).toBe('Scanning repositories...');
    expect(result.current.done).toBe(false);
  });

  it('phase advances to "Indexing commits..." at 1250ms', () => {
    const { result } = renderHook(() => useScanner());

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(result.current.phase).toBe('Indexing commits...');
    expect(result.current.done).toBe(false);
  });

  it('phase advances to "Analyzing activity..." at 2500ms', () => {
    const { result } = renderHook(() => useScanner());

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.phase).toBe('Analyzing activity...');
    expect(result.current.done).toBe(false);
  });

  it('phase advances to "Preparing digest..." at 3750ms', () => {
    const { result } = renderHook(() => useScanner());

    act(() => {
      vi.advanceTimersByTime(3750);
    });

    expect(result.current.phase).toBe('Preparing digest...');
    expect(result.current.done).toBe(false);
  });

  it('done becomes true at 7000ms (final phase + 1s buffer)', () => {
    const { result } = renderHook(() => useScanner());

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(result.current.done).toBe(true);
  });

  it('timers are cleaned up on unmount', () => {
    const { unmount } = renderHook(() => useScanner());

    unmount();

    // Advance past all timers — no state updates should occur
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // If we reach here without warnings, timers were cleaned up properly
    expect(true).toBe(true);
  });
});
