import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';

export default function ConflictDialog() {
  const conflictOpen = useDiagramStore(state => state.conflictOpen);
  const conflictServerVersion = useDiagramStore(state => state.conflictServerVersion);
  const conflictServerState = useDiagramStore(state => state.conflictServerState);
  const conflictLocalState = useDiagramStore(state => (state as any).conflictLocalState);
  const resolveAccept = useDiagramStore(state => state.resolveConflictAcceptServer);
  const resolveForce = useDiagramStore(state => state.resolveConflictForceOverwrite);
  const dismiss = useDiagramStore(state => state.dismissConflict);

  if (!conflictOpen) return null;

  return (
    <Dialog open={true} onClose={() => dismiss()} maxWidth="sm" fullWidth>
      <DialogTitle>Concurrent update detected</DialogTitle>
      <DialogContent>
        <DialogContentText>
          The diagram has been changed on the server since you last saved (server version: {conflictServerVersion ?? 'unknown'}).
        </DialogContentText>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>Server snapshot preview</Typography>
  <pre style={{ maxHeight: 240, overflow: 'auto', background: 'var(--conflict-server-bg, #f5f5f5)', padding: 8 }}>{JSON.stringify(conflictServerState || {}, null, 2)}</pre>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>Your local changes</Typography>
  <pre style={{ maxHeight: 240, overflow: 'auto', background: 'var(--conflict-local-bg, #fff9c4)', padding: 8 }}>{JSON.stringify(conflictLocalState || {}, null, 2)}</pre>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dismiss()}>Dismiss</Button>
        <Button onClick={() => resolveAccept()} color="primary">Use Server Version</Button>
        <Button onClick={async () => { await resolveForce(); }} color="error" variant="contained">Force Overwrite</Button>
      </DialogActions>
    </Dialog>
  );
}
