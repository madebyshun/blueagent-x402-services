# @blueagent/x402-guard

Security middleware for x402 payments — check before you pay.

Runs BlueAgent security checks (honeypot detection, phishing scan, contract trust, risk gate) on payment recipients before your agent sends USDC via x402.

## Install

```bash
npm install @blueagent/x402-guard
```

## Quick Start

```ts
import { X402Guard } from '@blueagent/x402-guard'

const guard = new X402Guard({
  wallet: process.env.PRIVATE_KEY!, // 0x...
})

// Check an address before paying
const result = await guard.check('0xRecipientAddress')
if (!result.allowed) {
  console.log('Blocked:', result.verdict, result.score)
}
```

## Wrap fetch (recommended)

Automatically intercepts x402 payment flows and checks the recipient before your agent pays:

```ts
import { X402Guard, X402GuardError } from '@blueagent/x402-guard'

const guard = new X402Guard({
  wallet: process.env.PRIVATE_KEY!,
  checks: ['honeypot', 'phishing', 'risk-gate'],
  blockOn: 'SUSPICIOUS',
})

const safeFetch = guard.wrapFetch(fetch)

try {
  const res = await safeFetch('https://some-api.com/endpoint')
  // payment was checked and sent safely
} catch (err) {
  if (err instanceof X402GuardError) {
    console.log('Blocked payment:', err.result.verdict)
  }
}
```

## Express Middleware

Protect your x402 server from suspicious agents paying you:

```ts
import express from 'express'
import { X402Guard } from '@blueagent/x402-guard'

const guard = new X402Guard({ wallet: process.env.PRIVATE_KEY! })
const app = express()

app.use(guard.middleware())

app.post('/my-service', (req, res) => {
  // only reached if the paying agent passed the guard
  res.json({ result: 'ok' })
})
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wallet` | `string` | required | Private key (`0x...`) to pay for checks via x402 |
| `checks` | `CheckName[]` | `['honeypot', 'risk-gate']` | Which checks to run |
| `blockOn` | `Verdict` | `'SUSPICIOUS'` | Block if verdict is at or above this level |
| `timeout` | `number` | `5000` | Timeout per check in ms |
| `onBlock` | `(result) => void` | `() => {}` | Called when a payment is blocked |

## Checks

| Check | What it detects |
|-------|----------------|
| `honeypot` | Token/contract honeypot traps |
| `phishing` | Known phishing addresses |
| `contract-trust` | Contract risk score (unverified, risky patterns) |
| `risk-gate` | Aggregate risk decision (BLOCK / WARN / APPROVE) |

## Verdicts

`SAFE` → `WARN` → `SUSPICIOUS` → `BLOCK` → `HONEYPOT` (ascending risk)

By default, `SUSPICIOUS` and above are blocked. Set `blockOn: 'BLOCK'` to only block confirmed threats.

## Powered by

[BlueAgent x402 Cloud](https://blueagent.dev) — 31 AI-agent security and intelligence tools on Base, paid per-call via the x402 protocol.

## License

MIT
