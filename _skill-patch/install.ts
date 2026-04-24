#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Claude Code on Linux/Mac
const CLAUDE_CODE_CONFIG = join(homedir(), '.claude', 'claude_desktop_config.json')

// Claude Desktop paths
const CLAUDE_DESKTOP_CONFIGS: Record<string, string> = {
  darwin: join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  linux: join(homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
  win32: join(process.env.APPDATA ?? homedir(), 'Claude', 'claude_desktop_config.json'),
}

function readConfig(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  try { return JSON.parse(readFileSync(path, 'utf-8')) } catch { return {} }
}

function writeConfig(path: string, config: Record<string, any>) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n')
}

function injectServer(config: Record<string, any>): Record<string, any> {
  config.mcpServers ??= {}
  config.mcpServers['blueagent'] = {
    command: 'npx',
    args: ['@blueagent/skill'],
    env: {
      WALLET_PRIVATE_KEY: '${WALLET_PRIVATE_KEY}',
    },
  }
  return config
}

function install() {
  const targets: string[] = [CLAUDE_CODE_CONFIG]
  const desktopPath = CLAUDE_DESKTOP_CONFIGS[process.platform]
  if (desktopPath && existsSync(join(desktopPath, '..'))) targets.push(desktopPath)

  for (const path of targets) {
    const config = injectServer(readConfig(path))
    writeConfig(path, config)
    console.log(`✓ Installed → ${path}`)
  }

  console.log('')
  console.log('BlueAgent MCP server installed — 25 x402 tools ready for Claude')
  console.log('')
  console.log('Before using, set your wallet:')
  console.log('  export WALLET_PRIVATE_KEY=0x<your_private_key>')
  console.log('')
  console.log('Restart Claude Code / Claude Desktop to activate.')
}

install()
