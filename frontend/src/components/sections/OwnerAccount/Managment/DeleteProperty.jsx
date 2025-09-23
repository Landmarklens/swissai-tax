import React from 'react';
import { Modal, Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const DeleteConfirmationModal = ({ open, handleClose, handleDelete }) => {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="delete-confirmation-modal">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            paddingTop: '17px'
          }}
        >
          <Typography
            id="delete-confirmation-modal-title"
            variant="h6"
            component="h2"
            sx={{
              paddingLeft: '40px'
            }}
          >
            {t('Delete property')}
          </Typography>
          <IconButton sx={{ paddingRight: '40px' }} onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ border: '1px solid #ddd' }} />
        <Typography
          id="delete-confirmation-modal-description"
          sx={{ marginTop: '48px', marginBottom: '48px', textAlign: 'center' }}
        >
          {t('Are you sure want to delete this property?')}
        </Typography>
        <Box sx={{ border: '1px solid #ddd', marginBottom: '24px' }} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            paddingRight: '42px',
            paddingLeft: '42px',
            paddingBottom: '24px'
          }}
        >
          <Button onClick={handleClose} sx={{ color: 'primary.main' }}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            {t('Delete')}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DeleteConfirmationModal;
