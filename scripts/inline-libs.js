#!/usr/bin/env node
/**
 * Inlines _lib helpers into each x402 service so bankr x402 deploy works.
 * Run from repo root: node scripts/inline-libs.js
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const X402_DIR = join(ROOT, 'x402')

const PREAMBLE = `// ── inline helpers (bankr x402 deploy requires self-contained files) ──────

async function callLLM(opts) {
  const res = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BANKR_LLM_KEY ?? process.env.BANKR_API_KEY ?? '',
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens ?? 800,
    }),
  })
  if (!res.ok) throw new Error(\`LLM error: \${res.status}\`)
  const data = await res.json()
  if (data.content?.[0]?.text) return data.content[0].text
  throw new Error('Invalid LLM response')
}

function extractJSON(raw) {
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('No JSON found in LLM response')
  return JSON.parse(raw.slice(s, e + 1))
}

function extractArray(raw) {
  const s = raw.indexOf('['), e = raw.lastIndexOf(']')
  if (s === -1 || e === -1) return []
  return JSON.parse(raw.slice(s, e + 1))
}

const basescan = {
  async getABI(address) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(\`https://api.basescan.org/api?module=contract&action=getabi&address=\${address}&apikey=\${key}\`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return { verified: data.status === '1', abi: data.result }
  },
  async getTokenTx(address, limit = 50) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(\`https://api.basescan.org/api?module=account&action=tokentx&address=\${address}&sort=desc&offset=\${limit}&apikey=\${key}\`, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return data.status === '1' ? data.result : []
  },
  async getTxList(address, limit = 100) {
    const key = process.env.BASESCAN_API_KEY ?? ''
    const res = await fetch(\`https://api.basescan.org/api?module=account&action=txlist&address=\${address}&sort=desc&offset=\${limit}&apikey=\${key}\`, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    return data.status === '1' ? data.result : []
  },
}

// ─────────────────────────────────────────────────────────────────────────────
`

const LIB_IMPORT_RE = /^import .+ from '\.\.\/\_lib\/[^']+\.js'\n?/gm

const services = readdirSync(X402_DIR).filter(d => {
  if (d === '_lib') return false
  return statSync(join(X402_DIR, d)).isDirectory()
})

let ok = 0, skipped = 0

for (const svc of services) {
  const filePath = join(X402_DIR, svc, 'index.ts')
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    console.log(`  skip  ${svc}  (no index.ts)`)
    skipped++
    continue
  }

  // Skip if already inlined
  if (content.includes('inline helpers')) {
    console.log(`  skip  ${svc}  (already inlined)`)
    skipped++
    continue
  }

  // Remove _lib imports
  const stripped = content.replace(LIB_IMPORT_RE, '')

  // Insert preamble before first non-import line
  const lines = stripped.split('\n')
  let insertAt = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('import ') && lines[i].trim() !== '') {
      insertAt = i
      break
    }
  }

  const before = lines.slice(0, insertAt).join('\n')
  const after = lines.slice(insertAt).join('\n')
  const newContent = (before ? before + '\n\n' : '') + PREAMBLE + after

  writeFileSync(filePath, newContent)
  console.log(`  ✓     ${svc}`)
  ok++
}

console.log(`\nDone — ${ok} services inlined, ${skipped} skipped.`)
console.log('\nNow run:  bankr x402 deploy')
