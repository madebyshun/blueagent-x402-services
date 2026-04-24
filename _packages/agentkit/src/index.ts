import { BlueAgent } from '@blueagent/sdk'

/**
 * BlueAgent plugin for Coinbase AgentKit — 31 security & research tools on Base.
 *
 * Usage:
 *   import { blueagentPlugin } from '@blueagent/agentkit'
 *   const kit = await AgentKit.from({ actionProviders: [blueagentPlugin()] })
 *
 * Requires: WALLET_PRIVATE_KEY env var (Base wallet with USDC for x402 payments)
 */
export function blueagentPlugin(opts?: { privateKey?: string }) {
  const key = opts?.privateKey ?? process.env.WALLET_PRIVATE_KEY
  if (!key) throw new Error('BlueAgent: set WALLET_PRIVATE_KEY or pass privateKey option')
  const ba = new BlueAgent({ privateKey: key })

  return {
    name: 'blueagent',
    description: 'Security OS for autonomous agents on Base — quantum safety, risk checks, research, and DeFi tools. Pay USDC per call via x402.',
    actions: [

      // ── AGENT SAFETY ────────────────────────────────────────────────────

      {
        name: 'blueagent_riskcheck',
        description: 'Pre-transaction safety check — APPROVE / WARN / BLOCK with risk score. Call before EVERY onchain action. $0.05.',
        schema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Describe the onchain action (e.g. "swap 100 USDC to ETH")' },
            contractAddress: { type: 'string', description: 'Target contract address' },
            amount: { type: 'string', description: 'USD amount (e.g. "$100")' },
            agentId: { type: 'string', description: 'Your agent ID for tracking' },
          },
          required: ['action'],
        },
        invoke: (p: any) => ba.security.riskcheck(p),
      },
      {
        name: 'blueagent_honeypot',
        description: 'Detect honeypot or rug pull token contracts — SAFE / SUSPICIOUS / HONEYPOT verdict. $0.05.',
        schema: {
          type: 'object',
          properties: { token: { type: 'string', description: 'Token contract address (0x...)' } },
          required: ['token'],
        },
        invoke: (p: any) => ba.security.honeypotCheck(p),
      },
      {
        name: 'blueagent_allowance_audit',
        description: 'Audit dangerous token approvals — find unlimited allowances to revoke. $0.20.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.allowanceAudit(p),
      },
      {
        name: 'blueagent_phishing',
        description: 'Scan URL, wallet address, or @handle for phishing and scam indicators. $0.10.',
        schema: {
          type: 'object',
          properties: { target: { type: 'string', description: 'URL, address, or @handle to scan' } },
          required: ['target'],
        },
        invoke: (p: any) => ba.security.phishingScan(p),
      },
      {
        name: 'blueagent_mev_shield',
        description: 'MEV sandwich attack risk before large swaps — protection strategies. $0.30.',
        schema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Swap action description' },
            amount: { type: 'string', description: 'USD amount of the swap' },
          },
          required: ['action'],
        },
        invoke: (p: any) => ba.security.mevShield(p),
      },
      {
        name: 'blueagent_contract_trust',
        description: 'Trust score for any contract — verified, audited, safe for AI agent interaction? $0.25.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Contract address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.contractTrust(p),
      },
      {
        name: 'blueagent_aml',
        description: 'AML compliance screening — CLEAN / SUSPICIOUS / HIGH_RISK verdict with transaction pattern analysis. $0.25.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.amlScreen(p),
      },
      {
        name: 'blueagent_circuit_breaker',
        description: 'CONTINUE / PAUSE / HALT decision for autonomous agents. Call when consecutive losses or anomalies detected. $0.50.',
        schema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Your agent identifier' },
            context: { type: 'string', description: 'Situation description (e.g. "3 consecutive losses")' },
            recentLosses: { type: 'string', description: 'Recent loss amount (e.g. "$340")' },
            consecutiveBlocks: { type: 'number', description: 'Number of consecutive failed actions' },
          },
        },
        invoke: (p: any) => ba.security.circuitBreaker(p),
      },

      // ── QUANTUM SECURITY ────────────────────────────────────────────────

      {
        name: 'blueagent_quantum',
        description: 'Full quantum vulnerability report — public key exposure, threat level, migration steps. $1.50.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.quantum(p),
      },
      {
        name: 'blueagent_quantum_batch',
        description: 'Batch quantum scan for 1-10 wallets at $0.25 each — pay only for what you scan. Up to $2.50.',
        schema: {
          type: 'object',
          properties: {
            addresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of wallet addresses (max 10)',
            },
          },
          required: ['addresses'],
        },
        invoke: (p: any) => ba.security.quantumBatch(p),
      },
      {
        name: 'blueagent_quantum_migrate',
        description: 'Step-by-step quantum-safe wallet migration plan with tools and timeline. $2.00.',
        schema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Wallet address (0x...)' },
            urgencyLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.quantumMigrate(p),
      },
      {
        name: 'blueagent_quantum_timeline',
        description: 'Evidence-based quantum threat timeline — when CRQC arrives, what it means for wallets. $0.40.',
        schema: {
          type: 'object',
          properties: {
            concern: { type: 'string', description: 'Specific concern (optional)' },
          },
        },
        invoke: (p: any) => ba.security.quantumTimeline(p),
      },
      {
        name: 'blueagent_key_exposure',
        description: 'Check if wallet public key is exposed on-chain — #1 quantum risk factor. $0.50.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.security.keyExposure(p),
      },

      // ── RESEARCH ────────────────────────────────────────────────────────

      {
        name: 'blueagent_analyze',
        description: 'Deep due diligence for any Base token or project — risk score, rug probability, recommendation. $0.35.',
        schema: {
          type: 'object',
          properties: { projectName: { type: 'string', description: 'Token name, ticker ($BRETT), or contract address' } },
          required: ['projectName'],
        },
        invoke: (p: any) => ba.research.analyze(p),
      },
      {
        name: 'blueagent_tokenomics',
        description: 'Supply, inflation, unlock cliff analysis — sustainability score and sell pressure forecast. $0.50.',
        schema: {
          type: 'object',
          properties: { token: { type: 'string', description: 'Token name or ticker' } },
          required: ['token'],
        },
        invoke: (p: any) => ba.research.tokenomicsScore(p),
      },
      {
        name: 'blueagent_whitepaper',
        description: 'Summarize any whitepaper into 5 key bullets — thesis, moat, risks, team. $0.20.',
        schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to whitepaper or docs' },
            projectName: { type: 'string', description: 'Project name (optional)' },
          },
          required: ['url'],
        },
        invoke: (p: any) => ba.research.whitepaperTldr(p),
      },
      {
        name: 'blueagent_narrative',
        description: 'Trending narratives in crypto and Base ecosystem — momentum scores, emerging themes. $0.40.',
        schema: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Topic or sector (e.g. "AI agents", "RWA")' } },
          required: ['query'],
        },
        invoke: (p: any) => ba.research.narrativePulse(p),
      },
      {
        name: 'blueagent_vc_tracker',
        description: 'VC investment activity on Base — hot sectors, thesis, which VCs are deploying capital. $1.00.',
        schema: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Sector or focus area (e.g. "DeFi", "gaming")' } },
          required: ['query'],
        },
        invoke: (p: any) => ba.research.vcTracker(p),
      },
      {
        name: 'blueagent_launch_advisor',
        description: 'Full token launch playbook — tokenomics design, 8-week timeline, marketing strategy, KPIs. $3.00.',
        schema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            description: { type: 'string', description: 'What the project does' },
            targetRaise: { type: 'string', description: 'Fundraising target (optional)' },
          },
          required: ['projectName'],
        },
        invoke: (p: any) => ba.research.launchAdvisor({ projectName: p.projectName ?? '', ...p }),
      },
      {
        name: 'blueagent_grant',
        description: 'Base ecosystem grant scoring — Fund/Decline recommendation with innovation, feasibility, impact scores. $5.00.',
        schema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Project description for grant evaluation' },
            projectName: { type: 'string' },
            requestedAmount: { type: 'string', description: 'Grant amount requested' },
            teamBackground: { type: 'string' },
            milestones: { type: 'string' },
          },
          required: ['description'],
        },
        invoke: (p: any) => ba.research.grant(p),
      },
      {
        name: 'blueagent_x402_readiness',
        description: 'Audit any API for x402 payment protocol readiness — gaps, integration steps, pricing recommendations. $1.00.',
        schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'API base URL to audit' },
            description: { type: 'string', description: 'What the API does' },
            currentModel: { type: 'string', description: 'Current monetization model (e.g. "subscription")' },
          },
        },
        invoke: (p: any) => ba.research.x402Readiness(p),
      },
      {
        name: 'blueagent_deploy_check',
        description: 'Pre-deployment security check for Base contracts — vulnerabilities, centralization risks, go/no-go. $0.50.',
        schema: {
          type: 'object',
          properties: {
            contractCode: { type: 'string', description: 'Solidity contract code to review' },
            description: { type: 'string', description: 'What the contract does' },
            projectName: { type: 'string' },
          },
        },
        invoke: (p: any) => ba.research.baseDeployCheck(p),
      },

      // ── DATA ────────────────────────────────────────────────────────────

      {
        name: 'blueagent_pnl',
        description: 'Wallet PnL report — win rate, realized gains/losses, trading style, smart money score. $1.00.',
        schema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Wallet address (0x...)' },
            period: { type: 'string', enum: ['7d', '30d', '90d', 'all'] },
          },
          required: ['address'],
        },
        invoke: (p: any) => ba.data.pnl(p),
      },
      {
        name: 'blueagent_whale_tracker',
        description: 'Smart money flow analysis — accumulation vs distribution signal, top whale movements. $0.10.',
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Token address or ticker' },
            minAmountUSD: { type: 'number', description: 'Min trade size to track (default $1000)' },
          },
          required: ['token'],
        },
        invoke: (p: any) => ba.data.whaleTracker(p),
      },
      {
        name: 'blueagent_dex_flow',
        description: 'DEX buy/sell pressure and volume flow — live DexScreener data. $0.15.',
        schema: {
          type: 'object',
          properties: { token: { type: 'string', description: 'Token address or ticker' } },
          required: ['token'],
        },
        invoke: (p: any) => ba.data.dexFlow(p),
      },
      {
        name: 'blueagent_airdrop',
        description: 'Base airdrop eligibility — which protocols qualify, activity score, estimated value. $0.10.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => ba.earn.airdropCheck(p),
      },
      {
        name: 'blueagent_alert_check',
        description: 'Check if any active alert triggers for an address — whale movements, circuit breaker, quantum exposure. $0.10.',
        schema: {
          type: 'object',
          properties: { address: { type: 'string', description: 'Wallet address (0x...)' } },
          required: ['address'],
        },
        invoke: (p: any) => (ba.data as any).alertCheck(p),
      },

      // ── EARN ────────────────────────────────────────────────────────────

      {
        name: 'blueagent_yield',
        description: 'Best APY opportunities on Base DeFi — live DeFiLlama data, risk-adjusted recommendations. $0.15.',
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Token to deploy (e.g. USDC, ETH, cbBTC)' },
            riskTolerance: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            minAPY: { type: 'number', description: 'Minimum APY threshold (%)' },
          },
        },
        invoke: (p: any) => ba.earn.yieldOptimizer(p),
      },
      {
        name: 'blueagent_lp_analyzer',
        description: 'LP position analysis — impermanent loss, fee income, rebalance signal. $0.25.',
        schema: {
          type: 'object',
          properties: {
            positionId: { type: 'string', description: 'Uniswap v3 LP NFT position ID' },
            pool: { type: 'string', description: 'Pool contract address' },
            token0: { type: 'string', description: 'First token symbol' },
            token1: { type: 'string', description: 'Second token symbol' },
            entryPrice: { type: 'string', description: 'Price when position opened' },
            investedAmount: { type: 'string', description: 'Total USD invested' },
          },
        },
        invoke: (p: any) => ba.earn.lpAnalyzer(p),
      },
      {
        name: 'blueagent_tax_report',
        description: 'On-chain tax summary — realized gains, taxable events, P&L breakdown. $2.00.',
        schema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Wallet address (0x...)' },
            year: { type: 'number', description: 'Tax year (default: current year)' },
            country: { type: 'string', description: 'Country for tax rules (default: US)' },
          },
          required: ['address'],
        },
        invoke: (p: any) => ba.earn.taxReport(p),
      },
      {
        name: 'blueagent_alert_subscribe',
        description: 'Subscribe to real-time alerts via webhook — whale movements, circuit breaker, quantum exposure. $0.50.',
        schema: {
          type: 'object',
          properties: {
            webhookUrl: { type: 'string', description: 'HTTPS webhook URL to receive alerts' },
            topics: {
              type: 'array',
              items: { type: 'string', enum: ['whale_movement', 'circuit_breaker', 'quantum_exposure', 'honeypot_detected', 'rug_risk'] },
              description: 'Alert topics to subscribe to',
            },
            addresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific addresses to watch (optional — empty = global)',
            },
          },
          required: ['webhookUrl', 'topics'],
        },
        invoke: (p: any) => ba.earn.alertSubscribe(p),
      },
    ],
  }
}
