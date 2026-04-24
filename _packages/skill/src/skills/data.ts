import type { SkillDef } from '../types.js'

export const dataSkills: SkillDef[] = [

  {
    name: 'pnl',
    category: 'data',
    description: 'Wallet PnL report — win rate, realized/unrealized gains, trading style classification, smart money score.',
    priceUSD: 1.00,
    endpoint: 'wallet-pnl',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to analyze (0x...)' },
        period:  { type: 'string', description: 'Time period: 7d | 30d | 90d | all (default: 30d)' },
      },
      required: ['address'],
    },
    buildBody: ({ address, period = '30d' }) => ({ address, period, chain: 'base' }),
  },

  {
    name: 'whale-tracker',
    category: 'data',
    description: 'Smart money flow analysis for any token — accumulation vs distribution signal, top wallet movements.',
    priceUSD: 0.10,
    endpoint: 'whale-tracker',
    inputSchema: {
      type: 'object',
      properties: {
        token:        { type: 'string', description: 'Token contract address or ticker symbol' },
        minAmountUSD: { type: 'string', description: 'Minimum whale transaction size in USD (default: 1000)' },
      },
      required: ['token'],
    },
    buildBody: ({ token, minAmountUSD = 1000 }) => ({ token, minAmountUSD: Number(minAmountUSD), chain: 'base' }),
  },

  {
    name: 'dex-flow',
    category: 'data',
    description: 'DEX buy/sell pressure and volume flow — live DexScreener data, buy/sell ratio, liquidity health.',
    priceUSD: 0.15,
    endpoint: 'dex-flow',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token address or ticker to analyze' },
      },
      required: ['token'],
    },
    buildBody: ({ token }) => ({ token, chain: 'base' }),
  },

  {
    name: 'airdrop-check',
    category: 'data',
    description: 'Base airdrop eligibility — which protocols qualify, on-chain activity score, estimated total airdrop value.',
    priceUSD: 0.10,
    endpoint: 'airdrop-check',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to check (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address, chain: 'base' }),
  },

  {
    name: 'alert-check',
    category: 'data',
    description: 'Check active alert triggers for any address — whale movements, circuit breaker signals, quantum exposure events.',
    priceUSD: 0.10,
    endpoint: 'alert-check',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet or token address to check alerts for (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address }),
  },
]
