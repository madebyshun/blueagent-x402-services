// Inline helpers — bankr x402 deploy requires self-contained service files

async function callLLM(opts: { system: string; user: string; temperature?: number; maxTokens?: number }): Promise<string> {
  const response = await fetch('https://llm.bankr.bot/v1/messages', {
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
  if (!response.ok) throw new Error(`LLM error: ${response.status}`)
  const data = await response.json()
  if (data.content?.[0]?.text) return data.content[0].text
  if (data.text) return data.text
  throw new Error('Invalid LLM response')
}

function extractJSON(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(raw.slice(start, end + 1))
}

async function getABI(address: string) {
  const key = process.env.BASESCAN_API_KEY ?? ''
  const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  return { verified: data.status === '1', abi: data.result }
}

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

    let contractData = { verified: false, abi: null as any }
    if (/^0x[a-fA-F0-9]{40}$/.test(token)) {
      try { contractData = await getABI(token) } catch {}
    }

    const raw = await callLLM({
      system: SYSTEM,
      user: `Check if this is a honeypot:\nToken: ${token}\nContract verified: ${contractData.verified}\nABI snippet: ${contractData.abi ? String(contractData.abi).slice(0, 500) : 'Not available'}\n\nAnalyze for: sell restrictions, hidden fees, ownership traps, blacklist functions.`,
      temperature: 0.2,
      maxTokens: 600,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[HoneypotCheck] Error:', error)
    return Response.json({ error: 'Honeypot check failed', message: (error as Error).message }, { status: 500 })
  }
}
