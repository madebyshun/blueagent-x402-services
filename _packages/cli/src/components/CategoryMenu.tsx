import React from 'react'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'

export type Category = 'security' | 'research' | 'data' | 'earn'

export const CATEGORY_COLOR: Record<Category, string> = {
  security: '#F87171',
  research: '#60A5FA',
  data:     '#34D399',
  earn:     '#FBBF24',
}

const ITEMS = [
  { label: '  Security   13 tools   agent safety, quantum, AML', value: 'security' as Category },
  { label: '  Research    9 tools   due diligence, grants, x402 audit', value: 'research' as Category },
  { label: '  Data        4 tools   PnL, whale flow, DEX pressure', value: 'data' as Category },
  { label: '  Earn        4 tools   yield, airdrop, LP, tax', value: 'earn' as Category },
]

const DOT: Record<Category, string> = {
  security: '●',
  research: '●',
  data:     '●',
  earn:     '●',
}

interface Props {
  onSelect: (category: Category) => void
}

function CategoryItem({ category, label }: { category: Category; label: string }) {
  return (
    <Box>
      <Text color={CATEGORY_COLOR[category]} bold>{DOT[category]} </Text>
      <Text>{label.trim()}</Text>
    </Box>
  )
}

export function CategoryMenu({ onSelect }: Props) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="#374151">{'─'.repeat(52)}</Text>
      </Box>
      <SelectInput
        items={ITEMS}
        onSelect={(item) => onSelect(item.value)}
        itemComponent={({ isSelected, label, ...rest }) => {
          const value = (rest as any).value as Category
          return (
          <Box>
            <Text color={isSelected ? CATEGORY_COLOR[value] : '#9CA3AF'} bold={isSelected}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text color={isSelected ? CATEGORY_COLOR[value] : '#9CA3AF'} bold={isSelected}>
              {label.trim()}
            </Text>
          </Box>
        )}}
      />
      <Box marginTop={1}>
        <Text color="#374151">{'─'.repeat(52)}</Text>
      </Box>
      <Box marginTop={0}>
        <Text color="#4B5563">  ctrl+c quit  ·  ↑↓ navigate  ·  enter select</Text>
      </Box>
    </Box>
  )
}
