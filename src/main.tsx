import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration may be restricted in certain sandbox contexts
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
