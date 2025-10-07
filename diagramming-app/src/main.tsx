import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* Remove legacy persisted full-diagram snapshots to ensure the server is the single source of truth */}
      {(() => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.removeItem('diagram-storage'); } catch (e) {}
          }
          if (typeof window !== 'undefined' && window.sessionStorage) {
            try { window.sessionStorage.removeItem('diagram-history-storage-v2'); } catch (e) {}
          }
        } catch (e) {}
        return null;
      })()}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);