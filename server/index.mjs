import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/chat', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 서버 환경에 설정되지 않았습니다.' });
  }
  const { model, max_tokens, messages } = req.body;
  if (!model || !messages) {
    return res.status(400).json({ error: 'model, messages가 필요합니다.' });
  }
  try {
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
    res.status(r.status).json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'proxy error';
    res.status(502).json({ error: msg });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Anthropic proxy: http://localhost:${PORT}/api/chat`);
});
