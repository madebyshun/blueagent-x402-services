import { callLLM } from '../_lib/llm.js'
import { extractJSON } from '../_lib/json.js'

const SYSTEM = `You are a senior grants evaluator for Base ecosystem grants using Base/Coinbase criteria.

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. Start with { and end with }.

{
  "projectName": "string",
  "overallScore": number (0-100),
  "recommendation": "Fund | Fund with Conditions | Decline | Request More Info",
  "suggestedGrantSize": "string (e.g. $10,000-25,000 or Decline)",
  "scores": {
    "innovation": number (0-20),
    "baseAlignment": number (0-20),
    "technicalFeasibility": number (0-20),
    "teamQuality": number (0-20),
    "impactPotential": number (0-20)
  },
  "strengths": ["s1", "s2", "s3"],
  "concerns": ["c1", "c2"],
  "conditions": ["condition1"],
  "questionsForTeam": ["q1", "q2", "q3"],
  "comparableProjects": ["project1", "project2"],
  "executiveSummary": "3-4 sentence professional evaluation",
  "milestoneAssessment": "string",
  "riskLevel": "Low | Medium | High | Very High"
}`

export default async function handler(req: Request): Promise<Response> {
  try {
    let body: { projectName?: string; description?: string; teamBackground?: string; requestedAmount?: string; milestones?: string; githubUrl?: string; websiteUrl?: string } = {}
    try {
      const text = await req.text()
      if (text?.trim().startsWith('{')) body = JSON.parse(text)
    } catch {}
    const url = new URL(req.url)
    if (!body.projectName) body.projectName = url.searchParams.get('projectName') || undefined
    if (!body.description) body.description = url.searchParams.get('description') || undefined
    if (!body.teamBackground) body.teamBackground = url.searchParams.get('teamBackground') || undefined
    if (!body.requestedAmount) body.requestedAmount = url.searchParams.get('requestedAmount') || undefined
    if (!body.milestones) body.milestones = url.searchParams.get('milestones') || undefined
    if (!body.githubUrl) body.githubUrl = url.searchParams.get('githubUrl') || undefined
    if (!body.websiteUrl) body.websiteUrl = url.searchParams.get('websiteUrl') || undefined
    const { projectName, description } = body
    if (!projectName || !description) {
      return Response.json({ error: 'Provide projectName and description' }, { status: 400 })
    }
    console.log(`[GrantEvaluator] Evaluating: ${projectName}`)
    const raw = await callLLM({
      system: SYSTEM,
      user: `Evaluate Base grant application:\nProject: ${projectName}\nDescription: ${description}\nTeam: ${body.teamBackground ?? 'Not provided'}\nAmount: ${body.requestedAmount ?? 'Not specified'}\nMilestones: ${body.milestones ?? 'Not provided'}\nGitHub: ${body.githubUrl ?? 'N/A'}\nWebsite: ${body.websiteUrl ?? 'N/A'}`,
      temperature: 0.4,
      maxTokens: 2000,
    })
    return Response.json(extractJSON(raw))
  } catch (error) {
    console.error('[GrantEvaluator] Error:', error)
    return Response.json({ error: 'Grant evaluation failed', message: (error as Error).message }, { status: 500 })
  }
}
