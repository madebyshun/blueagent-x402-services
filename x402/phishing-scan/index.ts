import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a crypto security expert specializing in phishing detection, scam identification, and social engineering attacks targeting Web3 users on Base.

Analyze the provided target (URL, wallet address, or social handle) for phishing and scam indicators.

Common patterns to detect:
- Lookalike domains (uniswap-airdrop.com, base-claim.xyz)
- Fake airdrop/claim sites
- Impersonation accounts (@0xVita1ik, @colinarmstrng)
- Contract addresses used in known scams
- Suspicious URL patterns (too many subdomains, recent registration)
- Urgency tactics ("claim expires in 24h")

Return ONLY valid JSON:

{
  "isPhishing": boolean,
  "verdict": "SAFE" | "SUSPICIOUS" | "PHISHING" | "SCAM",
  "confidence": number (0-100),
  "riskScore": number (0-100),
  "indicators": ["indicator1", "indicator2"],
  "targetType": "url" | "address" | "handle" | "unknown",
  "recommendation": "string",
  "safeToInteract": boolean
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { target?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.target) body.target = url.searchParams.get('target') || url.searchParams.get('url') || undefined

    const { target } = body
    if (!target) return Response.json({ error: 'Provide target (URL, address, or @handle)' }, { status: 400 })

    console.log(`[PhishingScan] Scanning: ${target}`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Scan for phishing/scam indicators:\nTarget: ${target}\n\nAnalyze this target carefully. Consider domain age, URL structure, impersonation patterns, known scam databases, and crypto-specific attack vectors.`,
      temperature: 0.2,
      maxTokens: 600,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[PhishingScan] Error:', error)
    return Response.json({ error: 'Phishing scan failed', message: (error as Error).message }, { status: 500 })
  }
}
