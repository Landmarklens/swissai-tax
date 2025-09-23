import { Box, useMediaQuery } from '@mui/material';
import ImageComponent from '../Image/Image';
import UpgradePlan from '../upgradePlan/UpgradePlan';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectSubscriptions } from '../../store/slices/subscriptionsSlice';
import { useTranslation } from 'react-i18next';
import { PersonalAccountIcon } from '../personalAccountIcon/personalAccountIcon';
import { Link } from 'react-router-dom';
import { theme } from '../../theme/theme';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

const containerSx = {
  height: '64px',
  background: '#202020',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '24px'
};

const LoggedInHeader = ({ hideProfile, hideSubscription }) => {
  const [visibleUpgrade, setVisibleUpgrade] = useState(false);

  const { t } = useTranslation();
  const { subscription } = useSelector(selectSubscriptions);

  const activePlan = subscription.data?.[0];

  useEffect(() => {
    if (!activePlan) {
      setVisibleUpgrade(true);
      return;
    }

    if (activePlan.plan === 'free' && !activePlan.canceled_at && !activePlan.next_billing_date) {
      setVisibleUpgrade(true);
      return;
    }

    if (activePlan.next_billing_date && new Date() > new Date(activePlan.next_billing_date)) {
      setVisibleUpgrade(true);
      return;
    }

    if (
      activePlan.status === 'incomplete' &&
      (!activePlan.canceled_at ||
        !activePlan.next_billing_date ||
        new Date() > new Date(activePlan.canceled_at))
    ) {
      setVisibleUpgrade(true);
      return;
    }

    setVisibleUpgrade(false);
  }, [activePlan]);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Box id="LoggedInHeader" sx={containerSx}>
        <Link to="/" sx={{ textDecoration: 'none' }}>
          <ImageComponent name="logo-white" height={26} alt={t('HOME AI Logo')} />
        </Link>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}>
          {!hideSubscription && visibleUpgrade && (
            <UpgradePlan
              title={t('Upgrade Plan')}
              text={t('Real-Time Market Scan and more')}
              color="#FFCC00"
              isMobile
            />
          )}
          <LanguageSelector variant="menu" />
          {!hideProfile && <PersonalAccountIcon />}
        </Box>
      </Box>
    );
  }

  return (
    <Box id="LoggedInHeader" sx={containerSx}>
      <Link to="/" sx={{ textDecoration: 'none' }}>
        <ImageComponent name="logo-white" height={26} alt={t('HOME AI Logo')} />
      </Link>

      {/* {!hideSubscription && visibleUpgrade && (
        <UpgradePlan
          title={t('Upgrade Plan')}
          text={t('Real-Time Market Scan and more')}
          color="#FFCC00"
        />
      )} */}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LanguageSelector variant="menu" />
        {!hideProfile && <PersonalAccountIcon />}
      </Box>
    </Box>
  );
};

export default LoggedInHeader;
