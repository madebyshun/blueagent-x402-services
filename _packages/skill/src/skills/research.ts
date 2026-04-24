import type { SkillDef } from '../types.js'

export const researchSkills: SkillDef[] = [

  {
    name: 'analyze',
    category: 'research',
    description: 'Deep token and project due diligence — risk score, rug probability, strengths, red flags, BUY / AVOID recommendation.',
    priceUSD: 0.35,
    endpoint: 'deep-analysis',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Token name, ticker ($SYMBOL), or contract address' },
      },
      required: ['projectName'],
    },
    buildBody: ({ projectName }) => ({ projectName }),
  },

  {
    name: 'tokenomics-score',
    category: 'research',
    description: 'Token supply, inflation, unlock cliff analysis — sustainability score, sell pressure forecast, 6-month outlook.',
    priceUSD: 0.50,
    endpoint: 'tokenomics-score',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token name, ticker, or contract address' },
      },
      required: ['token'],
    },
    buildBody: ({ token }) => ({ token }),
  },

  {
    name: 'whitepaper-tldr',
    category: 'research',
    description: 'Summarize any whitepaper or project docs into 5 key bullets — thesis, moat, token utility, biggest risk.',
    priceUSD: 0.20,
    endpoint: 'whitepaper-tldr',
    inputSchema: {
      type: 'object',
      properties: {
        url:         { type: 'string', description: 'URL to the whitepaper or project documentation' },
        projectName: { type: 'string', description: 'Project name (optional, improves context)' },
      },
      required: ['url'],
    },
    buildBody: ({ url, projectName }) => ({ url, projectName: projectName ?? '' }),
  },

  {
    name: 'narrative-pulse',
    category: 'research',
    description: 'Trending narratives in crypto and Base ecosystem — momentum scores, emerging themes, agent opportunities.',
    priceUSD: 0.40,
    endpoint: 'narrative-pulse',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Topic or sector to explore (e.g. "AI agents", "Base DeFi", "RWA")' },
      },
      required: ['query'],
    },
    buildBody: ({ query }) => ({ query }),
  },

  {
    name: 'vc-tracker',
    category: 'research',
    description: 'VC investment activity and thesis on Base — hot sectors, who backs what, signals for builders and traders.',
    priceUSD: 1.00,
    endpoint: 'vc-tracker',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'VC firm name, sector, or investment theme (e.g. "a16z crypto", "AI x DeFi")' },
      },
      required: ['query'],
    },
    buildBody: ({ query }) => ({ query }),
  },

  {
    name: 'launch-advisor',
    category: 'research',
    description: 'Full token launch playbook — tokenomics design, 8-week launch timeline, marketing strategy, community growth KPIs.',
    priceUSD: 3.00,
    endpoint: 'launch-advisor',
    inputSchema: {
      type: 'object',
      properties: {
        projectName:  { type: 'string', description: 'Project name' },
        description:  { type: 'string', description: 'What the project does and launch goals' },
        targetRaise:  { type: 'string', description: 'Fundraising target (optional)' },
      },
      required: ['projectName'],
    },
    buildBody: ({ projectName, description, targetRaise }) => ({ projectName, description, targetRaise }),
  },

  {
    name: 'grant-evaluator',
    category: 'research',
    description: 'Base ecosystem grant scoring — Fund/Decline recommendation with innovation, feasibility, impact, team scores.',
    priceUSD: 5.00,
    endpoint: 'grant-evaluator',
    inputSchema: {
      type: 'object',
      properties: {
        description:     { type: 'string', description: 'Project description for grant evaluation' },
        projectName:     { type: 'string', description: 'Project name' },
        teamBackground:  { type: 'string', description: 'Team experience and background (optional)' },
        requestedAmount: { type: 'string', description: 'Grant amount requested (optional)' },
        milestones:      { type: 'string', description: 'Project milestones (optional)' },
      },
      required: ['description'],
    },
    buildBody: ({ description, projectName, teamBackground, requestedAmount, milestones }) => ({
      description,
      projectName: projectName ?? description.split('—')[0]?.trim() ?? description,
      teamBackground,
      requestedAmount,
      milestones,
    }),
  },

  {
    name: 'x402-readiness',
    category: 'research',
    description: 'Audit any API or service for x402 payment protocol readiness — gaps, implementation steps, suggested pricing.',
    priceUSD: 1.00,
    endpoint: 'x402-readiness',
    inputSchema: {
      type: 'object',
      properties: {
        url:          { type: 'string', description: 'API endpoint URL to audit (optional)' },
        description:  { type: 'string', description: 'Service description (optional)' },
        currentModel: { type: 'string', description: 'Current monetization model, e.g. "subscription" (optional)' },
      },
    },
    buildBody: ({ url, description, currentModel }) => ({ url, description, currentModel }),
  },

  {
    name: 'base-deploy-check',
    category: 'research',
    description: 'Pre-deployment security check for Base smart contracts — vulnerabilities, centralization risks, go/no-go verdict.',
    priceUSD: 0.50,
    endpoint: 'base-deploy-check',
    inputSchema: {
      type: 'object',
      properties: {
        contractCode: { type: 'string', description: 'Solidity source code (optional)' },
        description:  { type: 'string', description: 'What the contract does (optional)' },
        projectName:  { type: 'string', description: 'Project name (optional)' },
      },
    },
    buildBody: ({ contractCode, description, projectName }) => ({ contractCode, description, projectName }),
  },
]
