import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a wallet security expert auditing dangerous token approvals (allowances) for AI agents and wallets on Base.

Analyze transaction history for risky ERC-20 approvals. Focus on:
- Unlimited approvals (type(uint256).max)
- Approvals to unverified or suspicious contracts
- Stale approvals to deprecated protocols
- High-value approvals that should be revoked

Return ONLY valid JSON:

{
  "totalRisk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskScore": number (0-100),
  "dangerousApprovals": [
    {
      "token": "string",
      "spender": "string",
      "risk": "HIGH" | "MEDIUM" | "LOW",
      "reason": "string",
      "action": "REVOKE" | "MONITOR" | "OK"
    }
  ],
  "immediateActions": ["action1", "action2"],
  "summary": "2-3 sentence summary",
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

    console.log(`[AllowanceAudit] Auditing: ${address}`)

    const txs = await basescan.getTxList(address, 100)
    // Filter likely approval transactions (sent from wallet, not contract creation)
    const approvalTxs = txs
      .filter((tx: any) => tx.from?.toLowerCase() === address.toLowerCase() && tx.input && tx.input.startsWith('0x095ea7b3'))
      .slice(0, 20)
      .map((tx: any) => ({
        to: tx.to,
        input: tx.input.slice(0, 100),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      }))

    const raw = await callLLM({
      system: SYSTEM,
      user: `Audit token approvals for wallet: ${address}\n\nApproval transactions found (${approvalTxs.length}):\n${JSON.stringify(approvalTxs, null, 2)}\n\nTotal transactions analyzed: ${txs.length}`,
      temperature: 0.2,
      maxTokens: 800,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[AllowanceAudit] Error:', error)
    return Response.json({ error: 'Allowance audit failed', message: (error as Error).message }, { status: 500 })
  }
}
