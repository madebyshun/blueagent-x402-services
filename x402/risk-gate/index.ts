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
const SYSTEM = `You are a risk management system for AI agents executing onchain transactions on Base.

Assess if an action is safe to execute. Be conservative — when in doubt, block.

Red flags to always block:
- Unverified contracts for large amounts
- Unlimited approval amounts (type(uint256).max)
- Amount exceeds $1000 without explicit override
- Actions that could drain wallet

CRITICAL: Return ONLY raw JSON. Start with { and end with }.

{
  "decision": "APPROVE" | "BLOCK" | "WARN",
  "riskScore": number (0-100, higher = riskier),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "reasons": ["reason1", "reason2"],
  "recommendation": "string",
  "maxSafeAmount": "string",
  "checks": {
    "contractVerified": boolean | null,
    "amountReasonable": boolean,
    "actionLegitimate": boolean,
    "addressSuspicious": boolean
  }
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { action?: string; contractAddress?: string; amount?: string; toAddress?: string; agentId?: string; context?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.action) body.action = url.searchParams.get('action') || undefined
    if (!body.contractAddress) body.contractAddress = url.searchParams.get('contractAddress') || undefined
    if (!body.amount) body.amount = url.searchParams.get('amount') || undefined
    if (!body.toAddress) body.toAddress = url.searchParams.get('toAddress') || undefined
    if (!body.agentId) body.agentId = url.searchParams.get('agentId') || undefined
    if (!body.context) body.context = url.searchParams.get('context') || undefined
    const { action, contractAddress, amount } = body
    if (!action) {
      return Response.json({ error: 'Provide action to evaluate' }, { status: 400 })
    }
    console.log(`[RiskGate] Checking: ${action} | contract: ${contractAddress}`)
    let contractCheck = null
    if (contractAddress && /^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      try { contractCheck = await basescan.getABI(contractAddress) } catch {}
    }
    const raw = await callLLM({
      system: SYSTEM,
      user: `Risk check:\nAction: ${action}\nContract: ${contractAddress ?? 'N/A'}\nAmount: ${amount ?? 'Not specified'}\nRecipient: ${body.toAddress ?? 'N/A'}\nAgent: ${body.agentId ?? 'unknown'}\nContext: ${body.context ?? 'None'}\nContract onchain check: ${contractCheck ? JSON.stringify(contractCheck) : 'Not checked'}`,
      temperature: 0.2,
      maxTokens: 600,
    })
    const result = extractJSON(raw) as any
    if (contractCheck && result.checks) result.checks.contractVerified = contractCheck.verified
    return Response.json(result, { status: 200 })
  } catch (error) {
    console.error('[RiskGate] Error:', error)
    return Response.json({
      decision: 'BLOCK', riskScore: 100, riskLevel: 'Critical',
      reasons: ['Risk evaluation failed — blocking by default'],
      recommendation: 'Do not proceed. Retry or contact support.',
      error: (error as Error).message,
    }, { status: 200 })
  }
}
