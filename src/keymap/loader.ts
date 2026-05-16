import { access, readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DEFAULT_KEYMAP } from './default-keymap.js';
import { KEY_ACTIONS, type AppKeymap, type KeyActionId } from './types.js';

interface PartialKeymap {
  readonly bindings?: Partial<Record<KeyActionId, readonly string[]>>;
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

async function readJsonIfExists(path: string): Promise<unknown | null> {
  try {
    await access(path, fsConstants.R_OK);
    const content = await readFile(path, 'utf8');
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function mergeBindings(base: AppKeymap, override: PartialKeymap | null): AppKeymap {
  const merged: Record<KeyActionId, readonly string[]> = { ...base.bindings };
  if (!override?.bindings) {
    return { bindings: merged };
  }

  for (const action of KEY_ACTIONS) {
    const candidate = override.bindings[action];
    if (!candidate) continue;
    if (!Array.isArray(candidate)) continue;
    const clean = candidate
      .filter((token): token is string => typeof token === 'string' && token.trim().length > 0)
      .map((token) => token.trim());

    if (clean.length > 0) {
      merged[action] = clean;
    }
  }

  return { bindings: merged };
}

function toPartialKeymap(value: unknown): PartialKeymap | null {
  if (!isObjectRecord(value)) return null;
  if (!('bindings' in value)) return null;
  const bindings = value.bindings;
  if (!isObjectRecord(bindings)) return null;

  const typedBindings: Partial<Record<KeyActionId, readonly string[]>> = {};
  for (const action of KEY_ACTIONS) {
    const tokenList = bindings[action];
    if (Array.isArray(tokenList)) {
      typedBindings[action] = tokenList.filter(
        (token): token is string => typeof token === 'string'
      );
    }
  }

  return { bindings: typedBindings };
}

function getGlobalKeymapPath(): string {
  const xdgConfigHome = process.env['XDG_CONFIG_HOME'];
  if (xdgConfigHome && xdgConfigHome.length > 0) {
    return join(xdgConfigHome, 'gitmag', 'keymap.json');
  }
  return join(homedir(), '.config', 'gitmag', 'keymap.json');
}

function getRepoKeymapPath(): string {
  return join(process.cwd(), '.gitmag', 'keymap.json');
}

export async function loadKeymap(): Promise<AppKeymap> {
  const globalRaw = await readJsonIfExists(getGlobalKeymapPath());
  const repoRaw = await readJsonIfExists(getRepoKeymapPath());

  const globalPartial = toPartialKeymap(globalRaw);
  const repoPartial = toPartialKeymap(repoRaw);

  const withGlobal = mergeBindings(DEFAULT_KEYMAP, globalPartial);
  return mergeBindings(withGlobal, repoPartial);
}
