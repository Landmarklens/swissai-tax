import React from 'react';
import { Modal, Typography, IconButton, Divider, Box } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import Plan, { PlanCard } from '../PlanCard/PlanCard';
import AIAvatar from '../../assets/svg/AIAvatar';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { featuresPlan } from '../sections/MyAccount/Subscription/Subscription';

// Styled Box for the modal container
const StyledModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 828,
  maxHeight: '90vh',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  outline: 'none'
}));

// Modal Header
const ModalHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 40px'
}));

// Scrollable Content
const ModalContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: '32px 40px',
  maxHeight: 'calc(100vh - 200px)'
}));

const UpgradeModal = ({ currentPlan, upgradePlan, translate, open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/my-account?section=subscription');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description">
      <StyledModalBox>
        {/* Modal Header */}
        <ModalHeader>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }} id="modal-title" variant="h6">
            {t('Upgrade Plan')}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </ModalHeader>

        <Divider />

        {/* Scrollable Content */}
        <ModalContent>
          <Box display="flex" gap={1} alignItems="center" height={30}>
            <AIAvatar sx={{ mt: 0 }} />
            <Typography variant="body3" sx={{ fontWeight: 500, color: '#202020' }}>
              {t('AI Agent')}
            </Typography>
          </Box>
          <Typography variant="body3" sx={{ mb: 4, ml: 3 }}>
            {t('To get access to quality functionality, you need to upgrade your plan.')}
          </Typography>

          <Box display="flex" gap={2} mt={4}>
            <PlanCard title="Premium Advance Search" price="CHF 99.99" keyFeatures={featuresPlan} />
            {/* <Plan
              wrapperStyles={{
                width: '100%',
                height: '100%'
              }}
              name={currentPlan.name}
              price={currentPlan.price}
              count={currentPlan.count}
              keyFeatures={currentPlan.keyFeatures}
              translate={translate}
            />
            <Plan
              wrapperStyles={{ width: '100%' }}
              name={upgradePlan.name}
              price={upgradePlan.price}
              keyFeatures={upgradePlan.keyFeatures}
              isUpgrade={true}
              translate={translate}
              onUpgrade={handleUpgrade}
            /> */}
          </Box>
        </ModalContent>
      </StyledModalBox>
    </Modal>
  );
};

export default UpgradeModal;
