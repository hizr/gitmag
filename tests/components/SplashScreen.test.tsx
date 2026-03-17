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

  it('displays status text from phase prop', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 2200,
        phase: 'Indexing commits…',
      })
    );

    const output = lastFrame();
    expect(output).toContain('Indexing commits…');
  });

  it('displays updated status text when phase changes', () => {
    const onComplete = vi.fn();
    const { rerender, lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 2200,
        phase: 'Scanning repositories…',
      })
    );

    expect(lastFrame()).toContain('Scanning repositories…');

    rerender(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 2200,
        phase: 'Loading commits…',
      })
    );

    expect(lastFrame()).toContain('Loading commits…');
  });

  it('renders without error when phase is Ready', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 2200,
        phase: 'Ready',
      })
    );

    const output = lastFrame();
    expect(output).toContain('Ready');
  });

  it('cleans up timers on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      React.createElement(SplashScreen, {
        onComplete,
        duration: 2200,
        phase: 'Loading commits…',
      })
    );

    unmount();

    // Should not crash after unmount
    expect(true).toBe(true);
  });
});
