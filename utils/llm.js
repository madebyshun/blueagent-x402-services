// utils/llm.js
// Utility to call LLM (Claude Sonnet 4.6) via Bankr

export async function callLLM(options) {
  const { model, system, messages, temperature = 0.7, maxTokens = 1000 } = options;

  if (!messages || messages.length === 0) {
    throw new Error("Messages array is required");
  }

  const payload = {
    model: model || "claude-sonnet-4.6",
    system: system,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BANKR_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract text from Claude/Anthropic response format
  if (data.content && Array.isArray(data.content)) {
    return data.content[0].text;
  }

  if (data.text) {
    return data.text;
  }

  throw new Error("Invalid response format from LLM");
}