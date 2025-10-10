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
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#1976d2', // thumb color when checked (blue)
            '& + .MuiSwitch-track': {
              backgroundColor: '#81b3e6ff', // track color when checked
              opacity: 1,
            },
          },
        },
        thumb: {
           color: '#1976d2'
          // default thumb size/color — leave default but ensure contrast when unchecked
        },
        track: {
          backgroundColor: '#81b3e6ff',
          opacity: 1,
        },
      },
    },
  },
});

export default theme;