import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, Alert, Typography } from '@mui/material';
import { useDiagramStore } from '../../store/useDiagramStore';

type Mode = 'login' | 'register';

interface Props {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

const AuthDialog: React.FC<Props> = ({ open, initialMode = 'login', onClose }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useDiagramStore(state => state.login);
  const register = useDiagramStore(state => state.register);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setUsername('');
      setPassword('');
      setError(null);
    }
  }, [open, initialMode]);

  const handleChangeMode = (_evt: React.SyntheticEvent, value: number) => {
    setError(null);
    setUsername('');
    setPassword('');
    setMode(value === 0 ? 'login' : 'register');
  };

  const submit = async () => {
    setError(null);
    if (!username) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      // success
      onClose();
    } catch (e: any) {
      console.error('Auth error:', e);
      // show error message returned by action in readable form
      setError((e && e.message) ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6">{mode === 'login' ? 'Sign in' : 'Register'}</Typography>
      </DialogTitle>
      <DialogContent>
        <Tabs value={mode === 'login' ? 0 : 1} onChange={handleChangeMode} variant="fullWidth">
          <Tab label="Sign in" />
          <Tab label="Register" />
        </Tabs>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          <TextField label="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          {mode === 'register' && <Typography variant="caption">Passwords must be at least 6 characters.</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={loading}>
          {mode === 'login' ? 'Sign in' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthDialog;
