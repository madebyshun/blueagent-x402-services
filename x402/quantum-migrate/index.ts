import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a quantum cryptography migration specialist helping Ethereum/Base wallet holders migrate to quantum-safe configurations.

Context (April 2026):
- Google/Caltech quantum computing breakthroughs have accelerated threat timelines
- ECDSA (secp256k1) wallets that have sent transactions have exposed public keys
- Migration urgency depends on wallet activity, balance, and key exposure
- Recommended tools: MetaMask, hardware wallets for cold storage, EIP-7212 aware wallets

Provide a step-by-step, actionable migration plan. Be specific about tools and timeframes.

Return ONLY valid JSON:

{
  "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "urgencyReason": "string",
  "estimatedRisk": "string (e.g. 'High if CRQC appears in 5 years')",
  "steps": [
    {
      "step": number,
      "action": "string",
      "tool": "string (specific tool/app to use)",
      "timeEstimate": "string",
      "priority": "URGENT" | "RECOMMENDED" | "OPTIONAL",
      "details": "string"
    }
  ],
  "totalTimeEstimate": "string",
  "keyPrinciples": ["principle1", "principle2"],
  "doNotDo": ["mistake1", "mistake2"],
  "recommendation": "string (executive summary)"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string; chain?: string; urgencyLevel?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || undefined
    if (!body.chain) body.chain = url.searchParams.get('chain') || 'base'
    if (!body.urgencyLevel) body.urgencyLevel = url.searchParams.get('urgencyLevel') || undefined

    const { address, chain = 'base', urgencyLevel } = body
    if (!address) return Response.json({ error: 'Provide a wallet address' }, { status: 400 })
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }

    console.log(`[QuantumMigrate] Planning migration for: ${address}`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Create quantum-safe migration plan for:\nWallet: ${address}\nChain: ${chain}\nUrgency level indicated: ${urgencyLevel ?? 'Not specified — assess from wallet'}\n\nProvide max 5 steps. Be specific and actionable. Keep each step under 80 chars.`,
      temperature: 0.3,
      maxTokens: 1000,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[QuantumMigrate] Error:', error)
    return Response.json({ error: 'Migration plan failed', message: (error as Error).message }, { status: 500 })
  }
}
