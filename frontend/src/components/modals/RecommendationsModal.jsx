import React from 'react';
import { Modal, Box, Typography, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';

const RecommendationsModal = ({ open, onClose, onShowRecommendations, completionPercentage }) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="recommendations-modal-title"
      aria-describedby="recommendations-modal-description">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 32px',
            borderBottom: `1px solid ${theme.palette.border.grey}`
          }}>
          <Typography
            id="recommendations-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              fontSize: '18px',
              color: '#202020'
            }}>
            {t('Show Recommendations')}
          </Typography>
        </Box>

        <Box
          sx={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              mb: 3
            }}>
            <CircularProgress
              variant="determinate"
              value={completionPercentage}
              size={80}
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  color: theme.palette.primary.main
                }}>
                {`${Math.round(completionPercentage)}%`}
              </Typography>
            </Box>
          </Box>

          <Typography
            id="recommendations-modal-description"
            sx={{
              fontSize: '16px',
              color: '#374151',
              fontWeight: 400,
              mb: 1,
              lineHeight: 1.5
            }}>
            {t('You have completed only')} {Math.round(completionPercentage)}%{' '}
            {t('of the interview.')}
          </Typography>

          <Typography
            sx={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: 400,
              lineHeight: 1.5
            }}>
            {t(
              'Remember, the more we know about what you search, the better results we can offer.'
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '24px 32px',
            borderTop: `1px solid ${theme.palette.border.grey}`,
            gap: 2
          }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              flex: 1,
              fontWeight: 500,
              fontSize: '14px',
              py: 1.5,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: 'rgba(62, 99, 221, 0.04)'
              }
            }}>
            {t('Return to Chat')}
          </Button>
          <Button
            onClick={onShowRecommendations}
            variant="contained"
            sx={{
              flex: 1,
              fontWeight: 500,
              fontSize: '14px',
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            }}>
            {t('Show me Recommendations')}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default RecommendationsModal;
