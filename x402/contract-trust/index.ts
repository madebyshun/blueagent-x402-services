import { callLLM } from '../_lib/llm.js'
import { basescan } from '../_lib/basescan.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a smart contract trust analyst for AI agents on Base chain. Your job is to determine if a contract is safe for an autonomous agent to interact with.

Assess trust based on:
- Source code verification on Basescan
- ABI structure (presence of dangerous functions)
- Contract age and transaction volume
- Known protocol associations
- Proxy patterns and upgrade mechanisms
- Admin key risks and centralization

Return ONLY valid JSON:

{
  "trustScore": number (0-100, higher = more trusted),
  "verdict": "TRUSTED" | "CAUTION" | "AVOID",
  "verified": boolean,
  "flags": ["flag1", "flag2"],
  "strengths": ["strength1", "strength2"],
  "riskFactors": ["risk1", "risk2"],
  "agentSafe": boolean,
  "recommendation": "string (specific guidance for autonomous agent)"
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

    const { address } = body
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Provide a valid contract address (0x...)' }, { status: 400 })
    }

    console.log(`[ContractTrust] Evaluating: ${address}`)

    let contractData: any = { verified: false, abi: null }
    try { contractData = await basescan.getABI(address) } catch {}

    const txs = await basescan.getTxList(address, 10).catch(() => [])

    const raw = await callLLM({
      system: SYSTEM,
      user: `Evaluate trust for contract on Base:\nAddress: ${address}\nVerified: ${contractData.verified}\nABI available: ${!!contractData.abi && contractData.abi !== 'Contract source code not verified'}\nABI preview: ${contractData.abi ? String(contractData.abi).slice(0, 600) : 'Not available'}\nRecent tx count: ${txs.length}`,
      temperature: 0.2,
      maxTokens: 700,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[ContractTrust] Error:', error)
    return Response.json({ error: 'Contract trust evaluation failed', message: (error as Error).message }, { status: 500 })
  }
}
