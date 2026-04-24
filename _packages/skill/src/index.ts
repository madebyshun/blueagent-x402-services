#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { securitySkills } from './skills/security.js'
import { researchSkills } from './skills/research.js'
import { dataSkills } from './skills/data.js'
import { earnSkills } from './skills/earn.js'
import { runSkill } from './runner.js'

const ALL_SKILLS = [
  ...securitySkills,
  ...researchSkills,
  ...dataSkills,
  ...earnSkills,
]

const CATEGORY_LABELS: Record<string, string> = {
  safety:   'Agent Safety',
  quantum:  'Quantum Security',
  research: 'Research',
  data:     'Data',
  earn:     'Earn',
}

const server = new Server(
  { name: 'blueagent', version: '1.1.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_SKILLS.map(skill => ({
    name: skill.name,
    description: `[${CATEGORY_LABELS[skill.category]}] ${skill.description} — $${skill.priceUSD.toFixed(2)}/call`,
    inputSchema: skill.inputSchema,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const skill = ALL_SKILLS.find(s => s.name === name)

  if (!skill) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}. Available: ${ALL_SKILLS.map(s => s.name).join(', ')}` }],
      isError: true,
    }
  }

  try {
    const result = await runSkill(skill, args as Record<string, unknown>)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    const msg = (err as Error).message
    return {
      content: [{ type: 'text', text: `BlueAgent error (${name}): ${msg}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
server.connect(transport).then(() => {
  process.stderr.write(
    `BlueAgent MCP server ready — ${ALL_SKILLS.length} tools (${Object.keys(CATEGORY_LABELS).join(', ')})\n`
  )
})
