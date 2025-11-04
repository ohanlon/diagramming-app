import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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

  useEffect(() => {
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
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.value}
          </Typography>
          <Tooltip title={copyFeedback === params.value ? 'Copied!' : 'Copy API Key'}>
            <IconButton
              size="small"
              onClick={() => handleCopyApiKey(params.value as string)}
              sx={{ ml: 'auto' }}
            >
              <ContentCopyIcon fontSize="small" />
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
      </Box>
    </AdminRoute>
  );
};

export default AdminOrganisations;
