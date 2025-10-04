import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVarPrefix: 'swissai-tax',
  palette: {
    primary: {
      main: '#003DA5',        // Swiss federal blue - more professional for tax
      light: '#0052CC',       // Light blue for hover states
      lighter: '#E6F0FF',     // Very light blue for backgrounds
      dark: '#002E7A',        // Dark blue for emphasis
      lightMain: '#003DA533', // Transparent blue overlay
      footer: '#1A1A1A',      // Professional dark footer
      red: '#DC0018',         // Swiss red as accent
      redLight: '#FFE5E8'     // Light red for alerts/highlights
    },
    aiCard: {
      blue: '#003DA5',        // Blue for AI card buttons
      lightBlue: '#E6F0FF',   // Light blue for AI card backgrounds
      darkBlue: '#002E7A'     // Dark blue for AI card elements
    },
    secondary: {
      main: '#FFFFFF',        // Swiss white
      grey: '#F5F5F5',        // Light grey backgrounds
      darkGrey: '#2C3E50',    // Professional dark grey
    },
    success: {
      main: '#00A651',        // Success green (refunds, savings)
      light: '#E8F5E9',       // Light green background
      dark: '#007A3D'
    },
    accent: {
      green: '#00A651',       // Success/savings green
      blue: '#003DA5',        // Swiss federal blue
      gold: '#FFB81C',        // Deadlines/attention gold
      red: '#DC0018',         // Swiss red accent
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
      gradient: 'linear-gradient(135deg, #003DA5 0%, #002E7A 100%)', // Professional blue gradient
      lightBlue: '#E6F0FF',   // Light blue for sections
      lightGrey: '#F8F8F8',   // Very light grey
      iconColor: '#003DA5',   // Federal blue for icons
      sectionAlt: '#F0F4F8',  // Alternative section background
      cardHover: '#FAFBFC',   // Card hover state
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
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          '&:hover': {
            // More conservative hover - no translateY
            boxShadow: '0 4px 12px rgba(0, 61, 165, 0.15)'
          }
        },
        contained: {
          backgroundColor: '#003DA5',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#002E7A'
          },
          '&:disabled': {
            backgroundColor: '#E6F0FF',
            color: '#999999'
          }
        },
        outlined: {
          borderColor: '#003DA5',
          color: '#003DA5',
          backgroundColor: 'transparent',
          borderWidth: '2px',
          '&:hover': {
            borderColor: '#002E7A',
            backgroundColor: '#E6F0FF',
            borderWidth: '2px'
          }
        },
        text: {
          color: '#003DA5',
          '&:hover': {
            backgroundColor: '#E6F0FF'
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
          backgroundColor: '#E6F0FF',
          color: '#003DA5'
        },
        colorSuccess: {
          backgroundColor: '#E8F5E9',
          color: '#00A651'
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
          backgroundColor: '#003DA5'
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

// import { createTheme } from '@mui/material/styles';
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
