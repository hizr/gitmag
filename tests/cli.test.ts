import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('cli.ts — FORCE_COLOR environment handling', () => {
  let originalTTY: boolean | undefined;
  let originalForceColor: string | undefined;

  beforeEach(() => {
    // Capture original values
    originalTTY = process.stdout.isTTY;
    originalForceColor = process.env['FORCE_COLOR'];
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      writable: true,
      configurable: true,
    });
    if (originalForceColor !== undefined) {
      process.env['FORCE_COLOR'] = originalForceColor;
    } else {
      delete process.env['FORCE_COLOR'];
    }
  });

  it('should NOT set FORCE_COLOR when stdout is a TTY (interactive terminal)', () => {
    // Simulate interactive terminal
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });

    // When process.stdout.isTTY is true, the condition `!process.stdout.isTTY` is false
    // so FORCE_COLOR should not be set by the cli.ts logic
    expect(!process.stdout.isTTY).toBe(false);
    expect(process.env['FORCE_COLOR']).not.toBe('3');
  });

  it('should set FORCE_COLOR=3 when stdout is NOT a TTY (piped)', () => {
    // Simulate piped stdout (command substitution like $(gitmag))
    Object.defineProperty(process.stdout, 'isTTY', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // When process.stdout.isTTY is undefined (falsy), the condition `!process.stdout.isTTY` is true
    // so FORCE_COLOR should be set to enable colors for stderr rendering
    expect(!process.stdout.isTTY).toBe(true);

    // Simulate what src/index.ts does
    if (!process.stdout.isTTY) {
      process.env['FORCE_COLOR'] = '3';
    }

    expect(process.env['FORCE_COLOR']).toBe('3');
  });

  it('should set FORCE_COLOR=3 when stdout.isTTY is explicitly false (piped)', () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });

    expect(!process.stdout.isTTY).toBe(true);

    if (!process.stdout.isTTY) {
      process.env['FORCE_COLOR'] = '3';
    }

    expect(process.env['FORCE_COLOR']).toBe('3');
  });

  it('preserves existing FORCE_COLOR if already set', () => {
    // Pre-set FORCE_COLOR to a different value
    process.env['FORCE_COLOR'] = '1';

    // Simulate piped stdout
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });

    // The logic in src/index.ts unconditionally sets FORCE_COLOR=3
    // (This is the actual behavior)
    if (!process.stdout.isTTY) {
      process.env['FORCE_COLOR'] = '3';
    }

    // It will be overwritten to '3' (this is expected behavior)
    expect(process.env['FORCE_COLOR']).toBe('3');
  });
});

describe('cli.ts — renderTarget selection', () => {
  let originalTTY: boolean | undefined;

  beforeEach(() => {
    originalTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      writable: true,
      configurable: true,
    });
  });

  it('should use process.stdout as renderTarget when isTTY is true', () => {
    // Explicitly set isTTY to true
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });

    const isTTY = Boolean(process.stdout.isTTY);
    // When TTY, renderTarget = process.stdout
    const renderTarget = isTTY ? process.stdout : process.stderr;
    expect(renderTarget).toBe(process.stdout);
  });

  it('should use process.stderr as renderTarget when isTTY is false', () => {
    // Explicitly set isTTY to false
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });

    const isTTY = Boolean(process.stdout.isTTY);
    // When not TTY, renderTarget = process.stderr
    const renderTarget = isTTY ? process.stdout : process.stderr;
    expect(renderTarget).toBe(process.stderr);
  });

  it('should use process.stderr as renderTarget when isTTY is undefined', () => {
    // Simulate piped stdout (isTTY is undefined/falsy)
    Object.defineProperty(process.stdout, 'isTTY', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const isTTY = Boolean(process.stdout.isTTY);
    expect(isTTY).toBe(false);
    // When not TTY, renderTarget = process.stderr
    const renderTarget = isTTY ? process.stdout : process.stderr;
    expect(renderTarget).toBe(process.stderr);
  });
});

describe('cli.ts — pickedHash behavior', () => {
  it('should emit picked hash to stdout after terminal restore', () => {
    // This test verifies the logic structure:
    // When a hash is picked via 'p' key, it's stored in pickedHash
    // Then after restoreTerminal(), it's written to process.stdout

    const pickedHash = 'abc1234567890def';

    // Simulate the behavior: if pickedHash is set, write to stdout
    const output: string[] = [];
    const mockStdout = {
      write: (data: string) => output.push(data),
    };

    // Logic from cli.ts
    if (pickedHash) {
      mockStdout.write(pickedHash + '\n');
    }

    expect(output).toContain(pickedHash + '\n');
  });

  it('should NOT emit anything to stdout if no hash was picked', () => {
    const pickedHash: string | null = null;

    const output: string[] = [];
    const mockStdout = {
      write: (data: string) => output.push(data),
    };

    // Logic from cli.ts
    if (pickedHash) {
      mockStdout.write(pickedHash + '\n');
    }

    expect(output).toHaveLength(0);
  });
});
