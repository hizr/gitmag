const TOKEN_LABEL: Record<string, string> = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  enter: 'enter',
  return: 'enter',
  escape: 'ESC',
  esc: 'ESC',
  backspace: 'bksp',
  delete: 'del',
  tab: 'tab',
  space: 'space',
};

function keyTokenLabel(token: string): string {
  return TOKEN_LABEL[token] ?? token;
}

export function keysHint(tokens: readonly string[]): string {
  return `[${tokens.map((token) => keyTokenLabel(token)).join('/')}]`;
}
