// deep-analysis.mjs
// BlueAgent Deep Project Due Diligence CLI - Using axios to avoid fetch issues

import dotenv from 'dotenv';
import { parseArgs } from 'util';
import axios from 'axios';

dotenv.config();

const API_URL = 'https://blueagent-x402-services.bankr.bot/deep-analysis';

async function deepAnalysis(input) {
  if (!input) {
    console.error('❌ Usage: node deep-analysis.mjs <contractAddress or projectName>');
    console.error('Example: node deep-analysis.mjs 0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    process.exit(1);
  }

  console.log(`🔍 BlueAgent Deep Analysis on: ${input}`);

  try {
    // Create a fetch-compatible function using axios
    const customFetch = async (url, options = {}) => {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        data: options.body,
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data)
      };
    };

    const { wrapFetchWithPayment } = await import('x402-fetch');

    const fetchWithPayment = wrapFetchWithPayment({
      payment: {
        amount: '0.35',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      settleAfterResponse: true,
      fetch: customFetch
    });

    const response = await fetchWithPayment(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress: input.startsWith('0x') ? input : undefined,
        projectName: input.startsWith('0x') ? undefined : input
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('\n✅ BlueAgent Deep Project Analysis Result:');
    console.log('══════════════════════════════════════════════════════');

    console.log(`Project        : ${data.projectName || 'N/A'}`);
    console.log(`Ticker         : ${data.ticker || 'N/A'}`);
    console.log(`Overall Score  : ${data.overallScore}/100`);
    console.log(`Risk Score     : ${data.riskScore}/100`);
    console.log(`Rug Probability: ${data.rugProbability}%`);
    console.log(`Recommendation : ${data.recommendation}`);

    if (data.categories) {
      console.log('\n📊 Category Scores:');
      Object.entries(data.categories).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(15)}: ${value}`);
      });
    }

    if (data.keyRisks && data.keyRisks.length > 0) {
      console.log('\n⚠️ Key Risks:');
      data.keyRisks.forEach(risk => console.log(`  • ${risk}`));
    }

    if (data.summary) {
      console.log('\n💡 Summary:');
      console.log(data.summary);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.toLowerCase().includes('payment')) {
      console.error('💰 Please make sure you have enough USDC in your wallet.');
    }
  }
}

// Run the CLI
const args = parseArgs({
  options: { help: { type: 'boolean', short: 'h' } },
  allowPositionals: true,
});

if (args.values.help) {
  console.log('Usage: node deep-analysis.mjs <contractAddress or projectName>');
  process.exit(0);
}

const input = args.positionals[0];
deepAnalysis(input);