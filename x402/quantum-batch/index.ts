// ── inline helpers (bankr x402 deploy requires self-contained files) ──────

async function callLLM(opts) {
  const res = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BANKR_LLM_KEY ?? process.env.BANKR_API_KEY ?? '',
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens ?? 800,
    }),
  })
  if (!res.ok) throw new Error(`LLM error: ${res.status}`)
  const data = await res.json()
  if (data.content?.[0]?.text) return data.content[0].text
  throw new Error('Invalid LLM response')
}

function extractJSON(raw) {
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('No JSON found in LLM response')
  return JSON.parse(raw.slice(s, e + 1))
}

function extractArray(raw) {
  const s = raw.indexOf('['), e = raw.lastIndexOf(']')
  if (s === -1 || e === -1) return []
  return JSON.parse(raw.slice(s, e + 1))
}

const basescan = {
  async getABI(address) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(`https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${key}`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return { verified: data.status === '1', abi: data.result }
  },
  async getTokenTx(address, limit = 50) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(`https://api.basescan.org/api?module=account&action=tokentx&address=${address}&sort=desc&offset=${limit}&apikey=${key}`, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return data.status === '1' ? data.result : []
  },
  async getTxList(address, limit = 100) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(`https://api.basescan.org/api?module=account&action=txlist&address=${address}&sort=desc&offset=${limit}&apikey=${key}`, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return data.status === '1' ? data.result : []
  },
}

// ─────────────────────────────────────────────────────────────────────────────
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
