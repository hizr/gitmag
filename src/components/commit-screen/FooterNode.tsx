import { Text } from 'ink';
import { DEFAULT_KEYMAP } from '../../keymap/default-keymap.js';
import { keysHint } from '../../keymap/labels.js';
import { KEY_ACTION, type AppKeymap } from '../../keymap/types.js';

interface FooterNodeProps {
  readonly copyStatus: string | null;
  readonly matchCount: number;
  readonly focus: 'graph' | 'files';
  readonly isWorkingCommit: boolean;
  readonly keymap?: AppKeymap;
}

export function FooterNode({
  copyStatus,
  matchCount,
  focus,
  isWorkingCommit,
  keymap = DEFAULT_KEYMAP,
}: FooterNodeProps) {
  const keyHints = {
    searchNextPrev: keysHint([
      ...keymap.bindings[KEY_ACTION.searchNextMatch],
      ...keymap.bindings[KEY_ACTION.searchPrevMatch],
    ]),
    searchOpen: keysHint(keymap.bindings[KEY_ACTION.searchOpen]),
    searchClose: keysHint(keymap.bindings[KEY_ACTION.searchClose]),
    navigate: keysHint([
      ...keymap.bindings[KEY_ACTION.navigationUp],
      ...keymap.bindings[KEY_ACTION.navigationDown],
    ]),
    quit: keysHint(keymap.bindings[KEY_ACTION.quit]),
    select: keysHint(keymap.bindings[KEY_ACTION.select]),
    stageToggle: keysHint(keymap.bindings[KEY_ACTION.workingToggleStage]),
    copySha: keysHint(keymap.bindings[KEY_ACTION.clipboardCopySha]),
    pick: keysHint(keymap.bindings[KEY_ACTION.pick]),
    back: keysHint(keymap.bindings[KEY_ACTION.back]),
  };

  if (copyStatus) {
    return (
      <Text color="green" bold>
        {copyStatus}
      </Text>
    );
  }

  if (matchCount > 0) {
    return (
      <Text color="gray" dimColor>
        {keyHints.searchNextPrev} next/prev match ({matchCount} results) {keyHints.searchOpen} new
        search {keyHints.searchClose} clear {keyHints.navigate} navigate {keyHints.quit} quit
      </Text>
    );
  }

  const showStageHint = focus === 'files' && isWorkingCommit;

  return (
    <Text color="gray" dimColor>
      {keyHints.searchOpen} search {keyHints.navigate} navigate {keyHints.select} select/diff
      {showStageHint ? ` ${keyHints.stageToggle} stage/unstage` : ''} {keyHints.copySha} copy SHA{' '}
      {keyHints.pick} pick {keyHints.back} back {keyHints.quit} quit
    </Text>
  );
}
