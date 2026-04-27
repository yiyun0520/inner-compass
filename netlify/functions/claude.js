import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { systemPrompt, messages } = body;
  if (!systemPrompt || !Array.isArray(messages)) {
    return { statusCode: 400, body: 'Missing systemPrompt or messages' };
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response.content[0].text }),
    };
  } catch (err) {
    console.error('Claude API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_FAILED' }),
    };
  }
};
