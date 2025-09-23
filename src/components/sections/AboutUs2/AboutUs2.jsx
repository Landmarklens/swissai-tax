import { Box, Typography, Container } from '@mui/material';
import React from 'react';
import { theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next';

const AboutUs2 = () => {
  const { t } = useTranslation();

  const images = [
    'https://images.unsplash.com/photo-1635097914787-bba5e2805f0d?q=80&w=1947&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1525748822304-6807cb1348ab?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1524293568345-75d62c3664f7?q=80&w=1911&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1532703321856-d512f3613d54?q=80&w=1954&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1535411436013-2e134d62845c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          px: 1,
          py: 7
        }}
      >
        <Box
          sx={{
            width: '100%',
            textAlign: 'center',
            py: 3,
            gap: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: '35px',
              lineHeight: '40px'
            }}
          >
            {t('Meet The Team Behind The AI')}
          </Typography>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px'
            }}
          >
            {t('About us description 2')}
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            gap: 1,
            height: '320px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            [theme.breakpoints.down('md')]: {
              height: 'auto'
            }
          }}
        >
          {images.map((image, index) => (
            <Box
              sx={{
                width: '13%',
                height: '90%',
                p: 0.5,
                border: `1.5px solid ${theme.palette.border.blue}`,
                borderRadius: '4px',
                alignSelf: index % 2 === 0 ? 'end' : 'start',
                [theme.breakpoints.down('md')]: {
                  width: '30%',
                  alignSelf: 'start',
                  height: '100%'
                }
              }}
            >
              <Box
                component="img"
                src={image}
                alt="HomeAI"
                sx={{
                  width: '100%',
                  height: '80%',
                  objectFit: 'cover',
                  borderRadius: '2px',
                  [theme.breakpoints.down('sm')]: {
                    height: '300px'
                  }
                }}
              />

              <Box
                sx={{
                  pt: 2,
                  pl: 1
                }}
              >
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: 'black'
                  }}
                >
                  Jhon D
                </Typography>
                <Typography
                  sx={{
                    fontSize: '10px'
                  }}
                >
                  {t('Team Lead')}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default AboutUs2;
