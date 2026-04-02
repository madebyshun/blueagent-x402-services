// x402/deep-analysis/index.ts
// Deep Project Due Diligence - 0.35 USDC per analysis
// Powered by Blue Agent

async function callLLM(options: {
  model: string;
  system: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { model, system, messages, temperature = 0.7, maxTokens = 1400 } = options;

  const response = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BANKR_API_KEY!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.content && Array.isArray(data.content)) {
    return data.content[0].text;
  }
  if (data.text) return data.text;

  throw new Error('Invalid response format from LLM');
}

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { contractAddress?: string; projectName?: string; ticker?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no body or not JSON
    }

    const { contractAddress, projectName, ticker } = body;

    if (!contractAddress && !projectName) {
      return Response.json(
        { error: 'Please provide either contractAddress or projectName' },
        { status: 400 }
      );
    }

    const input = contractAddress
      ? contractAddress
      : `${projectName}${ticker ? ` (${ticker})` : ''}`;

    console.log(`[BlueAgent DeepAnalysis] Analyzing: ${input}`);

    const systemPrompt = `You are a senior crypto due diligence analyst on Base chain, powered by Blue Agent.

Return ONLY a valid JSON object with this exact structure. No extra text:

{
  "projectName": "string",
  "ticker": "string or null",
  "contractAddress": "string or null",
  "riskScore": number (0-100, higher = riskier),
  "overallScore": number (0-100),
  "rugProbability": number (0-100),
  "categories": {
    "Tokenomics": number (0-100),
    "Liquidity": number (0-100),
    "CodeQuality": number (0-100),
    "TeamActivity": number (0-100),
    "Community": number (0-100),
    "Transparency": number (0-100)
  },
  "keyRisks": ["short risk point 1", "short risk point 2"],
  "keyStrengths": ["short strength point 1", "short strength point 2"],
  "summary": "Professional 3-4 sentence summary",
  "recommendation": "Strong Buy | Buy | Caution | Avoid | High Risk",
  "suggestedActions": ["actionable recommendation 1", "actionable recommendation 2"]
}`;

    const llmResponse = await callLLM({
      model: 'claude-sonnet-4.6',
      system: systemPrompt,
      messages: [{ role: 'user', content: `Perform a deep due diligence analysis on: ${input}` }],
      temperature: 0.65,
      maxTokens: 1400,
    });

    const result = JSON.parse(llmResponse);
    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('[BlueAgent DeepAnalysis] Error:', error);
    return Response.json(
      { error: 'Failed to perform deep project analysis', message: (error as Error).message },
      { status: 500 }
    );
  }
}
