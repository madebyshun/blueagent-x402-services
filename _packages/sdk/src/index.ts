import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { wrapFetchWithPayment } from 'x402-fetch'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'

type Caller = (endpoint: string, body: Record<string, unknown>) => Promise<any>

function makeCaller(privateKey: string): Caller {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const wallet = createWalletClient({ account, chain: base, transport: http() })
  const paidFetch = wrapFetchWithPayment(fetch, wallet as any)

  return async (endpoint, body) => {
    const res = await paidFetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`[blueagent/${endpoint}] ${res.status}: ${await res.text()}`)
    return res.json()
  }
}

// ── SECURITY ────────────────────────────────────────────────────────────────

class SecuritySDK {
  constructor(private c: Caller) {}

  riskcheck(p: { action: string; contractAddress?: string; amount?: string; agentId?: string }) {
    return this.c('risk-gate', p)
  }
  honeypotCheck(p: { token: string }) {
    return this.c('honeypot-check', { ...p, chain: 'base' })
  }
  allowanceAudit(p: { address: string }) {
    return this.c('allowance-audit', p)
  }
  phishingScan(p: { target: string }) {
    return this.c('phishing-scan', p)
  }
  mevShield(p: { action: string }) {
    return this.c('mev-shield', { ...p, chain: 'base' })
  }
  contractTrust(p: { address: string }) {
    return this.c('contract-trust', p)
  }
  amlScreen(p: { address: string }) {
    return this.c('aml-screen', { ...p, chain: 'base' })
  }
  circuitBreaker(p: { agentId?: string; action?: string; context?: string; recentLosses?: string; consecutiveBlocks?: number }) {
    return this.c('circuit-breaker', p)
  }
  quantum(p: { address: string; chain?: string }) {
    return this.c('quantum-premium', { chain: 'base', ...p })
  }
  quantumBatch(p: { addresses: string[] }) {
    return this.c('quantum-batch', { ...p, chain: 'base' })
  }
  keyExposure(p: { address: string }) {
    return this.c('key-exposure', { ...p, chain: 'base' })
  }
  quantumMigrate(p: { address: string; urgencyLevel?: string }) {
    return this.c('quantum-migrate', { ...p, chain: 'base' })
  }
  quantumTimeline(p: { address?: string; concern?: string } = {}) {
    return this.c('quantum-timeline', p)
  }
}

// ── RESEARCH ────────────────────────────────────────────────────────────────

class ResearchSDK {
  constructor(private c: Caller) {}

  analyze(p: { projectName: string }) {
    return this.c('deep-analysis', p)
  }
  tokenomicsScore(p: { token: string }) {
    return this.c('tokenomics-score', p)
  }
  whitepaperTldr(p: { url: string; projectName?: string }) {
    return this.c('whitepaper-tldr', { projectName: '', ...p })
  }
  narrativePulse(p: { query: string }) {
    return this.c('narrative-pulse', p)
  }
  vcTracker(p: { query: string }) {
    return this.c('vc-tracker', p)
  }
  launchAdvisor(p: { projectName: string; description?: string; targetRaise?: string }) {
    return this.c('launch-advisor', p)
  }
  grant(p: { description: string; projectName?: string; teamBackground?: string; requestedAmount?: string; milestones?: string }) {
    return this.c('grant-evaluator', p)
  }
  x402Readiness(p: { url?: string; description?: string; currentModel?: string }) {
    return this.c('x402-readiness', p)
  }
  baseDeployCheck(p: { contractCode?: string; description?: string; projectName?: string }) {
    return this.c('base-deploy-check', p)
  }
}

// ── DATA ────────────────────────────────────────────────────────────────────

class DataSDK {
  constructor(private c: Caller) {}

  pnl(p: { address: string; period?: '7d' | '30d' | '90d' | 'all' }) {
    return this.c('wallet-pnl', { chain: 'base', period: '30d', ...p })
  }
  whaleTracker(p: { token: string; minAmountUSD?: number }) {
    return this.c('whale-tracker', { chain: 'base', minAmountUSD: 1000, ...p })
  }
  dexFlow(p: { token: string }) {
    return this.c('dex-flow', { ...p, chain: 'base' })
  }
  alertCheck(p: { address: string }) {
    return this.c('alert-check', p)
  }
}

// ── EARN ────────────────────────────────────────────────────────────────────

class EarnSDK {
  constructor(private c: Caller) {}

  yieldOptimizer(p: { token?: string; minAPY?: number; riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH' } = {}) {
    return this.c('yield-optimizer', { token: 'USDC', riskTolerance: 'MEDIUM', chain: 'base', ...p })
  }
  airdropCheck(p: { address: string }) {
    return this.c('airdrop-check', { ...p, chain: 'base' })
  }
  lpAnalyzer(p: { address: string; poolAddress?: string }) {
    return this.c('lp-analyzer', { ...p, chain: 'base' })
  }
  taxReport(p: { address: string; year?: number; country?: string }) {
    return this.c('tax-report', { year: new Date().getFullYear(), country: 'US', chain: 'base', ...p })
  }
  alertSubscribe(p: { webhookUrl: string; topics: string[]; addresses?: string[] }) {
    return this.c('alert-subscribe', p)
  }
}

// ── MAIN CLASS ───────────────────────────────────────────────────────────────

export class BlueAgent {
  public security: SecuritySDK
  public research: ResearchSDK
  public data: DataSDK
  public earn: EarnSDK

  constructor({ privateKey }: { privateKey: string }) {
    const c = makeCaller(privateKey)
    this.security = new SecuritySDK(c)
    this.research = new ResearchSDK(c)
    this.data = new DataSDK(c)
    this.earn = new EarnSDK(c)
  }
}

export type { Caller }
