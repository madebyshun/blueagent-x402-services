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
const SYSTEM = `You are a quantum cryptography security expert analyzing blockchain wallet vulnerabilities (2025-2030 horizon).

Key facts:
- Ethereum wallets use ECDSA (secp256k1) — quantum-resistant IF public key is not exposed
- Public keys are exposed when a wallet has SENT a transaction
- Hardware wallets do NOT protect against quantum attacks
- Migration: move funds to a fresh wallet that has never sent a transaction
- CRQC estimated 5-15 years away; harvest-now-decrypt-later attacks are already possible

Return ONLY valid JSON. No extra text:

{
  "address": "string",
  "chain": "string",
  "quantumRiskLevel": "CRITICAL | HIGH | MEDIUM | LOW | MINIMAL",
  "riskScore": number (0-100),
  "publicKeyExposed": boolean,
  "confidenceScore": number (0-100),
  "threatTimeline": "string",
  "vulnerabilities": [{ "type": "string", "severity": "HIGH | MEDIUM | LOW", "description": "string" }],
  "protectedFactors": ["string"],
  "migrationSteps": [{ "step": number, "action": "string", "priority": "URGENT | RECOMMENDED | OPTIONAL" }],
  "executiveSummary": "3-4 sentences, clear and non-technical",
  "technicalDetails": "2-3 sentences for technical users",
  "recommendation": "MIGRATE_NOW | MIGRATE_SOON | MONITOR | SAFE_FOR_NOW"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string; chain?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || undefined
    if (!body.chain) body.chain = url.searchParams.get('chain') || 'base'
    const { address, chain = 'base' } = body
    if (!address) return Response.json({ error: 'Provide a wallet address' }, { status: 400 })
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format. Must be valid 0x Ethereum address.' }, { status: 400 })
    }
    console.log(`[Quantum] Analyzing: ${address} on ${chain}`)
    const raw = await callLLM({
      system: SYSTEM,
      user: `Analyze quantum risk for ${chain} wallet: ${address}. Return compact JSON — all strings under 100 chars. Max 3 vulnerabilities, max 3 migration steps.`,
      temperature: 0.5,
      maxTokens: 900,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[Quantum] Error:', error)
    return Response.json({ error: 'Quantum report failed', message: (error as Error).message }, { status: 500 })
  }
}
