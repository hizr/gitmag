// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompletionGate } from '../../src/hooks/useCompletionGate.js';

describe('useCompletionGate hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call onComplete when neither condition is met', () => {
    const onComplete = vi.fn();
    renderHook(() => useCompletionGate({ animationDone: false, scanDone: false, onComplete }));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not call onComplete when animation is done but scan is not', () => {
    const onComplete = vi.fn();
    renderHook(() => useCompletionGate({ animationDone: true, scanDone: false, onComplete }));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not call onComplete when scan is done but animation is not', () => {
    const onComplete = vi.fn();
    renderHook(() => useCompletionGate({ animationDone: false, scanDone: true, onComplete }));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('calls onComplete when both animation and scan are done', () => {
    const onComplete = vi.fn();
    renderHook(() => useCompletionGate({ animationDone: true, scanDone: true, onComplete }));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when animation completes first, then scan completes', () => {
    const onComplete = vi.fn();
    const { rerender } = renderHook(
      ({ animationDone, scanDone }) => useCompletionGate({ animationDone, scanDone, onComplete }),
      { initialProps: { animationDone: true, scanDone: false } }
    );

    expect(onComplete).not.toHaveBeenCalled();

    rerender({ animationDone: true, scanDone: true });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when scan completes first, then animation completes', () => {
    const onComplete = vi.fn();
    const { rerender } = renderHook(
      ({ animationDone, scanDone }) => useCompletionGate({ animationDone, scanDone, onComplete }),
      { initialProps: { animationDone: false, scanDone: true } }
    );

    expect(onComplete).not.toHaveBeenCalled();

    rerender({ animationDone: true, scanDone: true });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not call onComplete twice if already complete', () => {
    const onComplete = vi.fn();
    const { rerender } = renderHook(
      ({ animationDone, scanDone }) => useCompletionGate({ animationDone, scanDone, onComplete }),
      { initialProps: { animationDone: true, scanDone: true } }
    );

    expect(onComplete).toHaveBeenCalledOnce();

    // Re-render without changing dependencies
    rerender({ animationDone: true, scanDone: true });

    // Should still only be called once (not twice)
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
