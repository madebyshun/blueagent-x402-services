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
const SYSTEM = `You are a seasoned Web3 launch strategist with 5+ years experience launching successful tokens on Base.

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. Start with { and end with }.

{
  "projectName": "string",
  "launchScore": number (0-100),
  "executiveSummary": "2-3 sentences",
  "tokenomics": {
    "suggestedSupply": "string",
    "distribution": { "community": "string", "team": "string", "liquidity": "string", "treasury": "string", "marketing": "string" },
    "vestingSchedule": "string",
    "initialMarketCap": "string",
    "warnings": ["warning1"]
  },
  "launchTimeline": [
    { "week": "Week 1-2", "phase": "string", "tasks": ["task1", "task2"] },
    { "week": "Week 3-4", "phase": "string", "tasks": ["task1", "task2"] },
    { "week": "Week 5-6", "phase": "string", "tasks": ["task1", "task2"] },
    { "week": "Week 7-8", "phase": "string", "tasks": ["task1", "task2"] }
  ],
  "marketingStrategy": { "channels": ["ch1"], "keyMessages": ["msg1"], "influencerTiers": "string", "communityBuilding": "string" },
  "redFlags": ["risk1"],
  "competitiveEdge": ["advantage1"],
  "kpis": {
    "week4": { "holders": "string", "volume": "string", "community": "string" },
    "month3": { "holders": "string", "volume": "string", "community": "string" }
  },
  "recommendation": "string (go/no-go + reasoning)"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { projectName?: string; description?: string; targetAudience?: string; tokenSupply?: string; teamSize?: string; budget?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.projectName) body.projectName = url.searchParams.get('projectName') || undefined
    if (!body.description) body.description = url.searchParams.get('description') || undefined
    if (!body.targetAudience) body.targetAudience = url.searchParams.get('targetAudience') || undefined
    if (!body.teamSize) body.teamSize = url.searchParams.get('teamSize') || undefined
    if (!body.budget) body.budget = url.searchParams.get('budget') || undefined
    if (!body.tokenSupply) body.tokenSupply = url.searchParams.get('tokenSupply') || undefined
    const { projectName, description, targetAudience } = body
    if (!projectName || !description) {
      return Response.json({ error: 'Provide projectName and description' }, { status: 400 })
    }
    console.log(`[LaunchAdvisor] Planning: ${projectName}`)
    const raw = await callLLM({
      system: SYSTEM,
      user: `Launch playbook for:\nProject: ${projectName}\nDescription: ${description}\nAudience: ${targetAudience ?? 'Base builders and traders'}\nTeam: ${body.teamSize ?? 'N/A'}\nBudget: ${body.budget ?? 'N/A'}\nSupply: ${body.tokenSupply ?? 'N/A'}`,
      temperature: 0.7,
      maxTokens: 2000,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[LaunchAdvisor] Error:', error)
    return Response.json({ error: 'Launch plan failed', message: (error as Error).message }, { status: 500 })
  }
}
