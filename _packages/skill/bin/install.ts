#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const TOOL_COUNT = 31

const CONFIG_PATHS = {
  'claude-code': join(homedir(), '.claude', 'claude_desktop_config.json'),
  'claude-desktop': {
    darwin: join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    linux:  join(homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
    win32:  join(process.env.APPDATA ?? homedir(), 'Claude', 'claude_desktop_config.json'),
  },
  'cursor': join(homedir(), '.cursor', 'mcp.json'),
}

function readConfig(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  try { return JSON.parse(readFileSync(path, 'utf-8')) } catch { return {} }
}

function writeConfig(path: string, config: Record<string, any>) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n')
}

const SERVER_ENTRY = {
  command: 'npx',
  args: ['@blueagent/skill'],
  env: { WALLET_PRIVATE_KEY: '' },
}

function installToPath(path: string, label: string) {
  const config = readConfig(path)
  config.mcpServers ??= {}
  config.mcpServers['blueagent'] = SERVER_ENTRY
  writeConfig(path, config)
  console.log(`  ✓ ${label} → ${path}`)
}

function main() {
  const flag = process.argv[2] ?? '--claude'
  const platform = process.platform as 'darwin' | 'linux' | 'win32'

  console.log(`\nBlueAgent MCP — installing ${TOOL_COUNT} tools\n`)

  if (flag === '--claude' || flag === '--all') {
    installToPath(CONFIG_PATHS['claude-code'], 'Claude Code')
  }
  if (flag === '--desktop' || flag === '--all') {
    const path = CONFIG_PATHS['claude-desktop'][platform] ?? CONFIG_PATHS['claude-desktop']['linux']
    installToPath(path, 'Claude Desktop')
  }
  if (flag === '--cursor' || flag === '--all') {
    installToPath(CONFIG_PATHS['cursor'], 'Cursor')
  }

  console.log(`
Next steps:
  1. Set your wallet private key:
       export WALLET_PRIVATE_KEY=0x<your_key>

  2. Ensure your wallet has USDC on Base for x402 payments

  3. Restart Claude Code / Claude Desktop / Cursor

  4. Ask Claude: "use blueagent to check if 0x... is a honeypot"

  ${TOOL_COUNT} tools available — costs USDC per call, no subscription needed.
  Docs: https://github.com/madebyshun/blueagent-x402-services
`)
}

main()
