# blueagent-x402-services

BlueAgent — 31 pay-per-use AI-agent tools on Base, paid via the x402 protocol (USDC, no API keys).

## Repo structure

```
_packages/
  sdk/          @blueagent/sdk        — TypeScript SDK for all 31 tools
  skill/        @blueagent/skill      — MCP server for Claude Code / Cursor
  agentkit/     @blueagent/agentkit   — Coinbase AgentKit plugin
  x402-guard/   @blueagent/x402-guard — Security middleware (check before pay)
  cli/          @blueagent/cli        — CLI tool

x402/           Live x402 server handlers (one dir per tool)
demo/           Remotion launch video (React, 1920×1080)
docs/           Integration guides (claude-code.md, cursor.md)
bankr.x402.json Canonical service manifest (31 tools, prices, schemas)
services.json   agentic.market auto-discovery file
```

## Packages

### @blueagent/sdk
```ts
import { BlueAgent } from '@blueagent/sdk'
const agent = new BlueAgent({ privateKey: process.env.PRIVATE_KEY! })
await agent.security.riskcheck({ action: 'approve USDC to 0xABC' })
await agent.security.honeypotCheck({ token: '0x...' })
await agent.research.analyze({ projectName: '$TOKEN' })
```

### @blueagent/skill (MCP server)
```bash
npx @blueagent/skill install --claude
export WALLET_PRIVATE_KEY=0x...
```
Exposes all 31 tools inside Claude Code via MCP.

### @blueagent/x402-guard
```ts
import { X402Guard } from '@blueagent/x402-guard'
const guard = new X402Guard({ wallet: process.env.PRIVATE_KEY! })
const safeFetch = guard.wrapFetch(fetch)  // auto-checks recipients before paying
```

### @blueagent/agentkit
```ts
import { blueAgentTools } from '@blueagent/agentkit'
// pass to AgentKit as actionProviders
```

## Build

```bash
cd _packages/sdk && npm run build
cd _packages/skill && npm run build
cd _packages/agentkit && npm run build
cd _packages/x402-guard && npm run build
```

## x402 endpoints

Base URL: `https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5`

All 31 endpoints are in `bankr.x402.json`. Categories:
- **safety** (8): risk-gate, honeypot-check, allowance-audit, phishing-scan, mev-shield, contract-trust, aml-screen, circuit-breaker
- **quantum** (5): quantum-premium, quantum-batch, quantum-migrate, quantum-timeline, key-exposure
- **research** (9): deep-analysis, tokenomics-score, whitepaper-tldr, narrative-pulse, vc-tracker, launch-advisor, grant-evaluator, x402-readiness, base-deploy-check
- **data** (5): wallet-pnl, whale-tracker, dex-flow, airdrop-check, alert-check
- **earn** (4): yield-optimizer, lp-analyzer, tax-report, alert-subscribe

## Dev branch

Active work: `claude/check-x402-uSibo`

## Key files to know

- `bankr.x402.json` — source of truth for all tools, prices, schemas
- `_packages/skill/src/skills/` — MCP tool definitions (security, research, data, earn)
- `_packages/sdk/src/index.ts` — SDK class with all tool wrappers
- `_packages/x402-guard/src/guard.ts` — guard logic, calls live Bankr endpoints
- `services.json` — served at blueagent.dev/services.json for agentic.market indexing
