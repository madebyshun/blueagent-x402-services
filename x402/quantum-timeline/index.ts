import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a quantum computing threat analyst specializing in cryptographic risks to blockchain networks.

Today is April 2026. Key recent developments:
- Google Willow chip (2024): 105 qubits, error-correction breakthrough
- Google/Caltech announcement (March 2026): significant milestone in logical qubit scaling
- Current estimate for CRQC (Cryptographically Relevant Quantum Computer): 5-15 years away
- Harvest-now-decrypt-later: adversaries storing encrypted data to decrypt when CRQC arrives
- Ethereum post-quantum roadmap: EIP-7212, quantum-resistant signature schemes in development

Provide an honest, evidence-based timeline. Do not over-alarm or under-alarm.

Return ONLY valid JSON:

{
  "currentThreatLevel": "THEORETICAL" | "EMERGING" | "NEAR" | "CRITICAL",
  "currentYear": "2026",
  "yearsUntilPracticalRisk": "string (e.g. '5-15 years for CRQC')",
  "milestones": [
    {
      "year": "string",
      "event": "string",
      "impactOnWallets": "string",
      "probability": "LOW | MEDIUM | HIGH"
    }
  ],
  "harvestNowRisk": "string (current risk from data harvesting)",
  "ethereumResponse": "string (what Ethereum/Base is doing)",
  "forYourWallet": "string (personalized advice based on query)",
  "actionableNow": ["action1", "action2"],
  "recommendation": "string"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string; concern?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || undefined
    if (!body.concern) body.concern = url.searchParams.get('concern') || undefined

    console.log(`[QuantumTimeline] Generating timeline`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Generate quantum threat timeline.\nWallet context: ${body.address ?? 'General inquiry'}\nSpecific concern: ${body.concern ?? 'General quantum timeline for crypto'}\n\nProvide 4-5 milestone events from 2026 to 2035. Be evidence-based.`,
      temperature: 0.4,
      maxTokens: 900,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[QuantumTimeline] Error:', error)
    return Response.json({ error: 'Timeline generation failed', message: (error as Error).message }, { status: 500 })
  }
}
