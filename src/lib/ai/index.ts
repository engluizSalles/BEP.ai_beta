import type { AIProvider } from './types';
import { ACTIVE_PROVIDER } from './config';
import { deepseekProvider } from './providers/deepseek';
import { geminiProvider } from './providers/gemini';
import { groqProvider } from './providers/groq';

export type { AIProvider, GenerateRequest, ModelTier } from './types';

// Registry of available providers. To add Claude (or any other), implement
// ./providers/claude.ts and register it here, then point ACTIVE_PROVIDER at it.
const PROVIDERS: Record<string, AIProvider> = {
  deepseek: deepseekProvider,
  groq: groqProvider,
  gemini: geminiProvider,
};

export const aiProvider: AIProvider = PROVIDERS[ACTIVE_PROVIDER];

/** True when the active provider is ready to make calls. */
export function isAIConfigured(): boolean {
  return aiProvider?.isConfigured() ?? false;
}

/** Strip accidental ```json fences and parse. Throws on invalid JSON. */
export function parseJSON<T = unknown>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
