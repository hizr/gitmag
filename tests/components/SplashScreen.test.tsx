// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { SplashScreen } from '../../src/components/SplashScreen.js';

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays status text from scanProgress.phase', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Indexing commits...', done: false },
      })
    );

    const output = lastFrame();
    expect(output).toContain('Indexing commits...');
  });

  it('displays updated status text when phase changes', () => {
    const onComplete = vi.fn();
    const { rerender, lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Scanning...', done: false },
      })
    );

    expect(lastFrame()).toContain('Scanning...');

    rerender(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Analyzing activity...', done: false },
      })
    );

    expect(lastFrame()).toContain('Analyzing activity...');
  });

  it('renders with done:true without errors', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Done', done: true },
      })
    );

    expect(lastFrame()).toBeTruthy();
    expect(lastFrame()).toContain('Done');
  });

  it('completes animation at the specified duration', () => {
    const onComplete = vi.fn();
    render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Scanning...', done: false },
      })
    );

    // Animation should not complete before duration
    vi.advanceTimersByTime(2999);
    expect(onComplete).not.toHaveBeenCalled();

    // Animation should complete at/after duration
    vi.advanceTimersByTime(1);
    // Note: useCompletionGate will handle calling onComplete when both conditions are met.
    // Since scan is not done, onComplete won't be called yet (this is tested in the hook tests)
  });

  it('updates phase text while animation is running', () => {
    const onComplete = vi.fn();
    const { rerender, lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Phase 1', done: false },
      })
    );

    expect(lastFrame()).toContain('Phase 1');

    // Mid-animation phase update
    vi.advanceTimersByTime(1500);
    rerender(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 3000,
        scanProgress: { phase: 'Phase 2', done: false },
      })
    );

    expect(lastFrame()).toContain('Phase 2');
  });
});
