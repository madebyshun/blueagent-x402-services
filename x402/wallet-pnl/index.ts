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
const SYSTEM = `You are a crypto portfolio analyst specializing in onchain wallet analysis on Base chain.
Return ONLY a valid JSON object:

{
  "address": "string",
  "period": "Last 30 days",
  "totalTrades": number,
  "uniqueTokens": number,
  "estimatedPnL": "string (e.g. +$1,240 or -$320)",
  "winRate": "string (e.g. 65%)",
  "tradingStyle": "Memecoin Aper | DeFi Farmer | Long-term Holder | Active Trader",
  "topTokens": ["token1", "token2", "token3"],
  "biggestWin": "string",
  "biggestLoss": "string",
  "riskProfile": "Conservative | Moderate | Aggressive | Degen",
  "summary": "2-3 sentence summary",
  "smartMoneyScore": number (0-100),
  "recommendation": "string"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || undefined
    const { address } = body
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Provide a valid wallet address (0x...)' }, { status: 400 })
    }
    console.log(`[WalletPnL] Analyzing: ${address}`)
    const txs = await basescan.getTokenTx(address, 50)
    const txSummary = txs.slice(0, 20).map((tx: any) => ({
      token: tx.tokenSymbol,
      value: tx.value,
      decimals: tx.tokenDecimal,
      direction: tx.to?.toLowerCase() === address.toLowerCase() ? 'IN' : 'OUT',
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    }))
    const raw = await callLLM({
      system: SYSTEM,
      user: `Analyze Base wallet: ${address}\nTransactions (last 50):\n${JSON.stringify(txSummary, null, 2)}\nTotal found: ${txs.length}`,
      temperature: 0.5,
      maxTokens: 1200,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[WalletPnL] Error:', error)
    return Response.json({ error: 'Wallet analysis failed', message: (error as Error).message }, { status: 500 })
  }
}
