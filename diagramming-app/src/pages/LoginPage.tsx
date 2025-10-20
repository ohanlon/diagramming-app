import React, { useState } from 'react';
import { Box, Button, TextField, Tabs, Tab, Alert, Typography, ThemeProvider, createTheme, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import validator from 'validator';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useDiagramStore(state => state.login);
  const register = useDiagramStore(state => state.register);
  const currentUser = useDiagramStore(state => state.currentUser);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to diagram editor in an effect (avoid navigation during render)
  React.useEffect(() => {
    if (currentUser) {
      navigate('/diagram');
    }
  }, [currentUser, navigate]);
  if (currentUser) return null;

  const isValidEmail = (s: string) => validator.isEmail(s);

  const submit = async () => {
    setError(null);
    if (!username) return setError('Username is required');
    if (!password) return setError('Password is required');
    if (mode === 'register') {
      if (!isValidEmail(username)) return setError('Username must be a valid email address');
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirmPassword) return setError('Passwords do not match');
      if (!firstName || !firstName.trim()) return setError('First name is required');
      if (!lastName || !lastName.trim()) return setError('Last name is required');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, firstName.trim(), lastName.trim());
      }
      navigate('/diagram');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
      primary: { main: '#1976d2' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: '24px',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={lightTheme}>
      <Box sx={{ padding: 3, maxWidth: 520, margin: '40px auto' }}>
        <Paper elevation={3} sx={{ maxWidth: 520, margin: '0 auto' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>{mode === 'login' ? 'Sign in' : 'Register'}</Typography>
          <Tabs value={mode === 'login' ? 0 : 1} onChange={(_e, v) => setMode(v === 0 ? 'login' : 'register')}>
            <Tab label="Sign in" />
            <Tab label="Register" />
          </Tabs>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} autoFocus helperText={mode === 'register' ? 'Must be a valid email address' : undefined} error={mode === 'register' && username.length > 0 && !isValidEmail(username)} />
            {mode === 'register' && (
              <>
                <TextField label="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <TextField label="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
              </>
            )}
            <TextField label="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
            {mode === 'register' && (
              <TextField label="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" />
            )}
            {mode === 'register' && <Typography variant="caption">Passwords must be at least 6 characters.</Typography>}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => navigate('/')} disabled={loading}>Cancel</Button>
              <Button onClick={submit} variant="contained" disabled={loading}>{mode === 'login' ? 'Sign in' : 'Register'}</Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
