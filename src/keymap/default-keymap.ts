import { KEY_ACTION, type AppKeymap } from './types.js';

export const DEFAULT_KEYMAP: AppKeymap = {
  bindings: {
    [KEY_ACTION.quit]: ['q'],
    [KEY_ACTION.pick]: ['p'],
    [KEY_ACTION.searchOpen]: ['/'],
    [KEY_ACTION.searchClose]: ['esc'],
    [KEY_ACTION.searchNextMatch]: ['n'],
    [KEY_ACTION.searchPrevMatch]: ['m'],
    [KEY_ACTION.searchClearMatches]: ['esc'],
    [KEY_ACTION.searchDeleteChar]: ['backspace', 'delete'],
    [KEY_ACTION.focusCycle]: ['tab'],
    [KEY_ACTION.clipboardCopySha]: ['c'],
    [KEY_ACTION.workingToggleStage]: ['+', 'space'],
    [KEY_ACTION.navigationUp]: ['up'],
    [KEY_ACTION.navigationDown]: ['down'],
    [KEY_ACTION.back]: ['backspace', 'delete'],
    [KEY_ACTION.select]: ['enter'],
    [KEY_ACTION.diffToggleLineNumbers]: ['l'],
  },
};
