import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { keyframes } from '@mui/system';
import { theme } from '../../theme/theme';
import { House, ArrowBack, Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const moveRight = keyframes`
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  20% {
    opacity: 0.3;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    transform: translateX(100vw);
    opacity: 0;
  }
`;

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const background404s = Array.from({ length: 20 }).map((_, index) => ({
    id: index,
    top: `${Math.random() * 100}vh`,
    animationDelay: `${Math.random() * 10}s`,
    fontSize: `${Math.random() * 50 + 50}px`,
    zIndex: 1000
  }));

  return (
    <>
      <SEOHelmet
        title={t("filing.404_page_not_found_homeai")}
        description="The page you're looking for doesn't exist. Let's help you find your way back home."
        noindex={true}
      />
      <Box
        sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}>
        {background404s.map((item) => (
          <Typography
            key={item.id}
            sx={{
              position: 'absolute',
              top: item.top,
              left: 0,
              fontSize: item.fontSize,
              fontWeight: 800,
              color: theme.palette.primary.lightMain,
              opacity: 0,
              animation: `${moveRight} 15s linear infinite`,
              animationDelay: item.animationDelay
            }}>
            404
          </Typography>
        ))}
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 600,
          width: '100%',
          bgcolor: theme.palette.background.paper,
          zIndex: 1
        }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Warning
            sx={{
              animation: `${bounce} 2s infinite`,
              fontSize: 30,
              color: '#ffcc00'
            }}
          />
          <Typography variant="h1">404 | Page Not Found</Typography>
        </Box>

        <Typography sx={{ mb: 4 }}>
          Oops! It looks like the page you're looking for doesn't exist. Let's get you back on
          track.
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            fullWidth>
            Go Back
          </Button>
          <Button variant="contained" onClick={() => navigate('/')} endIcon={<House />} fullWidth>
            Go Home
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: theme.palette.primary.footer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
        <Typography variant="body1" sx={{ color: theme.palette.secondary.main }}>
          HOME AI
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default NotFound;
