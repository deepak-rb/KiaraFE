import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // Blue-500 to match existing design
      light: '#60a5fa', // Blue-400
      dark: '#1d4ed8', // Blue-700
    },
    secondary: {
      main: '#8b5cf6', // Purple-500
      light: '#a78bfa', // Purple-400
      dark: '#7c3aed', // Purple-600
    },
    error: {
      main: '#ef4444', // Red-500
    },
    background: {
      default: '#f8fafc', // Gray-50
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.375rem',
        },
      },
    },
  },
});

export default theme;
