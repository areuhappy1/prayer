export type AnthropicMessage = { role: 'user'; content: string };

export type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
};

import { Platform } from 'react-native';

const getBase = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || '';
};

export async function callAnthropicProxy(body: {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
}): Promise<AnthropicMessagesResponse> {
  const base = getBase().replace(/\/$/, '');
  if (!base && Platform.OS !== 'web') {
    throw new Error(
      'EXPO_PUBLIC_API_URL이 없습니다. 루트에 .env를 만들고 EXPO_PUBLIC_API_URL=http://localhost:3001 를 설정한 뒤 서버(npm run server)를 실행하세요.'
    );
  }
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as AnthropicMessagesResponse & {
    error?: string;
  };
  if (!res.ok) {
    const msg =
      (data as { error?: string }).error ||
      data.error?.message ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function extractAnthropicText(data: AnthropicMessagesResponse): string {
  const parts = data.content?.map(c => c.text || '').filter(Boolean) || [];
  return parts.join('');
}
