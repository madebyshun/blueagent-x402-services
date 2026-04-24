export interface SkillDef {
  name: string
  category: 'safety' | 'quantum' | 'research' | 'data' | 'earn'
  description: string
  priceUSD: number
  endpoint: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string; enum?: string[] }>
    required?: string[]
  }
  buildBody: (args: Record<string, any>) => Record<string, unknown>
}
