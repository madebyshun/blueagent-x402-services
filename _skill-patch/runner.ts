import { wrapFetchWithPayment } from 'x402-fetch'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import type { SkillDef } from '../types.js'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'

function buildPaidFetch() {
  const key = process.env.WALLET_PRIVATE_KEY
  if (!key) throw new Error('WALLET_PRIVATE_KEY not set — export WALLET_PRIVATE_KEY=0x...')
  const account = privateKeyToAccount(key as `0x${string}`)
  const wallet = createWalletClient({ account, chain: base, transport: http() })
  return wrapFetchWithPayment(fetch, wallet)
}

export async function runSkill(skill: SkillDef, args: Record<string, unknown>): Promise<unknown> {
  const paidFetch = buildPaidFetch()
  const body = skill.buildBody(args as any)

  const res = await paidFetch(`${BASE_URL}/${skill.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`[${skill.name}] ${res.status}: ${text}`)
  }

  return res.json()
}
