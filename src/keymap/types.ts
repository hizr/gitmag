export type KeyActionId =
  | 'quit'
  | 'pick'
  | 'search.open'
  | 'search.close'
  | 'search.nextMatch'
  | 'search.prevMatch'
  | 'search.clearMatches'
  | 'search.deleteChar'
  | 'focus.cycle'
  | 'clipboard.copySha'
  | 'working.toggleStage'
  | 'navigation.up'
  | 'navigation.down'
  | 'back'
  | 'select'
  | 'diff.toggleLineNumbers';

export const KEY_ACTION = {
  quit: 'quit',
  pick: 'pick',
  searchOpen: 'search.open',
  searchClose: 'search.close',
  searchNextMatch: 'search.nextMatch',
  searchPrevMatch: 'search.prevMatch',
  searchClearMatches: 'search.clearMatches',
  searchDeleteChar: 'search.deleteChar',
  focusCycle: 'focus.cycle',
  clipboardCopySha: 'clipboard.copySha',
  workingToggleStage: 'working.toggleStage',
  navigationUp: 'navigation.up',
  navigationDown: 'navigation.down',
  back: 'back',
  select: 'select',
  diffToggleLineNumbers: 'diff.toggleLineNumbers',
} as const satisfies Record<string, KeyActionId>;

export interface AppKeymap {
  readonly bindings: Record<KeyActionId, readonly string[]>;
}

export const KEY_ACTIONS: readonly KeyActionId[] = Object.values(KEY_ACTION);
