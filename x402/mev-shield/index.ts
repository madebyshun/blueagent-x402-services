import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are an MEV (Maximal Extractable Value) protection expert for DeFi transactions on Base chain.

Analyze the described swap/transaction for MEV attack risk, specifically sandwich attacks and frontrunning.

Context:
- Sandwich attacks: bot frontruns your tx, buys token, lets your tx execute at worse price, then sells
- Risk is higher with: large swaps, low liquidity pools, high slippage tolerance, popular tokens
- Protection: use private mempools (Flashbots Protect), reduce slippage, split orders, use MEV-resistant DEXes

Return ONLY valid JSON:

{
  "mevRisk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "sandwichProbability": number (0-100),
  "estimatedSlippageLoss": "string (e.g. '0.5-2% of trade value')",
  "protectionStrategies": ["strategy1", "strategy2", "strategy3"],
  "recommendedSlippage": "string (e.g. '0.5%')",
  "preferredRoutes": ["route1", "route2"],
  "riskFactors": ["factor1", "factor2"],
  "recommendation": "string (clear action to take)"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { action?: string; chain?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.action) body.action = url.searchParams.get('action') || undefined

    const { action } = body
    if (!action) return Response.json({ error: 'Provide action (e.g. "swap 10 ETH to USDC on Uniswap v3")' }, { status: 400 })

    console.log(`[MevShield] Analyzing: ${action}`)

    const raw = await callLLM({
      system: SYSTEM,
      user: `Assess MEV risk for this transaction on Base:\n${action}\n\nProvide specific protection strategies and recommended settings.`,
      temperature: 0.3,
      maxTokens: 700,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[MevShield] Error:', error)
    return Response.json({ error: 'MEV analysis failed', message: (error as Error).message }, { status: 500 })
  }
}
