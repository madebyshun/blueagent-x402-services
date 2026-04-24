import type { SkillDef } from '../types.js'

export const earnSkills: SkillDef[] = [

  {
    name: 'yield-optimizer',
    category: 'earn',
    description: 'Best APY opportunities on Base DeFi — live DeFiLlama data, risk-adjusted recommendations, protocol safety scores.',
    priceUSD: 0.15,
    endpoint: 'yield-optimizer',
    inputSchema: {
      type: 'object',
      properties: {
        token:         { type: 'string', description: 'Token to deploy (e.g. "USDC", "ETH", "cbBTC")' },
        minAPY:        { type: 'string', description: 'Minimum acceptable APY % (optional)' },
        riskTolerance: { type: 'string', description: 'LOW | MEDIUM | HIGH (default: MEDIUM)' },
      },
    },
    buildBody: ({ token, minAPY, riskTolerance = 'MEDIUM' }) => ({
      token: token ?? 'USDC',
      minAPY: minAPY ? Number(minAPY) : undefined,
      riskTolerance,
      chain: 'base',
    }),
  },

  {
    name: 'lp-analyzer',
    category: 'earn',
    description: 'LP position analysis — impermanent loss estimate, fee income, net PnL, HOLD / REBALANCE / EXIT signal.',
    priceUSD: 0.25,
    endpoint: 'lp-analyzer',
    inputSchema: {
      type: 'object',
      properties: {
        positionId:     { type: 'string', description: 'Uniswap v3 LP NFT position ID (optional)' },
        pool:           { type: 'string', description: 'Pool contract address (optional)' },
        token0:         { type: 'string', description: 'First token symbol or address (optional)' },
        token1:         { type: 'string', description: 'Second token symbol or address (optional)' },
        entryPrice:     { type: 'string', description: 'Price when position was opened (optional)' },
        investedAmount: { type: 'string', description: 'Total USD invested (optional)' },
      },
    },
    buildBody: ({ positionId, pool, token0, token1, entryPrice, investedAmount }) => ({
      positionId, pool, token0, token1, entryPrice, investedAmount,
    }),
  },

  {
    name: 'tax-report',
    category: 'earn',
    description: 'On-chain tax summary for Base wallet — realized gains, taxable events, cost basis, P&L breakdown by category.',
    priceUSD: 2.00,
    endpoint: 'tax-report',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address (0x...)' },
        year:    { type: 'string', description: 'Tax year (default: current year)' },
        country: { type: 'string', description: 'Country for tax rules (default: US)' },
      },
      required: ['address'],
    },
    buildBody: ({ address, year, country = 'US' }) => ({
      address,
      year: year ? Number(year) : new Date().getFullYear(),
      country,
    }),
  },

  {
    name: 'alert-subscribe',
    category: 'earn',
    description: 'Subscribe to real-time BlueAgent alerts via webhook — whale movements, circuit breaker events, quantum exposure.',
    priceUSD: 0.50,
    endpoint: 'alert-subscribe',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'HTTPS webhook URL to receive alerts' },
        topics: {
          type: 'string',
          description: 'Comma-separated alert topics: whale_movement, circuit_breaker, quantum_exposure, honeypot_detected, rug_risk',
        },
        addresses: {
          type: 'string',
          description: 'Comma-separated addresses to watch (optional — leave empty for global alerts)',
        },
      },
      required: ['webhookUrl', 'topics'],
    },
    buildBody: ({ webhookUrl, topics, addresses }) => ({
      webhookUrl,
      topics: Array.isArray(topics) ? topics : String(topics).split(',').map((t: string) => t.trim()),
      addresses: addresses
        ? (Array.isArray(addresses) ? addresses : String(addresses).split(',').map((a: string) => a.trim()))
        : [],
    }),
  },
]
