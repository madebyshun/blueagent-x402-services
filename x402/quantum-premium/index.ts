import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a quantum cryptography security expert analyzing blockchain wallet vulnerabilities (2025-2030 horizon).

Key facts:
- Ethereum wallets use ECDSA (secp256k1) — quantum-resistant IF public key is not exposed
- Public keys are exposed when a wallet has SENT a transaction
- Hardware wallets do NOT protect against quantum attacks
- Migration: move funds to a fresh wallet that has never sent a transaction
- CRQC estimated 5-15 years away; harvest-now-decrypt-later attacks are already possible

Return ONLY valid JSON. No extra text:

{
  "address": "string",
  "chain": "string",
  "quantumRiskLevel": "CRITICAL | HIGH | MEDIUM | LOW | MINIMAL",
  "riskScore": number (0-100),
  "publicKeyExposed": boolean,
  "confidenceScore": number (0-100),
  "threatTimeline": "string",
  "vulnerabilities": [{ "type": "string", "severity": "HIGH | MEDIUM | LOW", "description": "string" }],
  "protectedFactors": ["string"],
  "migrationSteps": [{ "step": number, "action": "string", "priority": "URGENT | RECOMMENDED | OPTIONAL" }],
  "executiveSummary": "3-4 sentences, clear and non-technical",
  "technicalDetails": "2-3 sentences for technical users",
  "recommendation": "MIGRATE_NOW | MIGRATE_SOON | MONITOR | SAFE_FOR_NOW"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string; chain?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || undefined
    if (!body.chain) body.chain = url.searchParams.get('chain') || 'base'
    const { address, chain = 'base' } = body
    if (!address) return Response.json({ error: 'Provide a wallet address' }, { status: 400 })
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format. Must be valid 0x Ethereum address.' }, { status: 400 })
    }
    console.log(`[Quantum] Analyzing: ${address} on ${chain}`)
    const raw = await callLLM({
      system: SYSTEM,
      user: `Analyze quantum risk for ${chain} wallet: ${address}. Return compact JSON — all strings under 100 chars. Max 3 vulnerabilities, max 3 migration steps.`,
      temperature: 0.5,
      maxTokens: 900,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[Quantum] Error:', error)
    return Response.json({ error: 'Quantum report failed', message: (error as Error).message }, { status: 500 })
  }
}
