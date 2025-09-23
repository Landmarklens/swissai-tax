import React, { useState } from 'react';
import {
  Modal,
  Typography,
  IconButton,
  Divider,
  Button,
  Box,
  FormControl,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Radio
} from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import { jsonData } from '../../db';
import { useTranslation } from 'react-i18next';

const StyledModalBox = styled('div')(({ theme, step }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: step > 2 ? 480 : 640,
  maxWidth: 'calc(100% - 20px)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  boxShadow: 24
}));

const ModalHeader = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 40px',
  marginRight: -8
}));

const ModalContent = styled('div')(() => ({
  padding: '10px 40px',
  margin: '24px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}));

const ModalFooter = styled('div')(({ step }) => ({
  padding: '24px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: step !== 4 ? 'space-between' : 'center'
}));

const Textarea = styled('textarea')(() => ({
  marginTop: 8,
  borderRadius: 6,
  padding: '8px 12px',
  border: '1px solid rgba(0, 9, 50, 0.12)',
  background: 'rgba(255, 255, 255, 0.90)',
  minWidth: 'calc(100% - 26px)',
  maxWidth: 'calc(100% - 26px)',
  minHeight: '80px',
  maxHeight: '120px',
  fontSize: 16,
  fontFamily: 'SF Pro Display'
}));

const AcceptButton = styled(Button)({
  fontWeight: 400,
  boxShadow: 'none',
  width: 120,
  height: 40,
  backgroundColor: '#fff',
  border: '1px solid rgba(0, 7, 20, 0.62)',
  color: '#1F2D5C',
  margin: '0 auto',
  '&:hover': {
    border: '1px solid rgba(0, 7, 20, 0.62)'
  }
});

const CancelSubscription = ({ open, onClose, onConfirm, isLoading, name }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');

  const handleClose = () => {
    onClose();
    setStep(0);
    setSelectedReason('');
  };

  const handleReasonChange = (event) => {
    setSelectedReason(event.target.value);
  };

  const handleStep = (type) => {
    if ((!type && step === 0) || (step === 4 && type)) {
      return handleClose();
    }
    if (type) {
      if (step === 3) {
        onConfirm(selectedReason);
      }
      return setStep((step) => step + 1);
    }

    return setStep((step) => step - 1);
  };

  const renderContent = () => {
    if (step === 0) {
      return (
        <ModalContent>
          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              maxWidth: 500,
              margin: '0 auto',
              fontSize: 32
            }}
            variant="h2"
          >
            {t('What would bring you back to HOME AI Premium Advance Search?')}
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#000', fontWeight: 300 }} variant="body1">
            {t(
              "We're a small team working hard to make the best product possible. Please let us know where we need to improve whether that's product features, user experience, design, or anything else on your mind."
            )}
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#000', fontWeight: 300 }} variant="body1">
            {t("How's Premium Advance Search for")}{' '}
            <span style={{ fontWeight: 700 }}>{t('40% off')}</span> {t('instead?')}
          </Typography>
        </ModalContent>
      );
    }

    if (step === 1) {
      return (
        <ModalContent>
          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              maxWidth: 500,
              margin: '0 auto',
              fontSize: 32
            }}
            variant="h2"
          >
            {t("What's going wrong?")}
          </Typography>
          <Typography
            sx={{
              fontSize: 20,
              color: '#000',
              textAlign: 'center',
              fontWeight: 300
            }}
            variant="body1"
          >
            {t("We'd love to hear why you are thinking about cancelling.")}
          </Typography>
          <Box sx={{ mt: -2 }}>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="feedback-reason"
                name="feedback-reason"
                value={selectedReason}
                onChange={handleReasonChange}
              >
                {jsonData.cancelSubscriptionReasons.map((reason, index) => (
                  <FormControlLabel
                    key={index}
                    value={reason}
                    control={<Radio />}
                    label={t(reason)}
                    sx={{ marginBottom: -1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            {selectedReason === 'Other' && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: 16, color: '#1C2024' }}
                  variant="body1"
                >
                  {t('Could you tell us more? Be brutally honest')}
                </Typography>
                <Textarea placeholder={t('We read every answer...')} />
              </Box>
            )}
          </Box>
        </ModalContent>
      );
    }

    if (step === 2) {
      return (
        <ModalContent>
          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              maxWidth: 540,
              margin: '0 auto',
              fontSize: 32
            }}
            variant="h2"
          >
            {t("Still not convinced? How's Premium for 40% off instead?")}
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#000', fontWeight: 300 }} variant="body1">
            {/* {t(
              "We're a small team and truly value your business. We would really hate to see you go. If you decide to purchase HOME AI you'll get 40% off your Premium Advance Search subscription for the entire year and we know we'll grow to delight you!"
            )} */}
            {t(
              `We're a small team and truly value your business. We would really hate to see you go. If you decide to purchase HOME AI you'll get 40% off your Premium ${name} subscription for the entire year and we know we'll grow to delight you!`
            )}
          </Typography>
          <Box
            sx={{
              borderRadius: '16px',
              background: '#E1E9FF',
              px: 2,
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              mt: 2,
              textAlign: 'center'
            }}
          >
            <Typography
              sx={{
                fontWeight: 300,
                fontSize: 20
              }}
              variant="h5"
            >
              {t('Claim your limited-time offer:')}
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                maxWidth: 540,
                margin: '0 auto',
                fontSize: 32
              }}
              variant="h2"
            >
              {t('40% off for 12 months')}{' '}
            </Typography>
            <AcceptButton>{t('Accept Offer')}</AcceptButton>
          </Box>
        </ModalContent>
      );
    }

    if (step === 3) {
      return (
        <ModalContent>
          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              maxWidth: 540,
              margin: '0 auto',
              fontSize: 32
            }}
            variant="h2"
          >
            {t('Just making sure.')}
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              color: '#000',
              textAlign: 'center',
              fontWeight: 300
            }}
            variant="body1"
          >
            {t('You’ll only be able to match 1 and won’t be able to get premium feature.')}
          </Typography>
        </ModalContent>
      );
    }

    return (
      <ModalContent>
        <Typography
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            maxWidth: 540,
            margin: '0 auto',
            fontSize: 32
          }}
          variant="h2"
        >
          {t('Cancellation Confirmed.')}
        </Typography>
        <Typography
          sx={{
            fontSize: 16,
            color: '#000',
            textAlign: 'center',
            fontWeight: 300
          }}
          variant="body1"
        >
          {t('You won’t be billed again.')}
        </Typography>
      </ModalContent>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <StyledModalBox step={step}>
        <ModalHeader>
          <Typography
            sx={{ fontWeight: 700, fontSize: 18 }}
            id="modal-title"
            variant="h6"
            component="h2"
          >
            {t('Cancel Subscription')}
          </Typography>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </ModalHeader>
        <Divider sx={{ width: '100%' }} />
        {renderContent()}
        <Divider sx={{ width: '100%' }} />
        <ModalFooter step={step}>
          {step !== 4 && (
            <Button
              variant="text"
              onClick={() => handleStep(0)}
              sx={{
                fontWeight: 400
              }}
            >
              {t('Go Back')}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => handleStep(1)}
            sx={{
              fontWeight: 400,
              boxShadow: 'none',
              px: 3,
              height: 48
            }}
            disabled={isLoading || (step === 1 && !selectedReason)}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : step === 2 ? (
              t('Decline Offer')
            ) : step === 3 ? (
              t('Confirm & Cancel')
            ) : step === 4 ? (
              t('Go to Account')
            ) : (
              t('Next')
            )}
          </Button>
        </ModalFooter>
      </StyledModalBox>
    </Modal>
  );
};

export default CancelSubscription;
