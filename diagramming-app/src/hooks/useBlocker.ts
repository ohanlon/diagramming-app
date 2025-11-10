import { useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

// This hook enables blocking navigation using react-router v6's unstable API
export function useBlocker(
  blocker: (tx: { retry: () => void }) => void,
  when = true
) {
  const { navigator } = useContext(NavigationContext) as any;

  useEffect(() => {
    if (!when) return;
    
    // navigator.block is only available with unstable_HistoryRouter, not BrowserRouter
    if (!navigator.block) {
      // BrowserRouter doesn't support programmatic blocking
      // The browser's beforeunload event is handled separately in useUnsavedChangesWarning
      return;
    }

    const unblock = navigator.block((tx: any) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
}
