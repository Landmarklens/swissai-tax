import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVarPrefix: 'homeAi-mui',
  palette: {
    primary: {
      main: '#3E63DD',
      light: '#AEC2FF',
      lighter: '#E0E7FD',
      lightMain: '#3E63DD33',
      footer: '#1f2d5c'
    },
    secondary: {
      main: '#F0F4FF'
    },
    success: {
      main: '#65BA74',
      light: '#65BA7420',
      dark: '#4A8C56'
    },
    accent: {
      purple: '#AA99EC',
      purpleLight: '#AA99EC20',
      blue: '#8DA4EF',
      green: '#65BA74'
    },
    text: {
      primary: '#0A0A0A',
      secondary: '#666666',
      grey12: '#202020',
      dark: '#000509E3',
      muted: '#6B7280'
    },
    background: {
      default: '#d2dbf8',
      paper: '#FFFFFF',
      lightBlue: '#E0E7FD',
      skyBlue: '#edf2fe',
      iconColor: '#1f2d5c',
      yellow: '#fefbe9',
      darkYellow: '#ab6400',
      gradient: 'linear-gradient(0deg, #F7F9FF 16.38%, rgba(62, 99, 221, 0.2) 275.97%)',
      tenantBlue: '#E0E7FD',
      tenantLightBlue: '#AEC2FF'
    },
    border: {
      grey: '#c5c5c5',
      blue: '#e4ebfe'
    },
    aiCard: {
      blue: '#3e63dd',
      darkBlue: '#3158de'
    }
  },
  typography: {
    // fontFamily: "Poppins, sans-serif",
    fontFamily: 'SF Pro Display',
    h1: {
      fontWeight: 800,
      fontSize: '2rem',
      color: '#0A0A0A'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#0A0A0A'
    },
    h3: {
      fontSize: '10px'
    },
    body1: {
      fontSize: '14px',
      color: '#666666'
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' // No text transformation
    },
    success: {
      color: '#65BA74'
    }
  },
  shape: {
    borderRadius: 8 // Global border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No text transformation for all buttons
          borderRadius: '8px', // Button border radius
          padding: '10px 0', // Adjust button padding
          fontSize: '16px', // Font size
          fontWeight: 500 // Font weight for all buttons
        },
        contained: {
          backgroundColor: '#3F63EC',
          padding: '8px 16px',
          color: '#FFFFFF', // Text color for contained button
          '&:hover': {
            backgroundColor: '#3356D4' // Darker shade for hover
          }
        },
        outlined: {
          borderColor: '#E0ECFF',
          color: '#3F63EC',
          fontWeight: 500,
          padding: '8px 16px',
          backgroundColor: '#F0F4FF',
          '&:hover': {
            borderColor: '#F0F4FF',
            backgroundColor: '#E0ECFF'
          }
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
