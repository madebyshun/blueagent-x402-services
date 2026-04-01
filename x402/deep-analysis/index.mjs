// x402/deep-analysis/index.mjs
// Deep Project Due Diligence Service - 0.35 USDC per analysis

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

    const input = contractAddress 
      ? contractAddress 
      : `${projectName}${ticker ? ` (${ticker})` : ''}`;

    console.log(`[DeepAnalysis] Analyzing: ${input}`);

    const systemPrompt = `You are a senior crypto due diligence analyst specializing in Base chain projects.

Return ONLY a valid JSON object with this exact structure. No extra text or explanation:

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
  "summary":