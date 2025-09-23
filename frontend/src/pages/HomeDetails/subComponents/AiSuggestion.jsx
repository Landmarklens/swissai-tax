import { Box, Typography, Button } from '@mui/material';
import React, { useState } from 'react';
import AiAvatar from '../../../assets/svg/AIAvatar';
import { theme } from '../../../theme/theme';
import ContactForm from '../../../components/contactForm/ContactForm';
import ViewingModal from '../../../components/viewingModal/ViewingModal';
import UpgradePlan from '../../../components/upgradePlan/UpgradePlan';
import { useHiddenItems } from '../../../hooks/useHideSearchedProperty/useHiddenItems';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectSubscriptions } from '../../../store/slices/subscriptionsSlice';
import { useTranslation } from 'react-i18next';
import HideModal from '../../../components/hideModal/HideModal';
import PaymentPlanModal from '../../../components/paymentPlanModal/PaymentPlanModal';

const AiSuggestion = ({ fullWidth, property, hideUpgrade, id }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openView, setViewOpen] = useState(false);
  const navigate = useNavigate();
  const [openHideModal, setOpenHideModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const { hideItem } = useHiddenItems();

  const { subscription } = useSelector(selectSubscriptions);

  const activeSubscription = subscription.data?.[0];

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewOpen(false);
  };

  const handleCloseHideModal = () => {
    setOpenHideModal(false);
  };

  const handleViewOpen = () => {
    if (!activeSubscription || activeSubscription.plan === 'free') {
      setOpenPaymentModal(true);
      return;
    }
    setViewOpen(true);
  };

  const handlePaymentModal = () => {
    navigate('/my-account?section=subscription');
  };

  const handleHideOpen = () => {
    setOpenHideModal(true);
  };

  const handleViewClose = () => {
    setOpenPaymentModal(false);
    setViewOpen(false);
  };

  const handleHide = () => {
    hideItem(id);
    setOpenHideModal(false);
    navigate(-1);
  };

  return (
    <Box
      sx={{
        pt: 5,
        pb: 2,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2
      }}>
      <Box
        sx={{
          width: !fullWidth ? '60%' : '100%',
          pl: 1,
          py: 2,
          border: `1px solid ${theme.palette.border.blue}`,
          borderRadius: '5px',
          [theme.breakpoints.down('md')]: {
            flexGrow: 1
          }
        }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1
          }}>
          <AiAvatar />
          <Typography
            sx={{
              fontWeight: 600,
              width: '100%'
            }}>
            {t('AI Recommendations')}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: '#1f2d5c',
            width: fullWidth ? 'unset' : '80%',
            marginRight: fullWidth ? '8px' : '0',
            color: 'white',
            px: 3,
            mt: 2,
            py: 2,
            borderRadius: '5px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-8px',
              left: '10px',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '10px solid #1F2A44'
            }
          }}>
          <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '16px' }}>
            {t('Why do we offer this particular option?')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '12px', py: 1 }}>
            {t(
              "Even though it's 5 minutes further from your work, it offers a larger kitchen, making it a good compromise."
            )}
          </Typography>
        </Box>
      </Box>
      {!hideUpgrade && (
        <Box
          sx={{
            border: `1px solid #E0ECFF`,
            width: '350px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '5px',
            py: 2
          }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
              position: 'relative',
              px: 2
            }}>
            {/* <Button onClick={handleClickOpen} variant="contained" fullWidth>
                    Contact Manager
                  </Button> */}
            <Button
              sx={{
                boxShadow: 'none'
              }}
              onClick={handleViewOpen}
              variant="contained"
              fullWidth>
              {t('AI Application Submission')}
            </Button>
            <Button
              sx={{
                boxShadow: 'none',
                bgcolor: '#f44336',
                ':hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
              onClick={handleHideOpen}
              variant="contained">
              {t('Hide This Variant')}
            </Button>
            {(!activeSubscription || activeSubscription.plan === 'free') && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'space-between'
                }}>
                <UpgradePlan
                  color="#3E63DD"
                  dark
                  title={t('Upgrade Plan')}
                  text={t('Get access to AI application submission')}
                />
                <Button
                  sx={{
                    width: '83px',
                    height: '32px',
                    boxShadow: 'none',
                    fontSize: 14
                  }}
                  onClick={() => navigate('/my-account?section=subscription')}
                  variant="contained"
                  fullWidth>
                  {t('Upgrade')}
                </Button>
              </Box>
            )}
          </Box>
          <ContactForm open={open} handleClose={handleClose} />
          <PaymentPlanModal
            open={openPaymentModal}
            handleClose={handleViewClose}
            action={handlePaymentModal}
            header={t('Upgrade your Plan for Application Submission')}
          />
          <HideModal open={openHideModal} handleClose={handleCloseHideModal} action={handleHide} />
          <ViewingModal property={property} open={openView} handleClose={handleViewClose} />
        </Box>
      )}
    </Box>
  );
};

export default AiSuggestion;
