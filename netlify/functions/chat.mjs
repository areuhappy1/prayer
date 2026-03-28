export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY가 서버 환경에 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const { model, max_tokens, messages } = await req.json();
    if (!model || !messages) {
      return Response.json({ error: 'model, messages가 필요합니다.' }, { status: 400 });
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    const data = await r.json();
    return Response.json(data, {
      status: r.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'proxy error' },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

export const config = {
  path: '/api/chat',
};
