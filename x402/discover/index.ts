// Free discovery endpoint — no x402 payment required.
// Agents call GET /discover to learn all available BlueAgent tools, prices, and schemas.

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'

const SERVICES = {
  // ── AGENT SAFETY ──
  'risk-gate':       { price: '$0.05', category: 'safety',   description: 'Pre-transaction safety check — APPROVE / WARN / BLOCK', input: { action: 'string (required)', contractAddress: 'string', amount: 'string' } },
  'honeypot-check':  { price: '$0.05', category: 'safety',   description: 'Detect honeypot or rug pull contracts — SAFE / SUSPICIOUS / HONEYPOT', input: { token: 'string (required, contract address)' } },
  'allowance-audit': { price: '$0.20', category: 'safety',   description: 'Find unlimited token approvals to revoke', input: { address: 'string (required, wallet)' } },
  'phishing-scan':   { price: '$0.10', category: 'safety',   description: 'Scan URL, address, or @handle for phishing', input: { target: 'string (required)' } },
  'mev-shield':      { price: '$0.30', category: 'safety',   description: 'MEV sandwich attack risk before large swaps', input: { action: 'string (required)', amount: 'string' } },
  'contract-trust':  { price: '$0.25', category: 'safety',   description: 'Trust score for any contract — verified, audited, safe?', input: { address: 'string (required)' } },
  'aml-screen':      { price: '$0.25', category: 'safety',   description: 'AML compliance — CLEAN / SUSPICIOUS / HIGH_RISK', input: { address: 'string (required, wallet)' } },
  'circuit-breaker': { price: '$0.50', category: 'safety',   description: 'CONTINUE / PAUSE / HALT for autonomous agents and ZHC', input: { agentId: 'string', context: 'string', recentLosses: 'string' } },

  // ── QUANTUM SECURITY ──
  'quantum-premium': { price: '$1.50', category: 'quantum',  description: 'Full quantum vulnerability report — exposure, threat level, migration steps', input: { address: 'string (required)' } },
  'quantum-batch':   { price: '$2.50', category: 'quantum',  description: 'Scan 1–10 wallets at $0.25 each (upto pricing)', input: { addresses: 'string[] (required, max 10)' } },
  'quantum-migrate': { price: '$2.00', category: 'quantum',  description: 'Step-by-step quantum-safe migration plan', input: { address: 'string (required)', urgencyLevel: 'LOW|MEDIUM|HIGH|CRITICAL' } },
  'quantum-timeline':{ price: '$0.40', category: 'quantum',  description: 'Evidence-based quantum threat timeline 2026–2035', input: { concern: 'string' } },
  'key-exposure':    { price: '$0.50', category: 'quantum',  description: 'Check if wallet public key is exposed on-chain', input: { address: 'string (required)' } },

  // ── RESEARCH ──
  'deep-analysis':     { price: '$0.35', category: 'research', description: 'Deep due diligence — risk score, rug probability, recommendation', input: { projectName: 'string (required, ticker or address)' } },
  'tokenomics-score':  { price: '$0.50', category: 'research', description: 'Supply, inflation, unlock cliff — sustainability score', input: { token: 'string (required)' } },
  'whitepaper-tldr':   { price: '$0.20', category: 'research', description: 'Summarize whitepaper into 5 key bullets', input: { url: 'string (required)', projectName: 'string' } },
  'narrative-pulse':   { price: '$0.40', category: 'research', description: 'Trending narratives in crypto and Base ecosystem', input: { query: 'string (required)' } },
  'vc-tracker':        { price: '$1.00', category: 'research', description: 'VC investment activity — hot sectors, who backs what', input: { query: 'string (required)' } },
  'launch-advisor':    { price: '$3.00', category: 'research', description: 'Full token launch playbook — tokenomics, 8-week timeline, KPIs', input: { projectName: 'string (required)', description: 'string' } },
  'grant-evaluator':   { price: '$5.00', category: 'research', description: 'Base ecosystem grant scoring — Fund/Decline recommendation', input: { description: 'string (required)', projectName: 'string', requestedAmount: 'string' } },
  'x402-readiness':    { price: '$1.00', category: 'research', description: 'Audit any API for x402 payment protocol readiness', input: { url: 'string', description: 'string' } },
  'base-deploy-check': { price: '$0.50', category: 'research', description: 'Pre-deployment security check — vulnerabilities, go/no-go', input: { contractCode: 'string', description: 'string' } },

  // ── DATA ──
  'wallet-pnl':    { price: '$1.00', category: 'data',     description: 'Wallet PnL — win rate, realized gains, smart money score', input: { address: 'string (required)', period: '7d|30d|90d|all' } },
  'whale-tracker': { price: '$0.10', category: 'data',     description: 'Smart money flow — accumulation vs distribution signal', input: { token: 'string (required)', minAmountUSD: 'number' } },
  'dex-flow':      { price: '$0.15', category: 'data',     description: 'DEX buy/sell pressure — live DexScreener data', input: { token: 'string (required)' } },
  'airdrop-check': { price: '$0.10', category: 'data',     description: 'Base airdrop eligibility — protocols, activity score, estimated value', input: { address: 'string (required)' } },
  'alert-check':   { price: '$0.10', category: 'data',     description: 'Check active alert triggers for any address', input: { address: 'string (required)' } },

  // ── EARN ──
  'yield-optimizer':  { price: '$0.15', category: 'earn',    description: 'Best APY on Base DeFi — live DeFiLlama data, risk-adjusted', input: { token: 'string', riskTolerance: 'LOW|MEDIUM|HIGH' } },
  'lp-analyzer':      { price: '$0.25', category: 'earn',    description: 'LP position analysis — impermanent loss, fee income, rebalance signal', input: { positionId: 'string', token0: 'string', token1: 'string' } },
  'tax-report':       { price: '$2.00', category: 'earn',    description: 'On-chain tax summary — realized gains, taxable events, P&L', input: { address: 'string (required)', year: 'number', country: 'string' } },
  'alert-subscribe':  { price: '$0.50', category: 'earn',    description: 'Subscribe to real-time alerts via webhook', input: { webhookUrl: 'string (required)', topics: 'string[] (required)', addresses: 'string[]' } },
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const format = url.searchParams.get('format') ?? 'json'

  const filtered = category
    ? Object.fromEntries(Object.entries(SERVICES).filter(([, v]) => v.category === category))
    : SERVICES

  if (format === 'llm') {
    // Compact text format optimized for LLM system prompts
    const lines = Object.entries(filtered).map(([name, s]) =>
      `${name} (${s.price}): ${s.description}`
    )
    return new Response(
      `BlueAgent x402 Services — pay USDC per call on Base\nBase URL: ${BASE_URL}\n\n${lines.join('\n')}`,
      { headers: { 'Content-Type': 'text/plain' } }
    )
  }

  return Response.json({
    name: 'BlueAgent',
    description: 'Security OS for autonomous agents on Base — 31 pay-per-use tools',
    baseUrl: BASE_URL,
    totalServices: Object.keys(filtered).length,
    payment: { currency: 'USDC', network: 'base', protocol: 'x402' },
    sdks: {
      typescript: 'npm install @blueagent/sdk',
      agentkit: 'npm install @blueagent/agentkit',
      cli: 'npm install -g @blueagent/cli',
      mcp: 'npx @blueagent/skill install --claude',
    },
    services: filtered,
    categories: {
      safety:   'Agent safety — risk checks, honeypot, phishing, MEV, circuit breaker',
      quantum:  'Quantum security — wallet vulnerability, migration, key exposure',
      research: 'Research — deep analysis, tokenomics, VC tracker, grant evaluator',
      data:     'Data — wallet PnL, whale tracker, DEX flow, airdrop eligibility',
      earn:     'Earn — yield optimizer, LP analyzer, tax report, alert subscriptions',
    },
  })
}
