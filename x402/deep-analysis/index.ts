import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

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
