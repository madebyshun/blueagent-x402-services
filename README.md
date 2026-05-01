# BlueAgent x402 Services

> **Security OS for Autonomous Agents on Base** — 32 pay-per-use AI tools via x402 protocol.
> No subscription. No API key. Pay USDC per call.

Built for AI agents, Zero-Human Companies (ZHC), and Base ecosystem builders.

**Website:** https://blueagent.dev  
**Base URL:** `https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/`

---

## For AI Agents — Choose Your Integration

| I want to... | Use |
|---|---|
| Use BlueAgent tools inside **Claude Code or Claude Desktop** | [`@blueagent/skill`](#mcp-claude-code--cursor) MCP server |
| Use BlueAgent tools inside **Cursor** | [`@blueagent/skill`](#mcp-claude-code--cursor) MCP server |
| Call tools from **TypeScript/Node.js code** | [`@blueagent/sdk`](#sdk) |
| Use with **Coinbase AgentKit** | [`@blueagent/agentkit`](#agentkit) |
| Call via **HTTP** (any language) | [Direct x402 call](#direct-x402) |
| Explore from **terminal** | [`@blueagent/cli`](#cli) |

---

## MCP — Claude Code & Cursor

32 tools, 3 steps. Works in Claude Code CLI, Claude Desktop, and Cursor.

### Step 1 — Run the installer

```bash
npx @blueagent/skill install --claude     # Claude Code CLI  ← most common
npx @blueagent/skill install --desktop    # Claude Desktop app
npx @blueagent/skill install --cursor     # Cursor
npx @blueagent/skill install --all        # All editors at once
```

This writes the MCP server config to the correct settings file for each editor automatically.

### Step 2 — Add your wallet key

Open the config file that was printed (e.g. `~/.claude/settings.json`) and fill in your private key:

```json
"env": {
  "WALLET_PRIVATE_KEY": "0x<your_64_char_hex_key>"
}
```

**Don't have a key yet?**

```bash
# Option A — Export from MetaMask
# MetaMask → click account name → ⋮ menu → Account Details → Export Private Key

# Option B — Create a new wallet on the spot (fund it after)
node -e "const {generatePrivateKey} = require('viem/accounts'); console.log(generatePrivateKey())"

# Fund with USDC on Base (min ~$1 for testing)
# Bridge at: https://bridge.base.org
```

### Step 3 — Restart your editor

Close and reopen Claude Code / Claude Desktop / Cursor.

Then type `/mcp` — you should see **blueagent** with status **connected** and 32 tools.

### Verify it's working

Ask Claude:

```
"Is 0x4200000000000000000000000000000000000006 a honeypot?"
"Check my wallet 0x... for dangerous approvals"
"What's the best USDC yield on Base right now?"
"Run a quantum risk check on 0xabc..."
```

---

### Manual config (if installer doesn't work)

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "blueagent": {
      "command": "npx",
      "args": ["-y", "@blueagent/skill"],
      "env": {
        "WALLET_PRIVATE_KEY": "0x<your_key>"
      }
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):
```json
{
  "mcpServers": {
    "blueagent": {
      "command": "npx",
      "args": ["-y", "@blueagent/skill"],
      "env": {
        "WALLET_PRIVATE_KEY": "0x<your_key>"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "blueagent": {
      "command": "npx",
      "args": ["-y", "@blueagent/skill"],
      "env": {
        "WALLET_PRIVATE_KEY": "0x<your_key>"
      }
    }
  }
}
```

Full setup guide: [docs/claude-code.md](docs/claude-code.md) · [docs/cursor.md](docs/cursor.md)

---

## Ecosystem

| Package | Description | Install |
|---------|-------------|---------|
| [`@blueagent/skill`](https://npmjs.com/package/@blueagent/skill) | MCP server — 32 tools for Claude Code, Claude Desktop, Cursor | `npx @blueagent/skill install --claude` |
| [`@blueagent/sdk`](https://npmjs.com/package/@blueagent/sdk) | TypeScript SDK — namespaced methods | `npm i @blueagent/sdk` |
| [`@blueagent/x402-guard`](https://npmjs.com/package/@blueagent/x402-guard) | Security middleware — check recipients before paying | `npm i @blueagent/x402-guard` |
| [`@blueagent/agentkit`](https://npmjs.com/package/@blueagent/agentkit) | Coinbase AgentKit plugin — 32 actions | `npm i @blueagent/agentkit` |
| [`@blueagent/cli`](https://npmjs.com/package/@blueagent/cli) | Terminal CLI — TUI, natural language | `npm i -g @blueagent/cli` |

---

## Quick Start

### CLI
```bash
npm install -g @blueagent/cli
blueagent setup
blueagent honeypot-check 0xTOKEN_ADDRESS
blueagent risk-gate "approve USDC to 0xDEX"
blueagent analyze "$BRETT"
blueagent yield USDC
blueagent ask "is this wallet safe to trade with?"
```

### SDK
```typescript
import { BlueAgent } from '@blueagent/sdk'

const ba = new BlueAgent({ privateKey: process.env.WALLET_PRIVATE_KEY })

const check = await ba.security.riskcheck({ action: 'swap 100 USDC', amount: '$100' })
if (check.decision === 'BLOCK') return

const analysis = await ba.research.analyze({ projectName: '$BRETT' })
const yields   = await ba.earn.yieldOptimizer({ token: 'USDC', riskTolerance: 'LOW' })
const pnl      = await ba.data.pnl({ address: '0x...' })
```

### AgentKit
```typescript
import { blueagentPlugin } from '@blueagent/agentkit'
import { AgentKit } from '@coinbase/agentkit'

const agentkit = await AgentKit.from({
  cdpApiKeyId: '...',
  cdpApiKeySecret: '...',
  actionProviders: [blueagentPlugin()],
})
```

### MCP (Claude Code)
```bash
npx @blueagent/skill install --claude
# Restart Claude Code → 32 BlueAgent tools available
```

### Direct x402

No SDK — works from any language via HTTP:

```typescript
import { wrapFetchWithPayment } from 'x402-fetch'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'

const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`),
  chain: base, transport: http(),
})
const paidFetch = wrapFetchWithPayment(fetch, wallet as any)

// Discover all tools — FREE
const tools = await fetch(`${BASE_URL}/discover`).then(r => r.json())

// Call any tool
const result = await paidFetch(`${BASE_URL}/honeypot-check`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: '0xabcd...' }),
}).then(r => r.json())
```

More examples: [`docs/examples/`](docs/examples/)

### Bankr CLI
```bash
bankr x402 call 0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/risk-gate \
  -X POST -d '{"action":"swap 100 USDC","amount":"$100"}' -y
```

---

## Services

### Quantum Security

| Service | Price | Description |
|---------|-------|-------------|
| `quantum-premium` | $1.50 | Full quantum vulnerability report — exposure, threat level, migration steps |
| `quantum-batch` | up to $2.50 | Scan 1–10 wallets at $0.25 each |
| `quantum-migrate` | $2.00 | Step-by-step quantum-safe wallet migration plan |
| `quantum-timeline` | $0.40 | Evidence-based quantum threat timeline 2026–2035 |
| `key-exposure` | $0.50 | Check if wallet public key is exposed on-chain |

### Agent Safety

| Service | Price | Description |
|---------|-------|-------------|
| `risk-gate` | $0.05 | Pre-transaction safety — APPROVE / WARN / BLOCK with risk score |
| `honeypot-check` | $0.05 | Detect honeypot or rug pull token contracts |
| `allowance-audit` | $0.20 | Find unlimited token approvals — revoke recommendations |
| `phishing-scan` | $0.10 | Scan URL, address, or @handle for phishing |
| `mev-shield` | $0.30 | MEV sandwich attack risk before large swaps |
| `contract-trust` | $0.25 | Trust score — verified, audited, safe for agent interaction? |
| `aml-screen` | $0.25 | AML compliance — CLEAN / SUSPICIOUS / HIGH_RISK |
| `circuit-breaker` | $0.50 | CONTINUE / PAUSE / HALT for autonomous agents and ZHC |
| `agent-payload-inspector` | $0.10 | Detect prompt injection in AI agent payloads — SAFE / SUSPICIOUS / INJECTION |

### Research

| Service | Price | Description |
|---------|-------|-------------|
| `deep-analysis` | $0.35 | Deep due diligence — risk score, rug probability, recommendation |
| `tokenomics-score` | $0.50 | Supply, inflation, unlock cliff — sustainability score |
| `whitepaper-tldr` | $0.20 | Summarize any whitepaper into 5 key bullets |
| `narrative-pulse` | $0.40 | Trending narratives in crypto and Base ecosystem |
| `vc-tracker` | $1.00 | VC investment activity — hot sectors, who backs what |
| `launch-advisor` | $3.00 | Full token launch playbook — tokenomics, 8-week timeline, KPIs |
| `grant-evaluator` | $5.00 | Base ecosystem grant scoring — Fund/Decline recommendation |
| `x402-readiness` | $1.00 | Audit any API for x402 payment protocol readiness |
| `base-deploy-check` | $0.50 | Pre-deployment security check — vulnerabilities, go/no-go |

### Data

| Service | Price | Description |
|---------|-------|-------------|
| `wallet-pnl` | $1.00 | Wallet PnL — win rate, trading style, smart money score |
| `whale-tracker` | $0.10 | Smart money flow — accumulation vs distribution |
| `dex-flow` | $0.15 | DEX buy/sell pressure — live DexScreener data |
| `airdrop-check` | $0.10 | Base airdrop eligibility — protocols, activity score, estimated value |
| `alert-check` | $0.10 | Check active alert triggers for any address |

### Earn

| Service | Price | Description |
|---------|-------|-------------|
| `yield-optimizer` | $0.15 | Best APY on Base DeFi — live DeFiLlama data |
| `lp-analyzer` | $0.25 | LP position — impermanent loss, fee income, rebalance signal |
| `tax-report` | $2.00 | On-chain tax summary — realized gains, taxable events |
| `alert-subscribe` | $0.50 | Subscribe to whale/circuit-breaker alerts via webhook |

---

## ZHC Agent Safety Pattern

```typescript
import { BlueAgent } from '@blueagent/sdk'

const ba = new BlueAgent({ privateKey: process.env.WALLET_PRIVATE_KEY })

async function safeExecute(action: string, contract: string, amount: string) {
  const risk = await ba.security.riskcheck({ action, contractAddress: contract, amount })
  if (risk.decision === 'BLOCK') return null

  const hp = await ba.security.honeypotCheck({ token: contract })
  if (hp.isHoneypot) return null

  // execute transaction...

  const cb = await ba.security.circuitBreaker({ context: 'loss detected', recentLosses: amount })
  if (cb.decision === 'HALT') process.exit(0)
}
```

---

## Deploy & Develop

```bash
# Deploy single service
bankr x402 deploy risk-gate

# Deploy all services
bankr x402 deploy

# After editing _lib/ — re-inline helpers then deploy
node scripts/inline-libs.js
bankr x402 deploy
```

---

## Developer Docs

| Doc | Description |
|-----|-------------|
| [`docs/claude-code.md`](docs/claude-code.md) | Full Claude Code MCP setup guide + all 31 tools |
| [`docs/cursor.md`](docs/cursor.md) | Cursor MCP setup guide |
| [`docs/mcp-tools.json`](docs/mcp-tools.json) | Machine-readable MCP tool schema (input/output for all 31 tools) |
| [`docs/examples/sdk-basic.ts`](docs/examples/sdk-basic.ts) | SDK usage examples |
| [`docs/examples/agentkit-safety.ts`](docs/examples/agentkit-safety.ts) | AgentKit safe agent pattern |
| [`docs/examples/direct-x402.ts`](docs/examples/direct-x402.ts) | Direct HTTP x402 calls (no SDK) |

---

## Resources

- **GitHub:** https://github.com/madebyshun/blueagent-x402-services
- **Token:** $BLUEAGENT on Base
- **Community:** https://t.me/blueagent_hub
- **Skills:** https://skills.bankr.bot
