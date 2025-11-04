import { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Paper, 
  Stack,
  Autocomplete,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountMenu from '../components/AppBar/AccountMenu';
import { AppBar, Toolbar } from '@mui/material';
import { debounce } from '../utils/debounce';
import { useDiagramStore } from '../store/useDiagramStore';

interface UserSearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export default function OnboardingPage() {
  const serverUrl = useDiagramStore((state) => state.serverUrl) || 'http://localhost:4000';
  const [name, setName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [localAdminEmail, setLocalAdminEmail] = useState('');
  const [companyAdmins, setCompanyAdmins] = useState<UserSearchResult[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const performUserSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      return;
    }

    setUserSearchLoading(true);
    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const resp = await apiFetch(`${serverUrl}/users/search?q=${encodeURIComponent(trimmed)}`, { method: 'GET' });
      if (!resp.ok) {
        setUserSearchResults([]);
        return;
      }
      const json = await resp.json();
      setUserSearchResults(json.users || []);
    } catch (e) {
      console.error('User search failed', e);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const debouncedUserSearch = useCallback(
    debounce((query: string) => {
      void performUserSearch(query);
    }, 300),
    [performUserSearch]
  );

  useEffect(() => {
    debouncedUserSearch(userSearchTerm);
  }, [userSearchTerm, debouncedUserSearch]);

  // Update performUserSearch dependency when serverUrl changes
  useEffect(() => {
    if (userSearchTerm.trim().length >= 2) {
      void performUserSearch(userSearchTerm);
    }
  }, [serverUrl]); // Re-run search if server URL changes

  const handleSubmit = async () => {
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const { apiFetch } = await import('../utils/apiFetch');
      const payload = {
        name,
        primaryContactName,
        primaryContactEmail: primaryEmail,
        billingAddress,
        localAdminEmail,
        companyAdminUserIds: companyAdmins.map(u => u.id),
      };

      const resp = await apiFetch(
        `${serverUrl}/onboarding/organisations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        throw new Error(text || `Server returned ${resp.status}`);
      }

      setFeedback({ type: 'success', message: 'Company onboarded successfully!' });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to onboard company';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !!(
    name.trim() &&
    primaryContactName.trim() &&
    primaryEmail.trim() &&
    billingAddress.trim() &&
    localAdminEmail.trim()
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: (theme) => theme.palette.background.default }}>
      <AppBar position="static" color="primary" sx={{ padding: '0 1rem' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            Diagramming App
          </Typography>
          <AccountMenu />
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: 4 }}>
        <Paper sx={{ maxWidth: 800, width: '100%', p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Company Onboarding
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Register a new company by providing company details, billing address, primary contact information, and company administrators.
          </Typography>

          {feedback && (
            <Alert severity={feedback.type} sx={{ mb: 3 }}>
              {feedback.message}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Company Name"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              helperText="Must be unique across all companies"
            />

            <TextField
              label="Billing Address"
              required
              fullWidth
              multiline
              rows={3}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              helperText="Complete billing address for the company"
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Primary Contact
            </Typography>

            <TextField
              label="Primary Contact Full Name"
              required
              fullWidth
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
            />

            <TextField
              label="Primary Contact Email"
              required
              fullWidth
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
            />

            <TextField
              label="Local Admin Email"
              required
              fullWidth
              type="email"
              value={localAdminEmail}
              onChange={(e) => setLocalAdminEmail(e.target.value)}
              helperText="Email address of the primary local administrator"
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Company Administrators
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search for existing users to assign as company administrators. These users will have admin capabilities scoped to this company only.
            </Typography>

            <Autocomplete
              multiple
              options={userSearchResults}
              getOptionLabel={(option) => {
                const fullName = [option.firstName, option.lastName].filter(Boolean).join(' ');
                return fullName ? `${option.username} (${fullName})` : option.username;
              }}
              value={companyAdmins}
              onChange={(_event, newValue) => {
                setCompanyAdmins(newValue);
              }}
              inputValue={userSearchTerm}
              onInputChange={(_event, newInputValue) => {
                setUserSearchTerm(newInputValue);
              }}
              loading={userSearchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Users"
                  placeholder="Type to search by username or name..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const fullName = [option.firstName, option.lastName].filter(Boolean).join(' ');
                  const label = fullName ? `${option.username} (${fullName})` : option.username;
                  return <Chip label={label} {...getTagProps({ index })} key={option.id} />;
                })
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Company'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
