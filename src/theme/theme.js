import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVarPrefix: 'swissai-mui',
  palette: {
    primary: {
      main: '#DC0018',        // Swiss red
      light: '#FF3333',       // Light red for hover states
      lighter: '#FFE5E8',     // Very light red for backgrounds
      dark: '#A50014',        // Dark red for emphasis
      lightMain: '#DC001833', // Transparent red overlay
      footer: '#1f2d5c'       // Keep original footer color
    },
    secondary: {
      main: '#FFFFFF',        // Swiss white
      grey: '#F5F5F5',        // Light grey backgrounds
    },
    success: {
      main: '#00A651',        // Success green
      light: '#00A65120',     // Light green
      dark: '#007A3D'
    },
    accent: {
      green: '#00A651',       // Success/completed green
      blue: '#003DA5',        // Swiss federal blue
      gold: '#FFB81C',        // Warning/attention gold
      purple: '#6B46C1',      // Premium features
    },
    text: {
      primary: '#1A1A1A',     // Almost black for main text
      secondary: '#666666',   // Grey for secondary text
      muted: '#999999',       // Muted text
      white: '#FFFFFF',       // White text on dark backgrounds
      grey12: '#202020',
      dark: '#000509E3'
    },
    background: {
      default: '#FAFAFA',     // Light grey page background
      paper: '#FFFFFF',       // White card backgrounds
      gradient: 'linear-gradient(135deg, #DC0018 0%, #A50014 100%)',
      lightRed: '#FFE5E8',    // Light red tint
      lightGrey: '#F8F8F8',   // Very light grey
      iconColor: '#1f2d5c',
      yellow: '#fefbe9',
      darkYellow: '#ab6400',
      tenantBlue: '#E0E7FD',
      tenantLightBlue: '#AEC2FF'
    },
    error: {
      main: '#D32F2F',        // Error red
      light: '#FFEBEE',
      dark: '#C62828'
    },
    warning: {
      main: '#FFA726',        // Warning orange
      light: '#FFF3E0',
      dark: '#F57C00'
    },
    info: {
      main: '#29B6F6',        // Info blue
      light: '#E1F5FE',
      dark: '#0288D1'
    },
    border: {
      grey: '#E0E0E0',
      light: '#F0F0F0',
      dark: '#BDBDBD'
    },
    divider: 'rgba(0, 0, 0, 0.12)'
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    h1: {
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: '#1A1A1A'
    },
    h2: {
      fontSize: '36px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#1A1A1A'
    },
    h3: {
      fontSize: '28px',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1A1A1A'
    },
    h4: {
      fontSize: '24px',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#1A1A1A'
    },
    h5: {
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#1A1A1A'
    },
    h6: {
      fontSize: '18px',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#1A1A1A'
    },
    body1: {
      fontSize: '16px',
      lineHeight: 1.6,
      color: '#666666'
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.5,
      color: '#666666'
    },
    caption: {
      fontSize: '12px',
      lineHeight: 1.4,
      color: '#999999'
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '16px'
    },
    success: {
      color: '#00A651'
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(220, 0, 24, 0.2)'
          }
        },
        contained: {
          backgroundColor: '#DC0018',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#A50014'
          },
          '&:disabled': {
            backgroundColor: '#FFE5E8',
            color: '#999999'
          }
        },
        outlined: {
          borderColor: '#DC0018',
          color: '#DC0018',
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: '#A50014',
            backgroundColor: '#FFE5E8'
          }
        },
        text: {
          color: '#DC0018',
          '&:hover': {
            backgroundColor: '#FFE5E8'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500
        },
        colorPrimary: {
          backgroundColor: '#FFE5E8',
          color: '#DC0018'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '8px',
          borderRadius: '4px',
          backgroundColor: '#F0F0F0'
        },
        bar: {
          borderRadius: '4px',
          backgroundColor: '#DC0018'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px'
        }
      }
    }
  }
});
// export const theme = createTheme({
//    palette: {
//       primary: {
//          main: '#dde5ff',
//          footer: '#1f2d5c'

//       },
//       secondary: {
//          main: '#F5F7FB',
//       },
//       text: {
//          primary: '#0A0A0A',
//          secondary: '#666666',
//       },
//       background: {
//          default: '#d2dbf8',
//          paper: '#FFFFFF',

//       },
//    },
//    typography: {
//       fontFamily: "Poppins, sans-serif",
//       h1: {
//          fontWeight: 800,
//          fontSize: '2rem',
//          color: '#0A0A0A',
//       },
//       h2: {
//          fontWeight: 600,
//          fontSize: '2rem',
//          color: '#0A0A0A',
//       },
//       h3: {
//          fontSize: "10px"
//       },
//       body1: {
//          fontSize: '14px',
//          color: '#666666',
//       },
//       button: {
//          fontWeight: 600,
//          textTransform: 'none',
//          color: '#FFFFFF',
//          backgroundColor: "#3e63dd"
//       },
//    },
//    shape: {
//       borderRadius: 8,
//    },
//    components: {
//       MuiButton: {
//          styleOverrides: {
//             root: {
//                textTransform: 'none',
//                borderRadius: '5px',
//                padding: '8px 16px',
//                backgroundColor: "#2B49C7",
//                color: "#FFFFFF"
//             },
//          },
//       },
//    },
// });
