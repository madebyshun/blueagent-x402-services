import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a crypto market narrative analyst tracking trending themes in the Base ecosystem and broader crypto market (as of April 2026).

You track: AI agents, DeFi innovations, RWA (Real World Assets), memecoins, quantum security, ZHC (Zero-Human Companies), x402 payments, restaking, and Base-specific developments.

Assess narrative momentum based on: developer activity, social discourse, VC interest, protocol launches, and media coverage.

Return ONLY valid JSON:

{
  "asOf": "April 2026",
  "topNarratives": [
    {
      "name": "string",
      "momentum": "EXPLODING" | "HOT" | "RISING" | "STABLE" | "COOLING",
      "baseRelevance": "HIGH" | "MEDIUM" | "LOW",
      "description": "string (under 80 chars)",
      "timeHorizon": "string (e.g. '1-3 months', 'long-term')"
    }
  ],
  "baseEcosystemFocus": ["theme1", "theme2", "theme3"],
  "emergingThemes": ["theme1", "theme2"],
  "fadingThemes": ["theme1"],
  "bestPositioned": ["sector/project1", "sector/project2"],
  "agentOpportunity": "string (what's the best opportunity for AI agents right now)",
  "recommendation": "string"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { query?: string; sector?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.query) body.query = url.searchParams.get('query') || url.searchParams.get('sector') || undefined

    console.log(`[NarrativePulse] Analyzing narratives: ${body.query ?? 'general'}`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Analyze current crypto narratives (April 2026).\nFocus area: ${body.query ?? 'Base ecosystem + general crypto'}\n\nProvide top 5 narratives with momentum scores. Be specific to current market conditions.`,
      temperature: 0.6,
      maxTokens: 900,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[NarrativePulse] Error:', error)
    return Response.json({ error: 'Narrative analysis failed', message: (error as Error).message }, { status: 500 })
  }
}
