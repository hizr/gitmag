import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_KEYMAP } from '../../src/keymap/default-keymap.js';
import { loadKeymap } from '../../src/keymap/loader.js';
import { KEY_ACTION } from '../../src/keymap/types.js';

describe('loadKeymap', () => {
  const cwdSpy = vi.spyOn(process, 'cwd');
  const tempDirs: string[] = [];

  const createTempRoot = async () => {
    const root = await mkdtemp(join(tmpdir(), 'gitmag-keymap-'));
    tempDirs.push(root);
    return root;
  };

  const writeJson = async (filePath: string, value: unknown) => {
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, JSON.stringify(value), 'utf8');
  };

  const writeRaw = async (filePath: string, value: string) => {
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, value, 'utf8');
  };

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    cwdSpy.mockReset();
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        await rm(dir, { recursive: true, force: true });
      }
    }
  });

  it('returns defaults when no keymap files exist', async () => {
    const root = await createTempRoot();
    const repoDir = join(root, 'repo');
    await mkdir(repoDir, { recursive: true });
    cwdSpy.mockReturnValue(repoDir);
    vi.stubEnv('XDG_CONFIG_HOME', join(root, 'xdg'));

    const keymap = await loadKeymap();

    expect(keymap).toEqual(DEFAULT_KEYMAP);
  });

  it('loads global overrides from XDG path', async () => {
    const root = await createTempRoot();
    const repoDir = join(root, 'repo');
    const xdgDir = join(root, 'xdg');
    await mkdir(repoDir, { recursive: true });
    cwdSpy.mockReturnValue(repoDir);
    vi.stubEnv('XDG_CONFIG_HOME', xdgDir);

    await writeJson(join(xdgDir, 'gitmag', 'keymap.json'), {
      bindings: {
        [KEY_ACTION.quit]: ['x'],
        [KEY_ACTION.navigationUp]: ['k'],
      },
    });

    const keymap = await loadKeymap();

    expect(keymap.bindings[KEY_ACTION.quit]).toEqual(['x']);
    expect(keymap.bindings[KEY_ACTION.navigationUp]).toEqual(['k']);
    expect(keymap.bindings[KEY_ACTION.pick]).toEqual(DEFAULT_KEYMAP.bindings[KEY_ACTION.pick]);
  });

  it('uses HOME fallback path when XDG is unset', async () => {
    const root = await createTempRoot();
    const repoDir = join(root, 'repo');
    const fakeHome = join(root, 'home');
    await mkdir(repoDir, { recursive: true });
    cwdSpy.mockReturnValue(repoDir);
    vi.stubEnv('XDG_CONFIG_HOME', '');
    vi.stubEnv('HOME', fakeHome);

    await writeJson(join(fakeHome, '.config', 'gitmag', 'keymap.json'), {
      bindings: {
        [KEY_ACTION.pick]: ['o'],
      },
    });

    const keymap = await loadKeymap();

    expect(keymap.bindings[KEY_ACTION.pick]).toEqual(['o']);
  });

  it('applies repo-local overrides on top of global overrides', async () => {
    const root = await createTempRoot();
    const repoDir = join(root, 'repo');
    const xdgDir = join(root, 'xdg');
    await mkdir(repoDir, { recursive: true });
    cwdSpy.mockReturnValue(repoDir);
    vi.stubEnv('XDG_CONFIG_HOME', xdgDir);

    await writeJson(join(xdgDir, 'gitmag', 'keymap.json'), {
      bindings: {
        [KEY_ACTION.quit]: ['x'],
        [KEY_ACTION.searchOpen]: ['?'],
      },
    });

    await writeJson(join(repoDir, '.gitmag', 'keymap.json'), {
      bindings: {
        [KEY_ACTION.quit]: ['z'],
      },
    });

    const keymap = await loadKeymap();

    expect(keymap.bindings[KEY_ACTION.quit]).toEqual(['z']);
    expect(keymap.bindings[KEY_ACTION.searchOpen]).toEqual(['?']);
  });

  it('ignores invalid files and sanitizes malformed token lists', async () => {
    const root = await createTempRoot();
    const repoDir = join(root, 'repo');
    const xdgDir = join(root, 'xdg');
    await mkdir(repoDir, { recursive: true });
    cwdSpy.mockReturnValue(repoDir);
    vi.stubEnv('XDG_CONFIG_HOME', xdgDir);

    await writeRaw(join(xdgDir, 'gitmag', 'keymap.json'), '{ invalid-json');
    await writeJson(join(repoDir, '.gitmag', 'keymap.json'), {
      bindings: {
        [KEY_ACTION.quit]: [123, '  ', 'x', ' y ', null],
        unknownAction: ['z'],
        [KEY_ACTION.pick]: 'p',
      },
    });

    const keymap = await loadKeymap();

    expect(keymap.bindings[KEY_ACTION.quit]).toEqual(['x', 'y']);
    expect(keymap.bindings[KEY_ACTION.pick]).toEqual(DEFAULT_KEYMAP.bindings[KEY_ACTION.pick]);
    expect(keymap.bindings[KEY_ACTION.searchOpen]).toEqual(
      DEFAULT_KEYMAP.bindings[KEY_ACTION.searchOpen]
    );
  });
});
