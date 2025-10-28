import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';

const CacheDialog: React.FC = () => {
  const showCacheDialog = useDiagramStore((state) => state.showCacheDialog);
  const cacheWarningMessage = useDiagramStore((state) => state.cacheWarningMessage);
  const cachedDiagramData = useDiagramStore((state) => state.cachedDiagramData);
  const loadCachedVersion = useDiagramStore((state) => state.loadCachedVersion);
  const dismissCacheDialog = useDiagramStore((state) => state.dismissCacheDialog);

  if (!showCacheDialog) return null;

  const cachedTimestamp = cachedDiagramData?.timestamp;
  const cachedDate = cachedTimestamp ? new Date(cachedTimestamp).toLocaleString() : 'Unknown';

  return (
    <Dialog open={showCacheDialog} onClose={dismissCacheDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Unsaved Version Found</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          A cached version of this diagram was found from {cachedDate}.
        </Typography>
        {cacheWarningMessage && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {cacheWarningMessage}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mt: 2 }}>
          Would you like to restore this unsaved version and continue working on it?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismissCacheDialog} color="secondary">
          Discard Cached Version
        </Button>
        <Button onClick={loadCachedVersion} variant="contained" color="primary">
          Restore Cached Version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CacheDialog;
