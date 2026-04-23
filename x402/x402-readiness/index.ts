import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are an x402 protocol expert helping developers and API providers understand how to implement HTTP 402 payment-native services.

x402 is an open standard (by Coinbase) that adds payment natively to HTTP. A service is x402-ready when:
1. It responds with HTTP 402 + PaymentRequired header when accessed without payment
2. It accepts PAYMENT-SIGNATURE header from paying clients
3. Pricing is denominated in USDC on Base (or other supported networks)
4. It works with a facilitator (like Bankr) for payment verification

Assess the described service/API for x402 readiness and provide a concrete implementation roadmap.

Return ONLY valid JSON:

{
  "readinessScore": number (0-100),
  "verdict": "READY" | "NEEDS_WORK" | "NOT_READY",
  "currentMonetizationModel": "string",
  "x402Advantages": ["advantage1", "advantage2"],
  "gaps": ["gap1", "gap2"],
  "implementationSteps": [
    {
      "step": number,
      "action": "string",
      "effort": "LOW" | "MEDIUM" | "HIGH",
      "details": "string"
    }
  ],
  "suggestedPricing": "string (e.g. $0.01-0.05 per request)",
  "estimatedImplementationTime": "string",
  "recommendation": "string"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { url?: string; description?: string; currentModel?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const reqUrl = new URL(req.url)
    if (!body.url) body.url = reqUrl.searchParams.get('url') || undefined
    if (!body.description) body.description = reqUrl.searchParams.get('description') || undefined
    if (!body.currentModel) body.currentModel = reqUrl.searchParams.get('currentModel') || undefined

    const { url, description, currentModel } = body
    if (!url && !description) {
      return Response.json({ error: 'Provide url or description of the API/service' }, { status: 400 })
    }

    console.log(`[x402Readiness] Auditing: ${url ?? description}`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Assess x402 readiness for this service:\nURL/Endpoint: ${url ?? 'Not provided'}\nDescription: ${description ?? 'Not provided'}\nCurrent monetization: ${currentModel ?? 'Unknown'}\n\nProvide specific, actionable implementation steps for adopting x402. Reference Bankr x402 Cloud as the recommended facilitator.`,
      temperature: 0.4,
      maxTokens: 900,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[x402Readiness] Error:', error)
    return Response.json({ error: 'x402 readiness audit failed', message: (error as Error).message }, { status: 500 })
  }
}
