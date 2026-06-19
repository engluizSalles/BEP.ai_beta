import type { ModelTier } from './types';

// ────────────────────────────────────────────────────────────────────────
// Central AI configuration. Change models / provider HERE — nowhere else.
//
// Model IDs are read from .env (Vite `VITE_*` vars) so you can swap them
// without touching code. The project runs entirely on DeepSeek by default;
// the Groq and Gemini providers stay registered as alternatives (just change
// ACTIVE_PROVIDER and set the matching API key).
// ────────────────────────────────────────────────────────────────────────

/** Active provider. Swap to 'groq' or 'gemini' to use those instead. */
export const ACTIVE_PROVIDER = 'deepseek' as const;

// ── DeepSeek (default) ─────────────────────────────────────────────────────
// Confirm the exact model IDs available to you at https://api-docs.deepseek.com/quick_start/pricing
const DEEPSEEK_DEFAULTS = {
  fast: 'deepseek-v4-flash',
  pro: 'deepseek-v4-flash',
} satisfies Record<ModelTier, string>;

export const DEEPSEEK_MODELS: Record<ModelTier, string> = {
  fast: import.meta.env.VITE_DEEPSEEK_MODEL || DEEPSEEK_DEFAULTS.fast,
  pro:
    import.meta.env.VITE_DEEPSEEK_MODEL_PRO ||
    import.meta.env.VITE_DEEPSEEK_MODEL ||
    DEEPSEEK_DEFAULTS.pro,
};

// ── Groq (alternative) ─────────────────────────────────────────────────────
// Confirm the exact model IDs available to you at https://console.groq.com/docs/models
const GROQ_DEFAULTS = {
  fast: 'llama-3.3-70b-versatile',
  pro: 'llama-3.3-70b-versatile',
} satisfies Record<ModelTier, string>;

export const GROQ_MODELS: Record<ModelTier, string> = {
  fast: import.meta.env.VITE_GROQ_MODEL || GROQ_DEFAULTS.fast,
  pro: import.meta.env.VITE_GROQ_MODEL_PRO || import.meta.env.VITE_GROQ_MODEL || GROQ_DEFAULTS.pro,
};

// ── Gemini (alternative) ─────────────────────────────────────────────────
const GEMINI_DEFAULTS = {
  fast: 'gemini-2.0-flash',
  pro: 'gemini-2.0-flash',
} satisfies Record<ModelTier, string>;

export const GEMINI_MODELS: Record<ModelTier, string> = {
  fast: import.meta.env.VITE_GEMINI_MODEL_FAST || GEMINI_DEFAULTS.fast,
  pro: import.meta.env.VITE_GEMINI_MODEL_PRO || GEMINI_DEFAULTS.pro,
};
