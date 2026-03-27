import { describe, it, expect, vi } from 'vitest';
import {
  enterAlternativeScreen,
  exitAlternativeScreen,
  cursorHide,
  cursorShow,
} from 'ansi-escapes';
import {
  createTerminalController,
  selectRenderTarget,
  type TerminalStream,
} from '../../src/utils/terminal.js';

function createMockStream(isTTY: boolean): TerminalStream {
  return {
    isTTY,
    write: vi.fn(() => true),
  };
}

describe('terminal utils', () => {
  it('selectRenderTarget returns stdout when stdout is a TTY', () => {
    const stdout = createMockStream(true);
    const stderr = createMockStream(true);

    const target = selectRenderTarget(stdout, stderr);

    expect(target).toBe(stdout);
  });

  it('selectRenderTarget returns stderr when stdout is not a TTY', () => {
    const stdout = createMockStream(false);
    const stderr = createMockStream(true);

    const target = selectRenderTarget(stdout, stderr);

    expect(target).toBe(stderr);
  });

  it('selectRenderTarget uses fallback when stdout/stderr are non-interactive', () => {
    const stdout = createMockStream(false);
    const stderr = createMockStream(false);
    const fallback = createMockStream(true);

    const target = selectRenderTarget(stdout, stderr, fallback);

    expect(target).toBe(fallback);
  });

  it('enters and restores alternate screen for interactive target', () => {
    const target = createMockStream(true);
    const write = vi.mocked(target.write);
    const terminal = createTerminalController(target);

    expect(terminal.isInteractive).toBe(true);

    terminal.enter();
    terminal.restore();

    expect(write).toHaveBeenNthCalledWith(1, enterAlternativeScreen);
    expect(write).toHaveBeenNthCalledWith(2, cursorHide);
    expect(write).toHaveBeenNthCalledWith(3, cursorShow);
    expect(write).toHaveBeenNthCalledWith(4, exitAlternativeScreen);
  });

  it('does not write alternate screen escapes for non-interactive target', () => {
    const target = createMockStream(false);
    const write = vi.mocked(target.write);
    const terminal = createTerminalController(target);

    expect(terminal.isInteractive).toBe(false);

    terminal.enter();
    terminal.restore();

    expect(write).not.toHaveBeenCalled();
  });

  it('restores terminal only once when restore is called multiple times', () => {
    const target = createMockStream(true);
    const write = vi.mocked(target.write);
    const terminal = createTerminalController(target);

    terminal.enter();
    terminal.restore();
    terminal.restore();

    expect(write).toHaveBeenCalledTimes(4);
    expect(write).toHaveBeenNthCalledWith(3, cursorShow);
    expect(write).toHaveBeenNthCalledWith(4, exitAlternativeScreen);
  });

  it('uses interactive override when stream reports non-interactive', () => {
    const target = createMockStream(false);
    const write = vi.mocked(target.write);
    const terminal = createTerminalController(target, true);

    expect(terminal.isInteractive).toBe(true);

    terminal.enter();
    terminal.restore();

    expect(write).toHaveBeenCalledTimes(4);
    expect(write).toHaveBeenNthCalledWith(1, enterAlternativeScreen);
    expect(write).toHaveBeenNthCalledWith(2, cursorHide);
    expect(write).toHaveBeenNthCalledWith(3, cursorShow);
    expect(write).toHaveBeenNthCalledWith(4, exitAlternativeScreen);
  });
});
