import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

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
