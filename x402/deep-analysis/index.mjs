// x402/deep-analysis/index.mjs
// Deep Project Due Diligence Service - 0.35 USDC per call

import { callLLM } from '../../utils/llm.js';

export default async function handler(req) {
  try {
    const { contractAddress, projectName, ticker } = req.body || {};

    if (!contractAddress && !projectName) {
      return {
        status: 400,
        body: { 
          error: "Please provide either contractAddress or projectName" 
        }
      };
    }

    const input = contractAddress || `${projectName} ${ticker ? `(${ticker})` : ''}`;
    console.log(`[DeepAnalysis] Analyzing: ${input}`);

    const systemPrompt = `You are a senior crypto due diligence analyst on Base chain.

Analyze the given project/contract thoroughly and return **ONLY** a valid JSON object with this exact structure:

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
  "summary": "3-4 sentence professional summary",
  "recommendation": "Strong Buy | Buy | Caution | Avoid | High Risk",
  "suggestedActions": ["actionable recommendation 1", "actionable recommendation 2"]
}`;

    const userPrompt = `Perform a deep due diligence analysis on: ${input}`;

    const llmResponse = await callLLM({
      model: "claude-sonnet-4.6",
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.65,
      maxTokens: 1400
    });

    const result = JSON.parse(llmResponse);

    return {
      status: 200,
      body: result
    };

  } catch (error) {
    console.error("[DeepAnalysis] Error:", error);

    return {
      status: 500,
      body: {
        error: "Failed to perform deep project analysis",
        message: error.message
      }
    };
  }
}