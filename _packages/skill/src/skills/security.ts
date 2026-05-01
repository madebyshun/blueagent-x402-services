import type { SkillDef } from '../types.js'

export const securitySkills: SkillDef[] = [

  // ── AGENT SAFETY (8 tools) ────────────────────────────────────────────────

  {
    name: 'riskcheck',
    category: 'safety',
    description: 'Pre-transaction safety check — APPROVE / WARN / BLOCK decision with risk score. Call before EVERY onchain action.',
    priceUSD: 0.05,
    endpoint: 'risk-gate',
    inputSchema: {
      type: 'object',
      properties: {
        action:          { type: 'string', description: 'Describe the onchain action (e.g. "approve 0xABC to spend USDC")' },
        contractAddress: { type: 'string', description: 'Target contract address (optional)' },
        amount:          { type: 'string', description: 'Transaction amount in USD or tokens (optional)' },
        agentId:         { type: 'string', description: 'Your agent identifier for audit trail (optional)' },
      },
      required: ['action'],
    },
    buildBody: ({ action, contractAddress, amount, agentId }) => ({ action, contractAddress, amount, agentId }),
  },

  {
    name: 'honeypot-check',
    category: 'safety',
    description: 'Detect honeypot or rug pull token contracts before buying. Returns SAFE / SUSPICIOUS / HONEYPOT verdict with confidence score.',
    priceUSD: 0.05,
    endpoint: 'honeypot-check',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token contract address to check (0x...)' },
      },
      required: ['token'],
    },
    buildBody: ({ token }) => ({ token, chain: 'base' }),
  },

  {
    name: 'allowance-audit',
    category: 'safety',
    description: 'Audit dangerous ERC-20 token approvals for a wallet — find unlimited allowances and get revoke recommendations.',
    priceUSD: 0.20,
    endpoint: 'allowance-audit',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to audit (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address }),
  },

  {
    name: 'phishing-scan',
    category: 'safety',
    description: 'Scan URL, contract address, or social @handle for phishing and scam indicators before interacting.',
    priceUSD: 0.10,
    endpoint: 'phishing-scan',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'URL, contract address, or @handle to scan' },
      },
      required: ['target'],
    },
    buildBody: ({ target }) => ({ target }),
  },

  {
    name: 'mev-shield',
    category: 'safety',
    description: 'MEV sandwich attack risk before large swaps — sandwich probability, protection strategies, recommended slippage.',
    priceUSD: 0.30,
    endpoint: 'mev-shield',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Describe the swap (e.g. "swap 10 ETH to USDC on Uniswap v3")' },
        amount: { type: 'string', description: 'USD value of the swap (optional)' },
      },
      required: ['action'],
    },
    buildBody: ({ action, amount }) => ({ action, amount, chain: 'base' }),
  },

  {
    name: 'contract-trust',
    category: 'safety',
    description: 'Trust score for any contract — verified on Basescan, audited, proxy pattern, safe for agent interaction?',
    priceUSD: 0.25,
    endpoint: 'contract-trust',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Contract address to evaluate (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address, chain: 'base' }),
  },

  {
    name: 'aml-screen',
    category: 'safety',
    description: 'AML compliance screening for a wallet — transaction patterns, CLEAN / SUSPICIOUS / HIGH_RISK verdict.',
    priceUSD: 0.25,
    endpoint: 'aml-screen',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to screen (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address, chain: 'base' }),
  },

  {
    name: 'agent-payload-inspector',
    category: 'safety',
    description: 'Detect prompt injection attacks in any payload an AI agent is about to process — web scrapes, API responses, user messages, tool outputs. Returns SAFE / SUSPICIOUS / INJECTION with injection type classification.',
    priceUSD: 0.10,
    endpoint: 'agent-payload-inspector',
    inputSchema: {
      type: 'object',
      properties: {
        payload: { type: 'string', description: 'Text or JSON to inspect for injection attacks (max 50,000 chars)' },
        context: { type: 'string', description: 'What the agent is doing — improves detection accuracy (optional)' },
        agentId: { type: 'string', description: 'Agent identifier for audit trail (optional)' },
      },
      required: ['payload'],
    },
    buildBody: ({ payload, context, agentId }) => ({ payload, context, agentId }),
  },

  {
    name: 'circuit-breaker',
    category: 'safety',
    description: 'CONTINUE / PAUSE / HALT decision for autonomous agents. Call when consecutive losses or anomalies detected.',
    priceUSD: 0.50,
    endpoint: 'circuit-breaker',
    inputSchema: {
      type: 'object',
      properties: {
        agentId:           { type: 'string', description: 'Your agent identifier' },
        context:           { type: 'string', description: 'Situation description (e.g. "3 consecutive failed trades")' },
        recentLosses:      { type: 'string', description: 'Recent loss amount (e.g. "$340")' },
        consecutiveBlocks: { type: 'string', description: 'Number of consecutive failed actions' },
      },
    },
    buildBody: ({ agentId, context, recentLosses, consecutiveBlocks }) => ({
      agentId, context, recentLosses, consecutiveBlocks,
    }),
  },

  // ── QUANTUM SECURITY (5 tools) ────────────────────────────────────────────

  {
    name: 'quantum',
    category: 'quantum',
    description: 'Full quantum vulnerability report — public key exposure, threat level, migration urgency, step-by-step mitigation.',
    priceUSD: 1.50,
    endpoint: 'quantum-premium',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to scan (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address, chain: 'base' }),
  },

  {
    name: 'quantum-batch',
    category: 'quantum',
    description: 'Batch quantum scan for 1–10 wallets at $0.25 each — pay only for what you scan (up to $2.50).',
    priceUSD: 2.50,
    endpoint: 'quantum-batch',
    inputSchema: {
      type: 'object',
      properties: {
        addresses: { type: 'string', description: 'Comma-separated wallet addresses or JSON array (max 10)' },
      },
      required: ['addresses'],
    },
    buildBody: ({ addresses }) => ({
      addresses: Array.isArray(addresses) ? addresses : String(addresses).split(',').map((a: string) => a.trim()),
      chain: 'base',
    }),
  },

  {
    name: 'quantum-migrate',
    category: 'quantum',
    description: 'Step-by-step quantum-safe wallet migration plan — tools, timeline, cost estimate, urgency level.',
    priceUSD: 2.00,
    endpoint: 'quantum-migrate',
    inputSchema: {
      type: 'object',
      properties: {
        address:       { type: 'string', description: 'Wallet address to migrate (0x...)' },
        urgencyLevel:  { type: 'string', description: 'LOW | MEDIUM | HIGH | CRITICAL' },
      },
      required: ['address'],
    },
    buildBody: ({ address, urgencyLevel = 'MEDIUM' }) => ({ address, urgencyLevel, chain: 'base' }),
  },

  {
    name: 'quantum-timeline',
    category: 'quantum',
    description: 'Evidence-based quantum threat timeline 2026–2035 — when CRQC arrives, probability windows, what it means for wallets.',
    priceUSD: 0.40,
    endpoint: 'quantum-timeline',
    inputSchema: {
      type: 'object',
      properties: {
        concern: { type: 'string', description: 'Specific concern to address (optional)' },
      },
    },
    buildBody: ({ concern }) => ({ concern }),
  },

  {
    name: 'key-exposure',
    category: 'quantum',
    description: 'Check if a wallet\'s public key is exposed on-chain — the #1 quantum risk factor, detected via transaction history.',
    priceUSD: 0.50,
    endpoint: 'key-exposure',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to check (0x...)' },
      },
      required: ['address'],
    },
    buildBody: ({ address }) => ({ address, chain: 'base' }),
  },
]
