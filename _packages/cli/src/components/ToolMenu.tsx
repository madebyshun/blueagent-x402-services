import React from 'react'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import type { Category } from './CategoryMenu.js'
import { CATEGORY_COLOR } from './CategoryMenu.js'

const TOOLS: Record<Category, Array<{ label: string; value: string; params: string[]; price: string }>> = {
  security: [
    { label: 'risk-gate         Pre-tx safety (APPROVE/WARN/BLOCK)', value: 'risk-gate', params: ['action', 'contractAddress?', 'amount?'], price: '$0.05' },
    { label: 'honeypot-check    Detect honeypot tokens', value: 'honeypot-check', params: ['token'], price: '$0.05' },
    { label: 'allowance-audit   Find dangerous token approvals', value: 'allowance-audit', params: ['address'], price: '$0.20' },
    { label: 'phishing-scan     Scan URL/address for phishing', value: 'phishing-scan', params: ['target'], price: '$0.10' },
    { label: 'mev-shield        MEV sandwich risk before swap', value: 'mev-shield', params: ['action'], price: '$0.30' },
    { label: 'contract-trust    Trust score for any contract', value: 'contract-trust', params: ['address'], price: '$0.25' },
    { label: 'aml-screen        AML compliance screening', value: 'aml-screen', params: ['address'], price: '$0.25' },
    { label: 'payload-inspector  Detect prompt injection in payloads', value: 'agent-payload-inspector', params: ['payload', 'context?'], price: '$0.10' },
    { label: 'circuit-breaker   CONTINUE/PAUSE/HALT for agents', value: 'circuit-breaker', params: ['context?', 'recentLosses?'], price: '$0.50' },
    { label: 'quantum-premium   Full quantum vulnerability report', value: 'quantum-premium', params: ['address'], price: '$1.50' },
    { label: 'key-exposure      Check if public key exposed on-chain', value: 'key-exposure', params: ['address'], price: '$0.50' },
    { label: 'quantum-migrate   Quantum-safe migration plan', value: 'quantum-migrate', params: ['address'], price: '$2.00' },
    { label: 'quantum-timeline  Evidence-based quantum threat timeline', value: 'quantum-timeline', params: ['address?'], price: '$0.40' },
  ],
  research: [
    { label: 'deep-analysis     Deep token due diligence', value: 'deep-analysis', params: ['projectName'], price: '$0.35' },
    { label: 'tokenomics-score  Supply/inflation/unlock analysis', value: 'tokenomics-score', params: ['token'], price: '$0.50' },
    { label: 'whitepaper-tldr   Summarize whitepaper into 5 bullets', value: 'whitepaper-tldr', params: ['url'], price: '$0.20' },
    { label: 'narrative-pulse   Trending narratives in Base ecosystem', value: 'narrative-pulse', params: ['query'], price: '$0.40' },
    { label: 'vc-tracker        VC investment activity & thesis', value: 'vc-tracker', params: ['query'], price: '$1.00' },
    { label: 'launch-advisor    Full token launch playbook', value: 'launch-advisor', params: ['description'], price: '$3.00' },
    { label: 'grant-evaluator   Base ecosystem grant scoring', value: 'grant-evaluator', params: ['description'], price: '$5.00' },
    { label: 'x402-readiness    Audit API for x402 readiness', value: 'x402-readiness', params: ['url?', 'description?'], price: '$1.00' },
    { label: 'base-deploy-check Pre-deployment security check', value: 'base-deploy-check', params: ['contractCode?', 'description?'], price: '$0.50' },
  ],
  data: [
    { label: 'wallet-pnl        Wallet PnL report', value: 'wallet-pnl', params: ['address', 'period?'], price: '$1.00' },
    { label: 'whale-tracker     Smart money flow analysis', value: 'whale-tracker', params: ['token'], price: '$0.10' },
    { label: 'dex-flow          DEX buy/sell pressure', value: 'dex-flow', params: ['token'], price: '$0.15' },
    { label: 'airdrop-check     Base airdrop eligibility', value: 'airdrop-check', params: ['address'], price: '$0.10' },
  ],
  earn: [
    { label: 'yield-optimizer   Best APY on Base DeFi', value: 'yield-optimizer', params: ['token?'], price: '$0.15' },
    { label: 'lp-analyzer       LP position analysis', value: 'lp-analyzer', params: ['address'], price: '$0.25' },
    { label: 'tax-report        On-chain tax summary', value: 'tax-report', params: ['address', 'year?'], price: '$2.00' },
    { label: 'alert-subscribe   Subscribe to whale/circuit alerts', value: 'alert-subscribe', params: ['address', 'webhook'], price: '$0.50' },
  ],
}

interface Props {
  category: Category
  onSelect: (tool: string, params: string[]) => void
  onBack: () => void
}

export function ToolMenu({ category, onSelect, onBack }: Props) {
  useInput((_, key) => { if (key.escape) onBack() })
  const tools = TOOLS[category]
  const color = CATEGORY_COLOR[category]

  const items = tools.map(t => ({ label: t.label, value: t.value, price: t.price }))

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={color} bold>● {category.toUpperCase()} </Text>
        <Text color="#6B7280">— {tools.length} tools  ·  esc to go back</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="#374151">{'─'.repeat(52)}</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) => {
          const tool = tools.find(t => t.value === item.value)!
          onSelect(item.value, tool.params)
        }}
        itemComponent={({ isSelected, label, ...itemRest }) => {
          const value = (itemRest as any).value as string
          const tool = tools.find(t => t.value === value)!
          const parts = label.split('  ')
          const name = parts[0]
          const desc = parts.slice(1).join('  ')
          return (
            <Box>
              <Text color={isSelected ? color : '#6B7280'} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}
              </Text>
              <Text color={isSelected ? '#F9FAFB' : '#9CA3AF'} bold={isSelected}>
                {name}
              </Text>
              <Text color={isSelected ? '#6B7280' : '#4B5563'}>
                {'  ' + desc}
              </Text>
              <Text color={isSelected ? color : '#4B5563'}>
                {'  ' + tool.price}
              </Text>
            </Box>
          )
        }}
      />
      <Box marginTop={1}>
        <Text color="#374151">{'─'.repeat(52)}</Text>
      </Box>
      <Text color="#4B5563">  ↑↓ navigate  ·  enter select  ·  esc back</Text>
    </Box>
  )
}
