import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@mui/material/styles';
import createAppTheme from './styles/themeFactory';
import { useDiagramStore } from './store/useDiagramStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configure QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);