import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/index.css';
import './index.css';
import App from './App.tsx';
import { initReducedMotion } from '~/lib/reduced-motion';

// Applied before the first paint so a reduced-motion player never sees an intro animation fire.
initReducedMotion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
