import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function CreateNewChatModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  targetMode = 'quick-form'
}) {
  const { t } = useTranslation();

  const getModalContent = () => {
    if (targetMode === 'quick-form') {
      return {
        title: t('Create New Chat?'),
        description: t(
          'To use the Quick Form, you need to create a new chat. Your current conversation will be saved and you can return to it anytime from the chat history.'
        )
      };
    } else {
      return {
        title: t('Create New Chat?'),
        description: t(
          'To switch to regular chat mode, you need to create a new chat. Your current quick form session will be saved and you can return to it anytime from the chat history.'
        )
      };
    }
  };

  const content = getModalContent();

  return (
    <Dialog
      open={open}
      onClose={!isSubmitting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}>
      <DialogTitle
        sx={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1C2024',
          pb: 1
        }}>
        {content.title}
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: '16px',
            color: '#6B7280',
            lineHeight: 1.5
          }}>
          {content.description}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontSize: '14px',
            color: '#9CA3AF',
            mt: 2,
            fontStyle: 'italic'
          }}>
          {t('Are you sure you want to continue?')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isSubmitting}
          sx={{
            flex: 1,
            py: 1.2,
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            borderColor: '#D1D5DB',
            color: '#6B7280',
            '&:hover': {
              borderColor: '#9CA3AF',
              backgroundColor: 'rgba(107, 114, 128, 0.04)'
            }
          }}>
          {t('Cancel')}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            flex: 1,
            py: 1.2,
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            backgroundColor: '#3E63DD',
            '&:hover': {
              backgroundColor: '#2E4B9E'
            },
            '&:disabled': {
              backgroundColor: '#E5E7EB',
              color: '#9CA3AF'
            }
          }}>
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
              {t('Creating...')}
            </>
          ) : (
            t('Create New Chat')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
