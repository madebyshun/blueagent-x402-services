import { callLLM } from '../_lib/llm.js'
import { extractArray } from '../_lib/json.js'

const COST_PER_WALLET = 250000 // $0.25 in atomic USDC (6 decimals)
const MAX_WALLETS = 10

const SYSTEM = `You are a quantum security expert. Analyze multiple Ethereum wallet addresses for quantum computing risk.

For each wallet assess: public key exposure risk, quantum vulnerability level, quick recommendation.

Return ONLY valid JSON array. Keep descriptions under 60 chars each.`

export default async function handler(req: Request): Promise<Response> {
  try {
    let addresses: string[] = []
    if (req.method === 'POST') {
      try {
        const text = await req.text()
        if (text.trim().startsWith('{')) {
          const body = JSON.parse(text)
          if (Array.isArray(body.addresses)) addresses = body.addresses
          else if (typeof body.address === 'string') addresses = body.address.split(',').map((a: string) => a.trim())
        } else if (text.trim().startsWith('[')) {
          addresses = JSON.parse(text)
        }
      } catch {}
    }
    if (!addresses.length) {
      const url = new URL(req.url)
      const param = url.searchParams.get('addresses') || url.searchParams.get('address') || ''
      addresses = param.split(',').map(a => a.trim()).filter(Boolean)
    }
    if (!addresses.length) {
      return Response.json({ error: 'Provide addresses as JSON array or comma-separated' }, { status: 400 })
    }
    const valid = addresses.filter(a => /^0x[a-fA-F0-9]{40}$/.test(a)).slice(0, MAX_WALLETS)
    if (!valid.length) {
      return Response.json({ error: 'No valid 0x addresses found' }, { status: 400 })
    }
    const count = valid.length
    const actualCost = count * COST_PER_WALLET
    console.log(`[QuantumBatch] Scanning ${count} wallets, cost: $${(actualCost / 1_000_000).toFixed(2)}`)
    const walletList = valid.map((addr, i) => `${i + 1}. ${addr}`).join('\n')
    const raw = await callLLM({
      system: SYSTEM,
      user: `Scan ${count} wallets for quantum risk:\n${walletList}\n\nReturn JSON array:\n[{"address":"0x...","riskLevel":"CRITICAL|HIGH|MEDIUM|LOW|MINIMAL","riskScore":0-100,"publicKeyExposed":bool,"recommendation":"string","action":"MIGRATE_NOW|MONITOR|SAFE"}]`,
      maxTokens: count * 150 + 100,
    })
    const results = extractArray(raw)
    return new Response(JSON.stringify({
      scanned: count,
      results,
      billing: { wallets: count, costPerWallet: '$0.25', totalCost: `$${(actualCost / 1_000_000).toFixed(2)}` },
      summary: {
        critical: (results as any[]).filter(r => r.riskLevel === 'CRITICAL').length,
        high: (results as any[]).filter(r => r.riskLevel === 'HIGH').length,
        medium: (results as any[]).filter(r => r.riskLevel === 'MEDIUM').length,
        low: (results as any[]).filter(r => ['LOW', 'MINIMAL'].includes(r.riskLevel)).length,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-402-Settle-Amount': String(actualCost) },
    })
  } catch (error) {
    console.error('[QuantumBatch] Error:', error)
    return Response.json({ error: 'Batch scan failed', message: (error as Error).message }, { status: 500 })
  }
}
