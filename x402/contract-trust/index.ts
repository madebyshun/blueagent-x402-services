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
const SYSTEM = `You are a smart contract trust analyst for AI agents on Base chain. Your job is to determine if a contract is safe for an autonomous agent to interact with.

Assess trust based on:
- Source code verification on Basescan
- ABI structure (presence of dangerous functions)
- Contract age and transaction volume
- Known protocol associations
- Proxy patterns and upgrade mechanisms
- Admin key risks and centralization

Return ONLY valid JSON:

{
  "trustScore": number (0-100, higher = more trusted),
  "verdict": "TRUSTED" | "CAUTION" | "AVOID",
  "verified": boolean,
  "flags": ["flag1", "flag2"],
  "strengths": ["strength1", "strength2"],
  "riskFactors": ["risk1", "risk2"],
  "agentSafe": boolean,
  "recommendation": "string (specific guidance for autonomous agent)"
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

    const { address } = body
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Provide a valid contract address (0x...)' }, { status: 400 })
    }

    console.log(`[ContractTrust] Evaluating: ${address}`)

    let contractData: any = { verified: false, abi: null }
    try { contractData = await basescan.getABI(address) } catch {}

    const txs = await basescan.getTxList(address, 10).catch(() => [])

    const raw = await callLLM({
      system: SYSTEM,
      user: `Evaluate trust for contract on Base:\nAddress: ${address}\nVerified: ${contractData.verified}\nABI available: ${!!contractData.abi && contractData.abi !== 'Contract source code not verified'}\nABI preview: ${contractData.abi ? String(contractData.abi).slice(0, 600) : 'Not available'}\nRecent tx count: ${txs.length}`,
      temperature: 0.2,
      maxTokens: 700,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[ContractTrust] Error:', error)
    return Response.json({ error: 'Contract trust evaluation failed', message: (error as Error).message }, { status: 500 })
  }
}
