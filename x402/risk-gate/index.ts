// x402/risk-gate/index.ts
// Risk Gate for Agents - $0.05 USDC per check
// Powered by Blue Agent

async function callLLM(system: string, userContent: string): Promise<string> {
  const response = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BANKR_API_KEY!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      system,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  if (data.content && Array.isArray(data.content)) return data.content[0].text;
  if (data.text) return data.text;
  throw new Error('Invalid LLM response format');
}

async function checkContractBasic(contractAddress: string): Promise<any> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY || '';
    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return { verified: data.status === '1', hasAbi: data.result !== 'Contract source code not verified' };
  } catch {
    return { verified: false, hasAbi: false };
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: {
      action?: string;           // e.g. "buy token", "transfer USDC", "approve contract"
      contractAddress?: string;  // contract to interact with
      amount?: string;           // amount in USD or token
      toAddress?: string;        // recipient
      agentId?: string;          // which agent is asking
      context?: string;          // additional context
    } = {};
    try {
      const text = await req.text();
      if (text && text.trim().startsWith("{")) body = JSON.parse(text);
    } catch {}

    // Fallback to query params
    const url = new URL(req.url);
    if (!body.action) body.action = url.searchParams.get('action') || undefined;
    if (!body.contractAddress) body.contractAddress = url.searchParams.get('contractAddress') || undefined;
    if (!body.amount) body.amount = url.searchParams.get('amount') || undefined;
    if (!body.toAddress) body.toAddress = url.searchParams.get('toAddress') || undefined;
    if (!body.agentId) body.agentId = url.searchParams.get('agentId') || undefined;
    if (!body.context) body.context = url.searchParams.get('context') || undefined;

    const { action, contractAddress, amount } = body;

    if (!action) {
      return Response.json(
        { error: 'Please provide action to evaluate' },
        { status: 400 }
      );
    }

    console.log(`[RiskGate] Checking: ${action} | contract: ${contractAddress}`);

    // Quick onchain check if contract provided
    let contractCheck = null;
    if (contractAddress && contractAddress.startsWith('0x')) {
      contractCheck = await checkContractBasic(contractAddress);
    }

    const systemPrompt = `You are a risk management system for AI agents executing onchain transactions on Base.

Your job: quickly assess if an action is safe to execute. Be conservative — when in doubt, block.

Red flags to always block:
- Unverified contracts for large amounts
- Unusual approval amounts (type(uint256).max)
- Sending to known scam patterns
- Amount exceeds reasonable limits (>$1000 without explicit override)
- Actions that could drain wallet

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. No code blocks. Start with { and end with }.

Return ONLY a valid JSON object:

{
  "decision": "APPROVE" | "BLOCK" | "WARN",
  "riskScore": number (0-100, higher = riskier),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "reasons": ["reason1", "reason2"],
  "recommendation": "string (what agent should do)",
  "maxSafeAmount": "string (suggested max for this action, e.g. $50)",
  "checks": {
    "contractVerified": boolean | null,
    "amountReasonable": boolean,
    "actionLegitimate": boolean,
    "addressSuspicious": boolean
  }
}`;

    const userPrompt = `Risk check request from agent:

Action: ${action}
Contract Address: ${contractAddress || 'N/A'}
Amount: ${amount || 'Not specified'}
Recipient: ${body.toAddress || 'N/A'}
Agent ID: ${body.agentId || 'unknown'}
Context: ${body.context || 'None provided'}

Contract verification check: ${contractCheck ? JSON.stringify(contractCheck) : 'Not checked'}`;

    const llmResponse = await callLLM(systemPrompt, userPrompt);
// Robust JSON extraction
    let raw = llmResponse.trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
    const result = JSON.parse(raw);

    // Always set contractVerified from onchain check if available
    if (contractCheck && result.checks) {
      result.checks.contractVerified = contractCheck.verified;
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('[RiskGate] Error:', error);
    // On error, default to BLOCK for safety
    return Response.json(
      {
        decision: 'BLOCK',
        riskScore: 100,
        riskLevel: 'Critical',
        reasons: ['Risk evaluation failed — blocking by default for safety'],
        recommendation: 'Do not proceed. Retry or contact support.',
        error: (error as Error).message
      },
      { status: 200 } // Return 200 so agent can read the BLOCK decision
    );
  }
}
