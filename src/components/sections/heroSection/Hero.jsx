import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Container
} from '@mui/material';
import Join from '../joinSection/Join';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../header/Header';
import { useTranslation } from 'react-i18next';

export const Hero = ({ handleClickOpen }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const taxFeatures = [
    t('AI-Powered Tax Interview'),
    t('Automatic Deduction Finder'),
    t('All 26 Swiss Cantons Supported')
  ];

  return (
    <Box>
      <Box
        sx={{
          height: '100vh',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(207,216,247,1) 20%, rgba(247,249,255,1) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
        <Box sx={{ height: '10%' }}>
          <Header handleClickOpen={handleClickOpen} />
        </Box>

        <Container maxWidth="xl" sx={{ height: '90%', position: 'relative' }}>
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              pt: { xs: 8, md: 0 }
            }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'left',
                flexDirection: 'column',
                width: { xs: '100%', md: '100%' },
                zIndex: 3,
                mt: { xs: 0, md: 12 },
                px: { xs: 2, md: 0 }
              }}>
                    
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: {
                          xs: '40px',
                          md: 'clamp(50px, 5vw, 80px)'
                        },
                        lineHeight: 1.2,
                        mb: 2,
                        color: 'black'
                      }}>
                      {t('Swiss Tax Filing')}
                      <br /> {t('Made Simple')}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        mb: 4,
                        fontSize: '16px',
                        fontFamily: 'SF Pro Display',
                        color: theme.palette.text.secondary
                      }}>
                      {t('AI-powered tax filing for all 26 Swiss cantons. Maximize deductions, minimize errors, and file with confidence.')}
                    </Typography>

                    <Box sx={{ py: 4 }}>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => {
                            navigate('/tax-filing/interview');
                          }}
                          sx={{
                            px: 6,
                            py: 2.5,
                            fontSize: '20px',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(62, 99, 221, 0.3)',
                            '&:hover': {
                              boxShadow: '0 6px 30px rgba(62, 99, 221, 0.4)',
                              transform: 'translateY(-2px)'
                            }
                          }}>
                          {t('Start Filing Now')}
                        </Button>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => {
                            navigate('/features');
                          }}
                          sx={{
                            px: 6,
                            py: 2.5,
                            fontSize: '20px',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '12px',
                            borderWidth: '2px',
                            '&:hover': {
                              borderWidth: '2px',
                              transform: 'translateY(-2px)'
                            }
                          }}>
                          {t('Learn More')}
                        </Button>
                      </Box>
                    </Box>

                    <Box width="100%" gap={2} display="flex" flexDirection="row" flexWrap="wrap">
                      {features.map((feature, index) => (
                        <Typography
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px'
                          }}>
                          <CheckCircleOutlineIcon
                            sx={{ mr: 1, color: '#4CAF50', fontSize: '20px' }}
                          />
                          {feature}
                        </Typography>
                      ))}
            </Box>
          </Box>
        </Container>
      </Box>
      <Join />
    </Box>
  );
};
