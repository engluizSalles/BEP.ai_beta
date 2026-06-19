/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_DEEPSEEK_MODEL?: string;
  readonly VITE_DEEPSEEK_MODEL_PRO?: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_GROQ_MODEL?: string;
  readonly VITE_GROQ_MODEL_PRO?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL_FAST?: string;
  readonly VITE_GEMINI_MODEL_PRO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
