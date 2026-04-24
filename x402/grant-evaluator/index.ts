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
const SYSTEM = `You are a senior grants evaluator for Base ecosystem grants using Base/Coinbase criteria.

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. Start with { and end with }.

{
  "projectName": "string",
  "overallScore": number (0-100),
  "recommendation": "Fund | Fund with Conditions | Decline | Request More Info",
  "suggestedGrantSize": "string (e.g. $10,000-25,000 or Decline)",
  "scores": {
    "innovation": number (0-20),
    "baseAlignment": number (0-20),
    "technicalFeasibility": number (0-20),
    "teamQuality": number (0-20),
    "impactPotential": number (0-20)
  },
  "strengths": ["s1", "s2", "s3"],
  "concerns": ["c1", "c2"],
  "conditions": ["condition1"],
  "questionsForTeam": ["q1", "q2", "q3"],
  "comparableProjects": ["project1", "project2"],
  "executiveSummary": "3-4 sentence professional evaluation",
  "milestoneAssessment": "string",
  "riskLevel": "Low | Medium | High | Very High"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { projectName?: string; description?: string; teamBackground?: string; requestedAmount?: string; milestones?: string; githubUrl?: string; websiteUrl?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.projectName) body.projectName = url.searchParams.get('projectName') || undefined
    if (!body.description) body.description = url.searchParams.get('description') || undefined
    if (!body.teamBackground) body.teamBackground = url.searchParams.get('teamBackground') || undefined
    if (!body.requestedAmount) body.requestedAmount = url.searchParams.get('requestedAmount') || undefined
    if (!body.milestones) body.milestones = url.searchParams.get('milestones') || undefined
    if (!body.githubUrl) body.githubUrl = url.searchParams.get('githubUrl') || undefined
    if (!body.websiteUrl) body.websiteUrl = url.searchParams.get('websiteUrl') || undefined
    const { projectName, description } = body
    if (!projectName || !description) {
      return Response.json({ error: 'Provide projectName and description' }, { status: 400 })
    }
    console.log(`[GrantEvaluator] Evaluating: ${projectName}`)
    const raw = await callLLM({
      system: SYSTEM,
      user: `Evaluate Base grant application:\nProject: ${projectName}\nDescription: ${description}\nTeam: ${body.teamBackground ?? 'Not provided'}\nAmount: ${body.requestedAmount ?? 'Not specified'}\nMilestones: ${body.milestones ?? 'Not provided'}\nGitHub: ${body.githubUrl ?? 'N/A'}\nWebsite: ${body.websiteUrl ?? 'N/A'}`,
      temperature: 0.4,
      maxTokens: 2000,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[GrantEvaluator] Error:', error)
    return Response.json({ error: 'Grant evaluation failed', message: (error as Error).message }, { status: 500 })
  }
}
