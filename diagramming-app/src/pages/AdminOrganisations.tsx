import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminRoute from '../components/AdminRoute';
import { useDiagramStore } from '../store/useDiagramStore';
import { apiFetch } from '../utils/apiFetch';
import AccountMenu from '../components/AppBar/AccountMenu';

interface Organisation {
  id: string;
  name: string;
  primary_contact_email: string;
  primary_contact_name: string;
  billing_address: string;
  api_key: string;
  created_at: string;
  localadmin_email: string;
}

const AdminOrganisations: React.FC = () => {
  const navigate = useNavigate();
  const serverUrl = useDiagramStore((state) => state.serverUrl) || 'http://localhost:4000';
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [regenerateDialog, setRegenerateDialog] = useState<{ open: boolean; orgId: string | null; orgName: string | null }>({
    open: false,
    orgId: null,
    orgName: null,
  });
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganisations = async () => {
    setLoading(true);
    try {
      const resp = await apiFetch(`${serverUrl}/admin/organisations`, { method: 'GET' });
      if (!resp.ok) {
        console.error('Failed to fetch organisations:', resp.status);
        return;
      }
      const json = await resp.json();
      setOrganisations(json.organisations || []);
    } catch (e) {
      console.error('Error fetching organisations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrganisations();
  }, [serverUrl]);

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopyFeedback(apiKey);
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch((err) => {
      console.error('Failed to copy API key:', err);
    });
  };

  const handleRegenerateClick = (orgId: string, orgName: string) => {
    setRegenerateDialog({ open: true, orgId, orgName });
  };

  const handleRegenerateConfirm = async () => {
    if (!regenerateDialog.orgId) return;

    setRegenerating(true);
    setError(null);
    try {
      const resp = await apiFetch(
        `${serverUrl}/admin/organisations/${regenerateDialog.orgId}/regenerate-api-key`,
        { method: 'POST' }
      );

      if (!resp.ok) {
        const text = await resp.text().catch(() => `Status ${resp.status}`);
        throw new Error(text || 'Failed to regenerate API key');
      }

      // Refresh the organisations list
      await fetchOrganisations();
      setRegenerateDialog({ open: false, orgId: null, orgName: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to regenerate API key';
      setError(message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateCancel = () => {
    setRegenerateDialog({ open: false, orgId: null, orgName: null });
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Company Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'primary_contact_name',
      headerName: 'Primary Contact',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'primary_contact_email',
      headerName: 'Contact Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'billing_address',
      headerName: 'Billing Address',
      flex: 1.5,
      minWidth: 250,
    },
    {
      field: 'localadmin_email',
      headerName: 'Local Admin Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'api_key',
      headerName: 'API Key',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexGrow: 1,
            }}
          >
            {params.value}
          </Typography>
          <Tooltip title={copyFeedback === params.value ? 'Copied!' : 'Copy API Key'}>
            <IconButton
              size="small"
              onClick={() => handleCopyApiKey(params.value as string)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Regenerate API Key">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleRegenerateClick(params.row.id, params.row.name)}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 0.8,
      minWidth: 150,
      valueFormatter: (value: string) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      },
    },
  ];

  return (
    <AdminRoute>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: (theme) => theme.palette.background.default }}>
        <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
              Diagramming App - Admin
            </Typography>
            <AccountMenu />
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 4, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Organisations</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={organisations}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
                sorting: {
                  sortModel: [{ field: 'name', sort: 'asc' }],
                },
              }}
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                '& .MuiDataGrid-cell': {
                  py: 1,
                },
              }}
            />
          </Paper>
        </Box>

        <Dialog
          open={regenerateDialog.open}
          onClose={handleRegenerateCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Regenerate API Key</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to regenerate the API key for <strong>{regenerateDialog.orgName}</strong>?
            </DialogContentText>
            <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
              Warning: This will invalidate the current API key. Any applications using the old key will need to be updated.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRegenerateCancel} disabled={regenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateConfirm}
              color="warning"
              variant="contained"
              disabled={regenerating}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminRoute>
  );
};

export default AdminOrganisations;
