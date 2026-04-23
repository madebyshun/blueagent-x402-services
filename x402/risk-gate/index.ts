import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a risk management system for AI agents executing onchain transactions on Base.

Assess if an action is safe to execute. Be conservative — when in doubt, block.

Red flags to always block:
- Unverified contracts for large amounts
- Unlimited approval amounts (type(uint256).max)
- Amount exceeds $1000 without explicit override
- Actions that could drain wallet

CRITICAL: Return ONLY raw JSON. Start with { and end with }.

{
  "decision": "APPROVE" | "BLOCK" | "WARN",
  "riskScore": number (0-100, higher = riskier),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "reasons": ["reason1", "reason2"],
  "recommendation": "string",
  "maxSafeAmount": "string",
  "checks": {
    "contractVerified": boolean | null,
    "amountReasonable": boolean,
    "actionLegitimate": boolean,
    "addressSuspicious": boolean
  }
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { action?: string; contractAddress?: string; amount?: string; toAddress?: string; agentId?: string; context?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.action) body.action = url.searchParams.get('action') || undefined
    if (!body.contractAddress) body.contractAddress = url.searchParams.get('contractAddress') || undefined
    if (!body.amount) body.amount = url.searchParams.get('amount') || undefined
    if (!body.toAddress) body.toAddress = url.searchParams.get('toAddress') || undefined
    if (!body.agentId) body.agentId = url.searchParams.get('agentId') || undefined
    if (!body.context) body.context = url.searchParams.get('context') || undefined
    const { action, contractAddress, amount } = body
    if (!action) {
      return Response.json({ error: 'Provide action to evaluate' }, { status: 400 })
    }
    console.log(`[RiskGate] Checking: ${action} | contract: ${contractAddress}`)
    let contractCheck = null
    if (contractAddress && /^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      try { contractCheck = await basescan.getABI(contractAddress) } catch {}
    }
    const raw = await callLLM({
      system: SYSTEM,
      user: `Risk check:\nAction: ${action}\nContract: ${contractAddress ?? 'N/A'}\nAmount: ${amount ?? 'Not specified'}\nRecipient: ${body.toAddress ?? 'N/A'}\nAgent: ${body.agentId ?? 'unknown'}\nContext: ${body.context ?? 'None'}\nContract onchain check: ${contractCheck ? JSON.stringify(contractCheck) : 'Not checked'}`,
      temperature: 0.2,
      maxTokens: 600,
    })
    const result = extractJSON(raw) as any
    if (contractCheck && result.checks) result.checks.contractVerified = contractCheck.verified
    return Response.json(result, { status: 200 })
  } catch (error) {
    console.error('[RiskGate] Error:', error)
    return Response.json({
      decision: 'BLOCK', riskScore: 100, riskLevel: 'Critical',
      reasons: ['Risk evaluation failed — blocking by default'],
      recommendation: 'Do not proceed. Retry or contact support.',
      error: (error as Error).message,
    }, { status: 200 })
  }
}
