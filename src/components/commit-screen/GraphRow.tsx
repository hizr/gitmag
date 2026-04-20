import { Box, Text } from 'ink';
import type { CommitEntry } from '../../data/mockRepos.js';

interface GraphRowProps {
  readonly prefix: string;
  readonly commit: CommitEntry;
  readonly selected: boolean;
  readonly maxWidth: number;
  readonly isMatchedResult?: boolean;
  readonly isActiveMatch?: boolean;
}

export function GraphRow({
  prefix,
  commit,
  selected,
  maxWidth,
  isMatchedResult,
  isActiveMatch,
}: GraphRowProps) {
  const HASH_W = 8; // 7 chars + 1 space
  const metaWidth = 22; // date (10) + gap (2) + author (truncated to 10)

  // Render ref badges
  const refBadges = commit.refs.map((ref) => `[${ref}]`);

  const badgeText = refBadges.length > 0 ? ' ' + refBadges.join(' ') : '';
  const badgeWidth = badgeText.length;
  const msgWidth = Math.max(maxWidth - prefix.length - HASH_W - metaWidth - badgeWidth - 2, 10);

  // Use diamond symbol for WORKING node
  const isWorking = commit.hash === '__WORKING__';
  const displayHash = isWorking ? 'WORK' : commit.hash.slice(0, 7);
  const hash = displayHash.padEnd(7);
  const message = commit.message.slice(0, msgWidth).padEnd(msgWidth);
  const author = commit.author.slice(0, 12).padEnd(12);
  let bg: 'bgBlue' | 'bgGreen' | undefined;
  if (selected) {
    bg = 'bgBlue';
  } else if (isActiveMatch) {
    bg = 'bgGreen';
  }

  let matchMarker: string;
  if (!isMatchedResult) {
    matchMarker = ' ';
  } else if (isActiveMatch) {
    matchMarker = '●';
  } else {
    matchMarker = '○';
  }

  // Override prefix for WORKING node to show diamond
  const displayPrefix = isWorking ? prefix.replace('●', '◆') : prefix;

  // Compute background color once
  let bgColor: 'green' | 'blue' | undefined;
  if (bg === 'bgGreen') {
    bgColor = 'green';
  } else if (bg !== undefined) {
    bgColor = 'blue';
  }

  return (
    <Box>
      <Text color="yellow" backgroundColor={bgColor}>
        {displayPrefix}
      </Text>
      <Text color="yellow" backgroundColor={bgColor}>
        {matchMarker}
        {hash}{' '}
      </Text>
      <Text bold={selected} backgroundColor={bgColor} color={selected ? 'white' : undefined}>
        {message}
      </Text>
      {/* Render ref badges with color-coding */}
      {commit.refs.map((ref: string, idx: number) => {
        let color: string;
        if (ref === 'HEAD') {
          color = 'cyan';
        } else if (ref.startsWith('origin/')) {
          color = 'yellow';
        } else if (ref.startsWith('refs/tags/') || /^v?\d+\.\d+/.test(ref)) {
          color = 'magenta';
        } else {
          color = 'green';
        }
        return (
          <Text key={idx} color={color} bold={ref === 'HEAD'} backgroundColor={bgColor}>
            {' ['}
            {ref}
            {']'}
          </Text>
        );
      })}
      <Text color="magenta" backgroundColor={bgColor}>
        {' '}
        {author}
      </Text>
      <Text color="gray" backgroundColor={bgColor}>
        {' '}
        {commit.date}
      </Text>
    </Box>
  );
}

interface GraphConnectorRowProps {
  readonly prefix: string;
}

/**
 * GraphConnectorRow renders a pure connector row with no commit node.
 * Used to show branch merging, opening, and closing in git log --graph style.
 * e.g. "│ \ " for a merge opening, "│ / " for a merge closing.
 */
export function GraphConnectorRow({ prefix }: GraphConnectorRowProps) {
  return (
    <Box>
      <Text color="yellow">{prefix}</Text>
    </Box>
  );
}
