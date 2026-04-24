# BlueAgent × Cursor

31 pay-per-use x402 security and research tools available in Cursor via MCP.

## Setup

### 1. Install

```bash
npx @blueagent/skill install --cursor
```

Writes to `~/.cursor/mcp.json`.

### 2. Set wallet

```bash
export WALLET_PRIVATE_KEY=0x<your_key>
```

### 3. Restart Cursor

Open **Cursor Settings → MCP** — you should see `blueagent` with 31 tools.

---

## Manual Config

Edit `~/.cursor/mcp.json`:

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

---

## Usage in Cursor Chat

```
@blueagent check if this contract is safe: 0x4200...
@blueagent what's the best USDC yield on Base right now?
@blueagent analyze $BRETT for me
@blueagent run quantum scan on 0xabc...
```

---

## Install All Editors at Once

```bash
npx @blueagent/skill install --all
```

Installs to Claude Code, Claude Desktop, and Cursor simultaneously.
