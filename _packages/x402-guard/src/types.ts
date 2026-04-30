export type CheckName = 'honeypot' | 'phishing' | 'contract-trust' | 'risk-gate'

export type Verdict = 'SAFE' | 'WARN' | 'SUSPICIOUS' | 'BLOCK' | 'HONEYPOT'

export interface CheckResult {
  check: CheckName
  verdict: Verdict
  score: number       // 0–100, higher = more risky
  reason: string
  raw?: unknown
}

export interface GuardResult {
  allowed: boolean
  verdict: Verdict    // worst verdict across all checks
  score: number       // max score across all checks
  checks: CheckResult[]
  address?: string
}

export interface X402GuardOptions {
  /** Wallet private key (0x...) — used to pay for BlueAgent checks via x402 */
  wallet: string
  /** Which checks to run. Default: ['honeypot', 'risk-gate'] */
  checks?: CheckName[]
  /** Block if verdict is at or above this level. Default: 'SUSPICIOUS' */
  blockOn?: Verdict
  /** BlueAgent API base URL. Default: https://x402.bankr.bot/... */
  apiBase?: string
  /** Timeout per check in ms. Default: 5000 */
  timeout?: number
  /** Called when a payment is blocked */
  onBlock?: (result: GuardResult) => void
}

export class X402GuardError extends Error {
  constructor(
    message: string,
    public readonly result: GuardResult
  ) {
    super(message)
    this.name = 'X402GuardError'
  }
}
