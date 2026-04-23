import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a smart money and whale flow analyst for Base chain tokens and wallets.

Analyze large wallet movements to identify accumulation, distribution, or manipulation patterns. Smart money signals are valuable for agents making trading decisions.

Return ONLY valid JSON:

{
  "whaleActivity": "ACCUMULATING" | "DISTRIBUTING" | "NEUTRAL" | "MIXED",
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL",
  "signalStrength": number (0-100),
  "topMovements": [
    {
      "address": "string (shortened)",
      "action": "string",
      "amount": "string",
      "significance": "HIGH | MEDIUM | LOW"
    }
  ],
  "patterns": ["pattern1", "pattern2"],
  "trend": "string (summary of what whales are doing)",
  "recommendation": "string (actionable signal for agents/traders)"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { address?: string; chain?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.address) body.address = url.searchParams.get('address') || url.searchParams.get('token') || undefined

    const { address } = body
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Provide a valid wallet or token address (0x...)' }, { status: 400 })
    }

    console.log(`[WhaleTracker] Tracking: ${address}`)

    const txs = await basescan.getTokenTx(address, 50)
    const largeTxs = txs
      .filter((tx: any) => {
        const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'))
        return value > 1000
      })
      .slice(0, 15)
      .map((tx: any) => ({
        from: tx.from?.slice(0, 10) + '...',
        to: tx.to?.slice(0, 10) + '...',
        token: tx.tokenSymbol,
        value: tx.value,
        decimals: tx.tokenDecimal,
        direction: tx.to?.toLowerCase() === address.toLowerCase() ? 'IN' : 'OUT',
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      }))

    const raw = await callLLM({
      system: SYSTEM,
      user: `Analyze whale/smart money activity for: ${address}\n\nLarge transactions (>${1000} tokens):\n${JSON.stringify(largeTxs, null, 2)}\nTotal transactions analyzed: ${txs.length}`,
      temperature: 0.4,
      maxTokens: 700,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[WhaleTracker] Error:', error)
    return Response.json({ error: 'Whale tracking failed', message: (error as Error).message }, { status: 500 })
  }
}
