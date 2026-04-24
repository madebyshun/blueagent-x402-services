/**
 * BlueAgent direct x402 call — no SDK needed
 * Works with any HTTP client that supports x402 payment flow
 *
 * npm install x402-fetch viem
 */
import { wrapFetchWithPayment } from 'x402-fetch'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'

// 1. Set up wallet client for x402 payments
const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
const wallet = createWalletClient({ account, chain: base, transport: http() })
const paidFetch = wrapFetchWithPayment(fetch, wallet as any)

// 2. Call any BlueAgent service
async function call(endpoint: string, body: Record<string, unknown>) {
  const res = await paidFetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${endpoint} error: ${res.status} ${await res.text()}`)
  return res.json()
}

// 3. Examples

// Honeypot check — $0.05
const hp = await call('honeypot-check', { token: '0xabcd...' })
console.log(hp.verdict) // SAFE | SUSPICIOUS | HONEYPOT

// Risk gate — $0.05
const risk = await call('risk-gate', {
  action: 'approve 0xDEX to spend USDC',
  amount: '$200',
})
console.log(risk.decision) // APPROVE | WARN | BLOCK

// Yield optimizer — $0.15
const yields = await call('yield-optimizer', { token: 'USDC', riskTolerance: 'MEDIUM' })
console.log(yields)

// Deep analysis — $0.35
const analysis = await call('deep-analysis', { projectName: '$BRETT' })
console.log(`Risk score: ${analysis.riskScore}/100`)

// Quantum scan — $1.50
const quantum = await call('quantum-premium', { address: '0xabc...', chain: 'base' })
console.log(`Quantum risk: ${quantum.quantumRiskLevel}`)

// 4. Discover all services — FREE (no payment)
const services = await fetch(`${BASE_URL}/discover`).then(r => r.json())
console.log(`Available: ${services.totalServices} tools`)

// Compact list for LLM system prompts
const toolList = await fetch(`${BASE_URL}/discover?format=llm`).then(r => r.text())
console.log(toolList)
