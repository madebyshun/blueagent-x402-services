import React, { useState } from 'react'
import { Box } from 'ink'
import { Logo } from './Logo.js'
import { CategoryMenu, type Category } from './components/CategoryMenu.js'
import { ToolMenu } from './components/ToolMenu.js'
import { ToolRunner } from './components/ToolRunner.js'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

type Screen = 'home' | 'tools' | 'runner'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'
const WALLET_KEY = process.env.WALLET_PRIVATE_KEY ?? ''

const CAIP2: Record<string, string> = {
  'eip155:8453':  'base',
  'eip155:84532': 'base-sepolia',
  'eip155:1':     'ethereum',
  'eip155:137':   'polygon',
}

async function paidCall(ep: string, body: Record<string, string>): Promise<unknown> {
  if (!WALLET_KEY) throw new Error('WALLET_PRIVATE_KEY not set')

  const account = privateKeyToAccount(WALLET_KEY as `0x${string}`)
  const wallet = createWalletClient({ account, chain: base, transport: http() })

  const url = `${BASE_URL}/${ep}`
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }

  const res1 = await fetch(url, opts)
  if (res1.status !== 402) return res1.json()

  const { x402Version, accepts } = await res1.json() as { x402Version: number; accepts: any[] }

  const req = accepts
    .map((a: any) => ({ ...a, network: CAIP2[a.network] ?? a.network }))
    .find((a: any) => a.network === 'base')

  if (!req) throw new Error('No Base (USDC) payment requirement found')

  const { createPaymentHeader } = await import('x402/client' as any)
  const paymentHeader = await createPaymentHeader(wallet as any, x402Version, req)

  const res2 = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers as Record<string, string>), 'X-PAYMENT': paymentHeader },
  })
  return res2.json()
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [category, setCategory] = useState<Category>('security')
  const [endpoint, setEndpoint] = useState('')
  const [params, setParams] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  async function runTool(ep: string, body: Record<string, string>) {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await paidCall(ep, body)
      setResult(res)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Logo />
      {screen === 'home' && (
        <CategoryMenu
          onSelect={(cat) => { setCategory(cat); setScreen('tools') }}
        />
      )}
      {screen === 'tools' && (
        <ToolMenu
          category={category}
          onSelect={(ep, ps) => {
            setEndpoint(ep)
            setParams(ps)
            setResult(null)
            setError(null)
            setScreen('runner')
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'runner' && (
        <ToolRunner
          endpoint={endpoint}
          params={params}
          onRun={runTool}
          onBack={() => setScreen('tools')}
          loading={loading}
          result={result}
          error={error}
        />
      )}
    </Box>
  )
}
