import { createTheme, type ThemeOptions } from '@mui/material/styles';

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
    const actionHover = isDark ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)';
    const actionSelected = isDark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)';

    const base: ThemeOptions = {
      palette: {
        mode,
        primary: { main: '#3f51b5' },
        secondary: { main: '#ff5722' },
        background: { default: isDark ? '#121212' : '#f8f9fa', paper: isDark ? '#1e1e1e' : '#ffffff' },
        action: {
          // Use subtle overlays for both themes so hover/selected states are not too strong
          hover: actionHover,
          selected: actionSelected,
        },
      // text: { primary: isDark ? '#ffffff' : '#000000' },
    },
    typography: {
      fontFamily: 'Poppins, Ubuntu, Roboto, Helvetica, Verdana, Arial, sans-serif',
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h6: { fontSize: '1rem' },
    },
    components: {
      // MuiButton: {
      //   styleOverrides: {
      //     root: {
      //       textTransform: 'none',
      //       // borderRadius: 0,
      //     },
      //   },
      // },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: '2.5rem',
            height: '2.5rem',
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            // Use the shared subtle hover color for IconButtons
            '&:hover': {
              backgroundColor: actionHover
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: actionHover
            }
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: actionHover
            }
          }
        }
      },
      // MuiSwitch: {
      //   styleOverrides: {
      //     switchBase: {
      //       '&.Mui-checked': {
      //         color: isDark ? '#90caf9' : '#1976d2',
      //         '& + .MuiSwitch-track': {
      //           backgroundColor: isDark ? '#4f83cc' : '#81b3e6ff',
      //           opacity: 1,
      //         },
      //       },
      //     },
      //     thumb: {
      //       color: isDark ? '#90caf9' : '#1976d2',
      //     },
      //     track: {
      //       backgroundColor: isDark ? '#4f83cc' : '#81b3e6ff',
      //       opacity: 1,
      //     },
      //   },
      // },
    },
  };
  return createTheme(base);
}

export default createAppTheme;
