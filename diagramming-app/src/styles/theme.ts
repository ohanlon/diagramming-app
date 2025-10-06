import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#ffffff' },
    secondary: { main: '#ff5722' },
    background: { default: '#f8f9fa', paper: '#ffffff' },
  },
  typography: {
    // Ensure Ubuntu is used first; index.html already preloads Ubuntu from Google Fonts
    fontFamily: 'Poppins, Ubuntu, Roboto, Helvetica, Verdana, Arial, sans-serif',
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h6: { fontSize: '1rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          color: '#000'
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '2.5rem',
          height: '2.5rem',
        },
      },
    },
  },
});

export default theme;