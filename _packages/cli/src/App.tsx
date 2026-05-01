import React, { useState } from 'react'
import { Box } from 'ink'
import { Logo } from './Logo.js'
import { CategoryMenu, type Category } from './components/CategoryMenu.js'
import { ToolMenu } from './components/ToolMenu.js'
import { ToolRunner } from './components/ToolRunner.js'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { wrapFetchWithPayment } from 'x402-fetch'

type Screen = 'home' | 'tools' | 'runner'

const BASE_URL = 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5'
const WALLET_KEY = process.env.WALLET_PRIVATE_KEY ?? ''

function makePaidFetch() {
  if (!WALLET_KEY) throw new Error('WALLET_PRIVATE_KEY not set')
  const account = privateKeyToAccount(WALLET_KEY as `0x${string}`)
  const wallet = createWalletClient({ account, chain: base, transport: http() })
  return wrapFetchWithPayment(fetch, wallet as any) as typeof fetch
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
      const paidFetch = makePaidFetch()
      const res = await paidFetch(`${BASE_URL}/${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json())
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
