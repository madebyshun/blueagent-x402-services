# BlueAgent × Claude Code

31 pay-per-use x402 tools available directly in Claude Code via MCP.

## Quick Setup (2 minutes)

### 1. Install the MCP server

```bash
npx @blueagent/skill install --claude
```

This writes the server config to `~/.claude/claude_desktop_config.json`.

### 2. Set your wallet

```bash
export WALLET_PRIVATE_KEY=0x<your_base_wallet_private_key>
```

Your wallet needs a small amount of USDC on Base for payments. Tools cost $0.05–$5.00 each.

### 3. Restart Claude Code

```
/restart
```

You'll see **31 BlueAgent tools** in the MCP tools list.

---

## Using Tools

Ask Claude naturally — it picks the right tool automatically:

```
"Is 0x4200... a honeypot?"
→ uses honeypot-check ($0.05)

"Check if my wallet 0xabc... has any dangerous approvals"
→ uses allowance-audit ($0.20)

"What's the quantum risk for this wallet: 0x..."
→ uses quantum ($1.50)

"Find the best USDC yield on Base with low risk"
→ uses yield-optimizer ($0.15)

"Analyze $BRETT tokenomics"
→ uses analyze + tokenomics-score ($0.35 + $0.50)

"Should my agent pause? It lost $340 in 3 trades"
→ uses circuit-breaker ($0.50)
```

---

## All 31 Tools

| Tool | Price | What it does |
|------|-------|-------------|
| `riskcheck` | $0.05 | APPROVE / WARN / BLOCK before any transaction |
| `honeypot-check` | $0.05 | Detect rug pull contracts |
| `allowance-audit` | $0.20 | Find dangerous token approvals |
| `phishing-scan` | $0.10 | Scan URLs and handles for scams |
| `mev-shield` | $0.30 | MEV sandwich risk before swaps |
| `contract-trust` | $0.25 | Trust score for any contract |
| `aml-screen` | $0.25 | AML compliance check |
| `circuit-breaker` | $0.50 | CONTINUE / PAUSE / HALT for agents |
| `quantum` | $1.50 | Full quantum vulnerability report |
| `quantum-batch` | up to $2.50 | Scan up to 10 wallets |
| `quantum-migrate` | $2.00 | Quantum-safe migration plan |
| `quantum-timeline` | $0.40 | Threat timeline 2026–2035 |
| `key-exposure` | $0.50 | Check if public key is on-chain |
| `analyze` | $0.35 | Deep project due diligence |
| `tokenomics-score` | $0.50 | Supply, inflation, unlock cliff |
| `whitepaper-tldr` | $0.20 | Summarize whitepaper in 5 bullets |
| `narrative-pulse` | $0.40 | Trending narratives |
| `vc-tracker` | $1.00 | VC investment activity |
| `launch-advisor` | $3.00 | Token launch playbook |
| `grant-evaluator` | $5.00 | Base grant scoring |
| `x402-readiness` | $1.00 | API x402 readiness audit |
| `base-deploy-check` | $0.50 | Contract pre-deployment check |
| `pnl` | $1.00 | Wallet PnL report |
| `whale-tracker` | $0.10 | Smart money flow |
| `dex-flow` | $0.15 | DEX buy/sell pressure |
| `airdrop-check` | $0.10 | Base airdrop eligibility |
| `alert-check` | $0.10 | Active alert triggers |
| `yield-optimizer` | $0.15 | Best APY on Base DeFi |
| `lp-analyzer` | $0.25 | LP position health |
| `tax-report` | $2.00 | On-chain tax summary |
| `alert-subscribe` | $0.50 | Real-time webhook alerts |

---

## ZHC Agent Safety Pattern (CLAUDE.md)

Add this to your project's `CLAUDE.md` to make Claude always run safety checks:

```markdown
## Onchain Safety Rules

Before any transaction:
1. Run `riskcheck` with the action description — BLOCK if decision is BLOCK
2. For token purchases: run `honeypot-check` on the contract first
3. After 3 consecutive failures: run `circuit-breaker` with context

Wallet: 0x<your_agent_wallet>
```

---

## Manual Config

If the installer didn't work, add this to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blueagent": {
      "command": "npx",
      "args": ["@blueagent/skill"],
      "env": {
        "WALLET_PRIVATE_KEY": "0x<your_key>"
      }
    }
  }
}
```
