import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Email as EmailIcon } from '@mui/icons-material';

const SecurityActions = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 8, bgcolor: 'white' }}>
      <Container maxWidth="md">
        <Box
          sx={{
            p: 4,
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('security.actions.title')}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: 20, color: '#667eea' }} />
              <Typography variant="body1" color="text.secondary">
                Questions? Contact{' '}
                <Box
                  component="a"
                  href="mailto:contact@swissai.tax"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  contact@swissai.tax
                </Box>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default SecurityActions;
