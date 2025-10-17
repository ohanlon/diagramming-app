import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

type PendingTx = { retry: () => void } | null;

const EVENT_NAME = 'show-unsaved-dialog';

const UnsavedChangesDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tx, setTx] = useState<PendingTx>(null);

  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent;
      const detail = custom?.detail as any;
      if (detail && detail.tx && typeof detail.tx.retry === 'function') {
        setTx(detail.tx as PendingTx);
        setOpen(true);
      }
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
  }, []);

  const handleLeave = () => {
    if (tx) tx.retry();
    setOpen(false);
    setTx(null);
  };

  const handleStay = () => {
    setOpen(false);
    setTx(null);
  };

  return (
    <Dialog open={open} onClose={handleStay} aria-labelledby="unsaved-dialog-title">
      <DialogTitle id="unsaved-dialog-title">You have unsaved changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have unsaved changes in this diagram. If you leave now, your recent changes will be lost.
          Choose "Leave" to discard changes and continue navigation, or "Stay" to return to the editor and save your work.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleStay} color="primary">Stay</Button>
        <Button onClick={handleLeave} color="error" variant="contained">Leave</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
