import {
  enterAlternativeScreen,
  exitAlternativeScreen,
  cursorHide,
  cursorShow,
} from 'ansi-escapes';

export interface TerminalStream {
  readonly isTTY?: boolean;
  write: (chunk: string) => unknown;
}

export function selectRenderTarget(
  stdout: TerminalStream,
  stderr: TerminalStream,
  fallback?: TerminalStream | null
): TerminalStream {
  if (stdout.isTTY) {
    return stdout;
  }

  if (fallback?.isTTY) {
    return fallback;
  }

  if (stderr.isTTY) {
    return stderr;
  }

  return fallback ?? stderr;
}

export function createTerminalController(
  target: TerminalStream,
  interactiveOverride?: boolean
): {
  readonly isInteractive: boolean;
  enter: () => void;
  restore: () => void;
} {
  const isInteractive = interactiveOverride ?? Boolean(target.isTTY);
  let restored = false;

  const enter = (): void => {
    if (!isInteractive) {
      return;
    }

    target.write(enterAlternativeScreen);
    target.write(cursorHide);
  };

  const restore = (): void => {
    if (!isInteractive || restored) {
      return;
    }

    restored = true;
    target.write(cursorShow);
    target.write(exitAlternativeScreen);
  };

  return { isInteractive, enter, restore };
}
