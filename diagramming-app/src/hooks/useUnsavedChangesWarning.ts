import { useCallback } from 'react';
import { useBlocker } from './useBlocker';

export function useUnsavedChangesWarning(isDirty: boolean) {
  useBlocker(
    useCallback(
      (tx) => {
        if (isDirty) {
          if (window.confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
            tx.retry();
          }
          // else: do nothing, block navigation
        } else {
          tx.retry();
        }
      },
      [isDirty]
    ),
    isDirty
  );
}
