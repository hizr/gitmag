import { Box, Text } from 'ink';

type BreadcrumbItem = string;

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <Box marginBottom={1}>
      {items.map((item, i) => (
        <Box key={i}>
          {i > 0 && <Text dimColor>{' › '}</Text>}
          <Text color={i === items.length - 1 ? 'white' : 'gray'}>{item}</Text>
        </Box>
      ))}
    </Box>
  );
}
