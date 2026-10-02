import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigurationError } from '@user-management/shared';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new ConfigurationError('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
