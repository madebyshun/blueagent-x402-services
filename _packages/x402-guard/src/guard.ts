import { privateKeyToAccount } from 'viem/accounts'
import { wrapFetchWithPayment, x402Client } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm'
import type { CheckName, CheckResult, GuardResult, Verdict, X402GuardOptions } from './types.js'
import { X402GuardError } from './types.js'

// Bankr x402 Cloud endpoints for BlueAgent tools
const TOOL_ENDPOINTS: Record<CheckName, string> = {
  'honeypot':       'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/honeypot-check',
  'phishing':       'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/phishing-scan',
  'contract-trust': 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/contract-trust',
  'risk-gate':      'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5/risk-gate',
}

const VERDICT_RANK: Record<Verdict, number> = {
  SAFE: 0, WARN: 1, SUSPICIOUS: 2, BLOCK: 3, HONEYPOT: 4,
}

function worstVerdict(verdicts: Verdict[]): Verdict {
  return verdicts.reduce((worst, v) =>
    VERDICT_RANK[v] > VERDICT_RANK[worst] ? v : worst, 'SAFE' as Verdict)
}

async function runCheck(
  checkName: CheckName,
  address: string,
  x402Fetch: typeof fetch,
  timeout: number
): Promise<CheckResult> {
  const endpoint = TOOL_ENDPOINTS[checkName]
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await x402Fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, chain: 'base' }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as Record<string, unknown>

    // normalize response across tools
    const verdict = normalizeVerdict(checkName, data)
    const score = normalizeScore(checkName, data)
    const reason = normalizeReason(checkName, data)

    return { check: checkName, verdict, score, reason, raw: data }
  } catch (err) {
    // on error, default to WARN (don't block but flag it)
    return {
      check: checkName,
      verdict: 'WARN',
      score: 50,
      reason: err instanceof Error ? err.message : 'check failed',
    }
  } finally {
    clearTimeout(timer)
  }
}

function normalizeVerdict(check: CheckName, data: Record<string, unknown>): Verdict {
  if (check === 'honeypot') {
    const v = String(data.verdict ?? data.result ?? '').toUpperCase()
    if (v.includes('HONEYPOT')) return 'HONEYPOT'
    if (v.includes('SUSPICIOUS')) return 'SUSPICIOUS'
    if (v.includes('SAFE')) return 'SAFE'
  }
  if (check === 'risk-gate') {
    const v = String(data.decision ?? data.verdict ?? '').toUpperCase()
    if (v === 'BLOCK') return 'BLOCK'
    if (v === 'WARN') return 'WARN'
    if (v === 'APPROVE') return 'SAFE'
  }
  if (check === 'phishing') {
    const isPhishing = data.isPhishing ?? data.phishing ?? false
    if (isPhishing) return 'BLOCK'
    const score = Number(data.riskScore ?? data.score ?? 0)
    if (score > 70) return 'SUSPICIOUS'
    if (score > 40) return 'WARN'
    return 'SAFE'
  }
  if (check === 'contract-trust') {
    const score = Number(data.trustScore ?? data.score ?? 50)
    if (score < 20) return 'BLOCK'
    if (score < 40) return 'SUSPICIOUS'
    if (score < 60) return 'WARN'
    return 'SAFE'
  }
  return 'WARN'
}

function normalizeScore(check: CheckName, data: Record<string, unknown>): number {
  const raw = Number(
    data.riskScore ?? data.score ?? data.trustScore ?? data.riskLevel ?? 50
  )
  // trust score is inverted (higher = safer), flip it
  if (check === 'contract-trust') return Math.max(0, 100 - raw)
  return Math.min(100, Math.max(0, raw))
}

function normalizeReason(check: CheckName, data: Record<string, unknown>): string {
  return String(data.reason ?? data.message ?? data.recommendation ?? `${check} check completed`)
}

export class X402Guard {
  private options: Required<X402GuardOptions>
  private x402Fetch!: typeof fetch

  constructor(options: X402GuardOptions) {
    this.options = {
      checks: ['honeypot', 'risk-gate'],
      blockOn: 'SUSPICIOUS',
      apiBase: 'https://x402.bankr.bot/0xf31f59e7b8b58555f7871f71973a394c8f1bffe5',
      timeout: 5000,
      onBlock: () => {},
      ...options,
    }
  }

  private async getFetch(): Promise<typeof fetch> {
    if (this.x402Fetch) return this.x402Fetch
    const account = privateKeyToAccount(this.options.wallet as `0x${string}`)
    const client = x402Client.fromConfig({
      schemes: [{ network: 'eip155:8453', client: new ExactEvmScheme(account as any) }],
    })
    this.x402Fetch = wrapFetchWithPayment(fetch, client) as typeof fetch
    return this.x402Fetch
  }

  /** Check an address/contract before paying */
  async check(address: string): Promise<GuardResult> {
    const x402Fetch = await this.getFetch()
    const results = await Promise.all(
      this.options.checks.map(c => runCheck(c, address, x402Fetch, this.options.timeout))
    )

    const verdict = worstVerdict(results.map(r => r.verdict))
    const score = Math.max(...results.map(r => r.score))
    const allowed = VERDICT_RANK[verdict] < VERDICT_RANK[this.options.blockOn]

    const result: GuardResult = { allowed, verdict, score, checks: results, address }
    if (!allowed) this.options.onBlock(result)
    return result
  }

  /** Extract payment recipient from x402 response headers and check it */
  async checkPaymentResponse(response: Response): Promise<GuardResult> {
    const paymentInfo = response.headers.get('x-payment-required')
      ?? response.headers.get('x-402-payment')
    if (!paymentInfo) {
      return { allowed: true, verdict: 'SAFE', score: 0, checks: [] }
    }
    try {
      const info = JSON.parse(paymentInfo) as Record<string, unknown>
      const recipient = String(info.recipient ?? info.payTo ?? info.address ?? '')
      if (!recipient) return { allowed: true, verdict: 'SAFE', score: 0, checks: [] }
      return this.check(recipient)
    } catch {
      return { allowed: true, verdict: 'WARN', score: 30, checks: [] }
    }
  }

  /**
   * Wrap fetch to automatically check x402 payment recipients before paying.
   * Throws X402GuardError if the recipient is blocked.
   */
  wrapFetch(originalFetch: typeof fetch = fetch): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      // First probe request (no payment yet)
      const probe = await originalFetch(input, init)

      if (probe.status === 402) {
        const guardResult = await this.checkPaymentResponse(probe)
        if (!guardResult.allowed) {
          throw new X402GuardError(
            `x402-guard blocked payment to ${guardResult.address}: ${guardResult.verdict} (score: ${guardResult.score})`,
            guardResult
          )
        }
      }

      // If probe already succeeded (no payment needed) or guard passed, proceed normally
      if (probe.status !== 402) return probe

      // Let x402-fetch handle the actual payment
      const x402Fetch = await this.getFetch()
      return x402Fetch(input, init)
    }
  }

  /** Express/Node middleware — checks the requesting agent's wallet if present */
  middleware() {
    return async (
      req: { headers: Record<string, string | string[] | undefined> },
      res: { status: (code: number) => { json: (body: unknown) => void } },
      next: () => void
    ) => {
      const paymentHeader = req.headers['x-payment'] as string | undefined
      if (!paymentHeader) return next()

      try {
        const payment = JSON.parse(
          Buffer.from(paymentHeader, 'base64').toString()
        ) as Record<string, unknown>
        const senderAddress = String(payment.from ?? payment.sender ?? '')
        if (!senderAddress) return next()

        const result = await this.check(senderAddress)
        if (!result.allowed) {
          return res.status(403).json({
            error: 'x402-guard: agent blocked',
            verdict: result.verdict,
            score: result.score,
          })
        }
      } catch {
        // parse error → let through, don't block on guard errors
      }
      next()
    }
  }
}
