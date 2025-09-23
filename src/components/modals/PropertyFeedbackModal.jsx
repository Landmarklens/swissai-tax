import React, { useState } from 'react';
import {
  Modal,
  Typography,
  IconButton,
  Divider,
  Button,
  TextField,
  Box,
  Rating
} from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const StyledModalBox = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 640,
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
  margin: '24px 0'
}));

const ModalFooter = styled('div')(() => ({
  padding: '24px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const Textarea = styled('textarea')(() => ({
  marginTop: 8,
  borderRadius: 6,
  padding: '8px 12px',
  border: '1px solid rgba(0, 9, 50, 0.12)',
  background: 'rgba(255, 255, 255, 0.90)',
  minWidth: 'calc(100% - 26px)',
  maxWidth: 'calc(100% - 26px)',
  minHeight: '184px',
  maxHeight: '240px',
  fontSize: 16,
  fontFamily: 'SF Pro Display'
}));

export const PropertyFeedbackModal = ({ open, onClose, property, onSubmitFeedback }) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback.');
      return;
    }

    if (rating === 0) {
      toast.error('Please provide a rating.');
      return;
    }

    if (onSubmitFeedback) {
      onSubmitFeedback({
        propertyId: property?.property?.id || property?.id,
        feedback: feedback.trim(),
        rating,
        property: property
      });
    }

    // Reset form
    setFeedback('');
    setRating(0);
    onClose();
    toast.success('Thank you for your feedback!');
  };

  const handleClose = () => {
    setFeedback('');
    setRating(0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description">
      <StyledModalBox>
        <ModalHeader>
          <Typography
            sx={{ fontWeight: 700, fontSize: 18 }}
            id="feedback-modal-title"
            variant="h6"
            component="h2">
            {t('Tell us what you think')}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </ModalHeader>
        <Divider sx={{ width: '100%' }} />
        <ModalContent>
          <Typography
            sx={{ fontWeight: 500, fontSize: 16, color: '#1C2024', mb: 2 }}
            variant="body1">
            {t('How would you rate this property?')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#3e63dd'
                },
                '& .MuiRating-iconHover': {
                  color: '#2e4b9e'
                }
              }}
            />
            <Typography sx={{ ml: 2, fontSize: 14, color: '#6B7280' }}>
              {rating > 0 && `${rating}/5 stars`}
            </Typography>
          </Box>

          <Typography
            sx={{ fontWeight: 500, fontSize: 16, color: '#1C2024', mb: 1 }}
            variant="body1">
            {t('Your feedback')}
          </Typography>
          <Textarea
            placeholder={t('Share your thoughts about this property...')}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </ModalContent>
        <Divider sx={{ width: '100%' }} />
        <ModalFooter>
          <Button
            variant="text"
            onClick={handleClose}
            sx={{
              fontWeight: 400
            }}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            sx={{
              fontWeight: 400,
              boxShadow: 'none',
              width: 122,
              height: 48,
              backgroundColor: '#3e63dd',
              '&:hover': {
                backgroundColor: '#2e4b9e'
              }
            }}>
            {t('Submit Feedback')}
          </Button>
        </ModalFooter>
      </StyledModalBox>
    </Modal>
  );
};
