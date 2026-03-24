import { type ReactNode } from 'react';
import { Box, Text } from 'ink';

interface PanelProps {
  readonly label: string;
  readonly focused?: boolean;
  readonly width: number;
  readonly height: number;
  readonly children: ReactNode;
}

function Panel({ label, focused = false, width, height, children }: PanelProps) {
  const borderColor = focused ? 'cyan' : 'gray';
  const innerWidth = Math.max(width - 4, 1);
  const innerHeight = Math.max(height - 2, 1);

  const topBar = '━'.repeat(Math.max(innerWidth - label.length - 2, 0));
  const top = `┏━ ${label} ${topBar}┓`;
  const bottom = `┗━${'━'.repeat(innerWidth)}┛`;

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Text color={borderColor}>{top}</Text>
      <Box flexDirection="row" height={innerHeight}>
        <Text color={borderColor}> </Text>
        <Box flexDirection="column" width={innerWidth} overflow="hidden">
          {children}
        </Box>
        <Text color={borderColor}> </Text>
      </Box>
      <Text color={borderColor}>{bottom}</Text>
    </Box>
  );
}

export { Panel, type PanelProps };
