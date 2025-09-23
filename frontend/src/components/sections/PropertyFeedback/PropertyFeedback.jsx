import { Box, Button, styled, Typography } from '@mui/material';
import ChatDots from '../../../assets/svg/ChatDots';
import FeedbackItem from './FeedbackItem';
import { useTranslation } from 'react-i18next';

const StyledContainer = styled(Box)(({ theme }) => ({
  borderRadius: '8px',
  border: '1px solid #C1D0FF',
  background: '#EDF2FE',
  marginTop: 18,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}));

const PropertyFeedback = ({ feedbacks, openFeedbackModal }) => {
  const { t } = useTranslation();
  return (
    <StyledContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '6px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <Box sx={{ width: '32px', height: '32px' }}>
            <ChatDots />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 18, color: '#202020', fontWeight: 500 }} variant="body2">
              {t('User Feedback')}
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                color: '#646464',
                fontWeight: 300,
                mt: '4px'
              }}
              variant="body2"
            >
              {t(
                'Did you get the experience with this apartment? Provide feedback to the AI about what was good or bad.'
              )}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          onClick={openFeedbackModal}
          sx={{
            height: '32px',
            width: '126px',
            fontWeight: 500,
            fontSize: '14px',
            color: '#1C2024',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(0, 7, 20, 0.62)',
            px: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              borderColor: '#848a98',
              boxShadow: 'none'
            }
          }}
        >
          {t('Write a feedback')}
        </Button>
      </Box>
      {feedbacks.map((item) => (
        <FeedbackItem item={item} />
      ))}
    </StyledContainer>
  );
};

export default PropertyFeedback;
