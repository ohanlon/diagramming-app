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
    // Debug: log navigator and block availability
    // eslint-disable-next-line no-console
    console.log('[useBlocker] attaching blocker, when=', when, 'navigator-block=', typeof navigator.block);
    // navigator.block is available on the unstable NavigationContext
    const unblock = navigator.block ? navigator.block((tx: any) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      blocker(autoUnblockingTx);
    }) : null as any;
    if (!unblock) {
      // eslint-disable-next-line no-console
      console.warn('[useBlocker] navigator.block is not available; navigation will not be blocked');
    }
    return unblock;
  }, [navigator, blocker, when]);
}
