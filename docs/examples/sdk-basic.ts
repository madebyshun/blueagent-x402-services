/**
 * BlueAgent SDK — basic usage examples
 * npm install @blueagent/sdk
 */
import { BlueAgent } from '@blueagent/sdk'

const ba = new BlueAgent({ privateKey: process.env.WALLET_PRIVATE_KEY! })

// ── 1. Pre-transaction safety check ─────────────────────────────────────────
const risk = await ba.security.riskcheck({
  action: 'approve 0x4200... to spend USDC',
  amount: '$500',
  agentId: 'my-agent-v1',
})
console.log(risk.decision) // APPROVE | WARN | BLOCK
if (risk.decision === 'BLOCK') process.exit(1)

// ── 2. Honeypot check before buying a token ──────────────────────────────────
const hp = await ba.security.honeypotCheck({ token: '0xabcd...' })
console.log(hp.verdict)    // SAFE | SUSPICIOUS | HONEYPOT
if (hp.isHoneypot) {
  console.log('Do not buy:', hp.indicators)
  process.exit(1)
}

// ── 3. Circuit breaker after losses ──────────────────────────────────────────
const cb = await ba.security.circuitBreaker({
  agentId: 'my-agent-v1',
  context: '3 consecutive failed trades',
  recentLosses: '$340',
})
console.log(cb.decision) // CONTINUE | PAUSE | HALT
if (cb.decision === 'HALT') process.exit(0)

// ── 4. Research a token before investing ─────────────────────────────────────
const analysis = await ba.research.analyze({ projectName: '$BRETT' })
console.log(`Risk: ${analysis.riskScore}/100 — ${analysis.recommendation}`)

// ── 5. Find yield for USDC on Base ──────────────────────────────────────────
const yields = await ba.earn.yieldOptimizer({ token: 'USDC', riskTolerance: 'LOW' })
console.log('Top yield:', yields)

// ── 6. Wallet PnL report ─────────────────────────────────────────────────────
const pnl = await ba.data.pnl({ address: '0xabc...', period: '30d' })
console.log(`Win rate: ${pnl.winRate}, Net P&L: ${pnl.netPnL}`)

// ── 7. Quantum vulnerability check ──────────────────────────────────────────
const quantum = await ba.security.quantum({ address: '0xabc...' })
console.log(`Quantum risk: ${quantum.quantumRiskLevel}`)
if (quantum.publicKeyExposed) {
  console.log('⚠️  Public key exposed — migrate wallet immediately')
}

// ── 8. Real-time alerts via webhook ──────────────────────────────────────────
await ba.earn.alertSubscribe({
  webhookUrl: 'https://my-agent.xyz/webhook',
  topics: ['whale_movement', 'circuit_breaker'],
  addresses: ['0xabc...'],
})
console.log('Alert subscription active')
