import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {isAIConfigured} from './lib/ai';
import './index.css';

if (!isAIConfigured()) {
  console.warn(
    '[BEP.ai] VITE_DEEPSEEK_API_KEY não configurada. Os recursos de IA ficarão indisponíveis. ' +
      'Crie um arquivo .env na raiz com VITE_DEEPSEEK_API_KEY="sua_chave".',
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
