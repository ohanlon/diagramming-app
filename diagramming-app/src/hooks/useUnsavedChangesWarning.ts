import { useCallback } from 'react';
import { useBlocker } from './useBlocker';

const EVENT_NAME = 'show-unsaved-dialog';

export function useUnsavedChangesWarning(isDirty: boolean) {
  useBlocker(
    useCallback(
      (tx) => {
        if (isDirty) {
          // Dispatch a CustomEvent that the global UnsavedChangesDialog listens for
          try {
            const ev = new CustomEvent(EVENT_NAME, { detail: { tx } });
            window.dispatchEvent(ev);
          } catch (e) {
            // Fallback to confirm for environments where CustomEvent is unavailable
            if (window.confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
              tx.retry();
            }
          }
        } else {
          tx.retry();
        }
      },
      [isDirty]
    ),
    isDirty
  );
}
