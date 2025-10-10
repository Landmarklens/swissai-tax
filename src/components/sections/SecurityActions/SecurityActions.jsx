import React from 'react';
import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Description as DocumentIcon,
  VpnKey as KeyIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const SecurityActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 10, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Stack spacing={4} alignItems="center">
            {/* Title */}
            <Typography
              variant="h3"
              component="h2"
              fontWeight={700}
              sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
            >
              {t('security.actions.title')}
            </Typography>

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ width: '100%', maxWidth: '900px' }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/settings')}
                sx={{
                  flex: 1,
                  bgcolor: 'white',
                  color: '#667eea',
                  py: 2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('security.actions.manage_settings')}
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<DocumentIcon />}
                onClick={() => navigate('/privacy-policy')}
                sx={{
                  flex: 1,
                  bgcolor: 'white',
                  color: '#667eea',
                  py: 2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('security.actions.privacy_policy')}
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<KeyIcon />}
                onClick={() => navigate('/settings')}
                sx={{
                  flex: 1,
                  bgcolor: 'white',
                  color: '#667eea',
                  py: 2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('security.actions.enable_2fa')}
              </Button>
            </Stack>

            {/* Contact Information */}
            <Box
              sx={{
                mt: 2,
                p: 3,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              <EmailIcon sx={{ fontSize: 24 }} />
              <Typography variant="body1" fontWeight={500}>
                {t('security.actions.contact')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SecurityActions;
