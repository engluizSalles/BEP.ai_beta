import type { AIProvider, GenerateRequest } from '../types';
import { DEEPSEEK_MODELS } from '../config';

// DeepSeek exposes an OpenAI-compatible REST API, so we call it with plain fetch
// (no SDK needed). https://api.deepseek.com/chat/completions
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

export const deepseekProvider: AIProvider = {
  id: 'deepseek',

  isConfigured() {
    return Boolean(apiKey);
  },

  async generate({
    prompt,
    system,
    json,
    tier = 'fast',
    temperature = 0.2,
  }: GenerateRequest): Promise<string> {
    if (!apiKey) throw new Error('VITE_DEEPSEEK_API_KEY não configurada.');

    const messages: Array<{ role: string; content: string }> = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODELS[tier],
        messages,
        // Determinismo: temperatura baixa reduz a variância entre execuções com o
        // mesmo documento. (A API da DeepSeek não documenta `seed`, por isso ele
        // é omitido para evitar erros 400.)
        temperature,
        top_p: 1,
        // JSON Object mode: requires the prompt to mention "json" (ours do).
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`DeepSeek API error ${res.status}: ${detail}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  },
};
