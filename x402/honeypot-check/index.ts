import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a smart contract security expert specializing in honeypot and rug pull detection on Base chain.

Analyze the provided contract data and return ONLY valid JSON:

{
  "isHoneypot": boolean,
  "verdict": "SAFE" | "SUSPICIOUS" | "HONEYPOT",
  "riskScore": number (0-100, higher = more dangerous),
  "confidence": number (0-100),
  "indicators": ["indicator1", "indicator2"],
  "technicalFlags": ["flag1", "flag2"],
  "recommendation": "string (what to do)",
  "safeToTrade": boolean
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { token?: string; chain?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.token) body.token = url.searchParams.get('token') || url.searchParams.get('contractAddress') || undefined

    const { token } = body
    if (!token) return Response.json({ error: 'Provide token contract address' }, { status: 400 })

    console.log(`[HoneypotCheck] Checking: ${token}`)

    let contractData: any = { verified: false, abi: null }
    if (/^0x[a-fA-F0-9]{40}$/.test(token)) {
      try { contractData = await basescan.getABI(token) } catch {}
    }

    const raw = await callLLM({
      system: SYSTEM,
      user: `Check if this is a honeypot:\nToken: ${token}\nContract verified: ${contractData.verified}\nABI available: ${contractData.abi && contractData.abi !== 'Contract source code not verified'}\nABI snippet: ${contractData.abi ? String(contractData.abi).slice(0, 500) : 'Not available'}\n\nAnalyze for: sell restrictions, hidden fees, ownership traps, blacklist functions, max tx limits that prevent selling.`,
      temperature: 0.2,
      maxTokens: 600,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[HoneypotCheck] Error:', error)
    return Response.json({ error: 'Honeypot check failed', message: (error as Error).message }, { status: 500 })
  }
}
