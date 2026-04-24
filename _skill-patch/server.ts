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

const server = new Server(
  { name: 'blueagent-skill', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_SKILLS.map(skill => ({
    name: skill.name,
    description: `[${skill.category}] ${skill.description} — $${skill.priceUSD.toFixed(2)}/call via x402`,
    inputSchema: skill.inputSchema,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const skill = ALL_SKILLS.find(s => s.name === name)
  if (!skill) throw new Error(`Unknown tool: ${name}`)

  try {
    const result = await runSkill(skill, args as Record<string, unknown>)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
server.connect(transport).then(() => {
  process.stderr.write(`BlueAgent MCP ready — ${ALL_SKILLS.length} x402 tools\n`)
})
