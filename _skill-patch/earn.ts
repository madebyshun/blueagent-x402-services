import type { SkillDef } from '../types.js'

export const earnSkills: SkillDef[] = [
  {
    name: 'yield-optimizer',
    category: 'earn',
    description: 'Best APY opportunities on Base DeFi — live DeFiLlama data, risk-adjusted recommendations, protocol safety.',
    priceUSD: 0.15,
    endpoint: 'yield-optimizer',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token to deploy (e.g. "USDC", "ETH", "cbBTC")' },
        minAPY: { type: 'number', description: 'Minimum acceptable APY % (optional)' },
        riskTolerance: { type: 'string', description: 'LOW | MEDIUM | HIGH (default: MEDIUM)' },
      },
    },
    buildBody: ({ token, minAPY, riskTolerance = 'MEDIUM' }) => ({
      token: token ?? 'USDC',
      minAPY,
      riskTolerance,
      chain: 'base',
    }),
  },
  {
    name: 'lp-analyzer',
    category: 'earn',
    description: 'LP position analysis — impermanent loss estimate, fee income, net PnL, rebalance recommendation.',
    priceUSD: 0.25,
    endpoint: 'lp-analyzer',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address holding LP positions (0x...)' },
        poolAddress: { type: 'string', description: 'Specific pool address to analyze (optional)' },
      },
      required: ['address'],
    },
    buildBody: ({ address, poolAddress }) => ({ address, poolAddress, chain: 'base' }),
  },
  {
    name: 'tax-report',
    category: 'earn',
    description: 'On-chain tax summary — realized gains, taxable events, cost basis, export-ready P&L for Base wallet.',
    priceUSD: 2.00,
    endpoint: 'tax-report',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address (0x...)' },
        year: { type: 'number', description: 'Tax year (default: current year)' },
        country: { type: 'string', description: 'Country for tax rules (default: US)' },
      },
      required: ['address'],
    },
    buildBody: ({ address, year = new Date().getFullYear(), country = 'US' }) => ({
      address,
      year,
      country,
      chain: 'base',
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
