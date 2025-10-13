import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@mui/material/styles';
import createAppTheme from './styles/themeFactory';
import { useDiagramStore } from './store/useDiagramStore';

const ThemedApp: React.FC = () => {
  const mode = useDiagramStore(state => state.themeMode || 'light');
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  // Remove legacy persisted full-diagram snapshots to ensure the server is the single source of truth
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.removeItem('diagram-storage'); } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try { window.sessionStorage.removeItem('diagram-history-storage-v2'); } catch (e) {}
      }
    } catch (e) {}
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>,
);