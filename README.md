# BlueAgent x402 Services

> Collection of AI-powered services on Base — pay-per-use via x402 protocol

Powered by **Blue Agent** × **Bankr x402 Cloud**. No subscription, no API keys for users — just pay USDC per call.

---

## 🚀 Live Services

| Service | Price | Description |
|---------|-------|-------------|
| [`deep-analysis`](#deep-analysis) | $0.35/req | Due diligence for any Base token or project |
| [`wallet-pnl`](#wallet-pnl) | $1.00/req | PnL report for any Base wallet |
| [`launch-advisor`](#launch-advisor) | $3.00/req | Full launch playbook for Base founders |
| [`grant-evaluator`](#grant-evaluator) | $5.00/req | Grant application scoring (Base/Coinbase criteria) |
| [`risk-gate`](#risk-gate) | $0.05/req | Safety check before agents execute transactions |

**Base URL:** `https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/`

---

## 📦 Quick Start

### Option 1: Bankr CLI (easiest)

```bash
# Install Bankr CLI
npm install -g @bankr/cli

# Call any service (payment handled automatically)
bankr x402 call 0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/deep-analysis \
  --body '{"projectName": "Uniswap"}'
```

### Option 2: x402-fetch (for developers)

```bash
npm install x402-fetch viem
```

```js
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');
const wallet = createWalletClient({ account, chain: base, transport: http() });
const paidFetch = wrapFetchWithPayment(fetch, wallet);

const res = await paidFetch(
  'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/deep-analysis',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName: 'Uniswap' })
  }
);
const data = await res.json();
console.log(data);
```

### Option 3: Discover on Marketplace

```bash
bankr x402 search blue agent
```

---

## 📋 Services

### deep-analysis

Deep due diligence for any Base token or project.

**Endpoint:** `POST /deep-analysis`  
**Price:** $0.35 USDC/req

**Input:**
```json
{
  "contractAddress": "0x...",
  "projectName": "Uniswap",
  "ticker": "UNI"
}
```
> Provide `contractAddress` OR `projectName` (at least one required)

**Output:**
```json
{
  "projectName": "Uniswap",
  "ticker": "UNI",
  "overallScore": 88,
  "riskScore": 12,
  "rugProbability": 2,
  "categories": {
    "Tokenomics": 85,
    "Liquidity": 95,
    "CodeQuality": 90,
    "TeamActivity": 82,
    "Community": 88,
    "Transparency": 87
  },
  "keyRisks": ["Regulatory uncertainty", "Competitive pressure from aggregators"],
  "keyStrengths": ["Battle-tested codebase", "Deep liquidity"],
  "recommendation": "Strong Buy",
  "summary": "..."
}
```

---

### wallet-pnl

Deep PnL analysis for any Base wallet address.

**Endpoint:** `POST /wallet-pnl`  
**Price:** $1.00 USDC/req

**Input:**
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

**Output:**
```json
{
  "address": "0xd8dA6BF...",
  "period": "Last 30 days",
  "totalTrades": 47,
  "uniqueTokens": 23,
  "estimatedPnL": "+$3,240",
  "winRate": "68%",
  "tradingStyle": "Memecoin Aper",
  "topTokens": ["DEGEN", "BRETT", "TOSHI"],
  "riskProfile": "Aggressive",
  "smartMoneyScore": 72,
  "summary": "..."
}
```

---

### launch-advisor

Full go-to-market playbook for Base token launches.

**Endpoint:** `POST /launch-advisor`  
**Price:** $3.00 USDC/req

**Input:**
```json
{
  "projectName": "MyProject",
  "description": "A DeFi protocol for...",
  "targetAudience": "Base builders and DeFi traders",
  "teamSize": "3",
  "budget": "$10,000-50,000",
  "tokenSupply": "1,000,000,000"
}
```
> Only `projectName` and `description` are required

**Output:**
```json
{
  "launchScore": 78,
  "tokenomics": {
    "suggestedSupply": "1,000,000,000",
    "distribution": {
      "community": "40%",
      "team": "15%",
      "liquidity": "25%",
      "treasury": "15%",
      "marketing": "5%"
    },
    "vestingSchedule": "Team: 12mo cliff + 24mo linear",
    "initialMarketCap": "$500K - $2M"
  },
  "launchTimeline": [...],
  "marketingStrategy": {...},
  "kpis": {...},
  "recommendation": "Go — strong fundamentals, execute marketing early"
}
```

---

### grant-evaluator

Professional grant application scoring using Base/Coinbase grant criteria.

**Endpoint:** `POST /grant-evaluator`  
**Price:** $5.00 USDC/req

**Input:**
```json
{
  "projectName": "MyProject",
  "description": "Building a...",
  "teamBackground": "2 ex-Coinbase engineers...",
  "requestedAmount": "$25,000",
  "milestones": "Month 1: MVP, Month 2: Testnet, Month 3: Mainnet",
  "githubUrl": "https://github.com/...",
  "websiteUrl": "https://..."
}
```
> Only `projectName` and `description` are required

**Output:**
```json
{
  "overallScore": 82,
  "recommendation": "Fund",
  "suggestedGrantSize": "$20,000-25,000",
  "scores": {
    "innovation": 17,
    "baseAlignment": 18,
    "technicalFeasibility": 16,
    "teamQuality": 17,
    "impactPotential": 14
  },
  "strengths": ["Strong team background", "Clear milestones"],
  "concerns": ["Market size unclear"],
  "questionsForTeam": ["What is your user acquisition strategy?"],
  "riskLevel": "Low",
  "executiveSummary": "..."
}
```

---

### risk-gate

Safety check for AI agents before executing onchain transactions.

**Endpoint:** `POST /risk-gate`  
**Price:** $0.05 USDC/req

**Input:**
```json
{
  "action": "buy token on Uniswap",
  "contractAddress": "0x...",
  "amount": "$50",
  "toAddress": "0x...",
  "agentId": "my-trading-agent",
  "context": "User requested purchase of BRETT token"
}
```
> Only `action` is required

**Output:**
```json
{
  "decision": "APPROVE",
  "riskScore": 18,
  "riskLevel": "Low",
  "reasons": ["Verified contract", "Reasonable amount", "Known token"],
  "recommendation": "Safe to proceed",
  "maxSafeAmount": "$200",
  "checks": {
    "contractVerified": true,
    "amountReasonable": true,
    "actionLegitimate": true,
    "addressSuspicious": false
  }
}
```

**Decision values:**
- `APPROVE` — safe to execute
- `WARN` — proceed with caution, check reasons
- `BLOCK` — do not execute, high risk detected

---

## 🏗️ Tech Stack

- **Runtime:** Bankr x402 Cloud (serverless)
- **LLM:** Claude Sonnet 4.6 via Bankr LLM Gateway
- **Payments:** USDC on Base via x402 protocol
- **Onchain data:** Basescan API

---

## 👤 Author

**@madebyshun** — Built on [Blue Agent](https://t.me/BlueAgent_bot) × [Bankr](https://bankr.bot)

- Telegram: [@BlueAgent_bot](https://t.me/BlueAgent_bot)
- Community: [Blue Agent Hub](https://t.me/blueagent_hub)
- Token: $BLUEAGENT on Base
