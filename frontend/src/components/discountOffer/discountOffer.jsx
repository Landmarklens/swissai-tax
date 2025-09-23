import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import TimerBox from '../boxes/timerBox';
import { useTranslation } from 'react-i18next';

const DiscountOffer = ({ discountOffer }) => {
  const { t } = useTranslation();

  const { upgradePlanName, timer } = discountOffer;
  const timerDigits = timer.split('');

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {t('Limited-Time Discount')}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {t('Upgrade your plan to')} {t(upgradePlanName)} {t('at a great price')}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {t("Don't miss your opportunity to achieve your goals")}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        {timerDigits.map((digit, index) =>
          digit === ':' ? (
            <span key={index} style={{ fontSize: '2em' }}>
              {digit}
            </span>
          ) : (
            <TimerBox key={index} value={digit} />
          )
        )}
      </Box>
      <Button variant="contained" fullWidth color="primary" sx={{ marginTop: '10px' }}>
        {t('Upgrade to Pro')}
      </Button>
      <Button
        variant="outlined"
        fullWidth
        sx={{ marginTop: '10px', color: 'black', backgroundColor: 'white' }}
      >
        {t('See all plans')}
      </Button>
    </Box>
  );
};

export default DiscountOffer;
