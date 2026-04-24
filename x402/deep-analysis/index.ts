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
const SYSTEM = `You are a senior crypto due diligence analyst on Base chain, powered by Blue Agent.

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. Start with { and end with }.

{
  "projectName": "string",
  "ticker": "string or null",
  "contractAddress": "string or null",
  "riskScore": number (0-100, higher = riskier),
  "overallScore": number (0-100),
  "rugProbability": number (0-100),
  "categories": {
    "Tokenomics": number,
    "Liquidity": number,
    "CodeQuality": number,
    "TeamActivity": number,
    "Community": number,
    "Transparency": number
  },
  "keyRisks": ["risk1", "risk2"],
  "keyStrengths": ["strength1", "strength2"],
  "summary": "Professional 3-4 sentence summary",
  "recommendation": "Strong Buy | Buy | Caution | Avoid | High Risk",
  "suggestedActions": ["action1", "action2"]
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { contractAddress?: string; projectName?: string; ticker?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.contractAddress && !body.projectName) {
      body.contractAddress = url.searchParams.get('contractAddress') || undefined
      body.projectName = url.searchParams.get('projectName') || undefined
      body.ticker = url.searchParams.get('ticker') || undefined
    }
    const { contractAddress, projectName, ticker } = body
    if (!contractAddress && !projectName) {
      return Response.json({ error: 'Provide contractAddress or projectName' }, { status: 400 })
    }
    const input = contractAddress ?? `${projectName}${ticker ? ` (${ticker})` : ''}`
    console.log(`[DeepAnalysis] Analyzing: ${input}`)
    const raw = await callLLM({ system: SYSTEM, user: `Deep due diligence on: ${input}`, temperature: 0.65, maxTokens: 800 })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[DeepAnalysis] Error:', error)
    return Response.json({ error: 'Analysis failed', message: (error as Error).message }, { status: 500 })
  }
}
