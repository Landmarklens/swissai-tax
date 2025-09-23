import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Grid } from '@mui/material';

import { theme } from '../../theme/theme';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useTranslation } from 'react-i18next';

const HideModal = ({ open, handleClose, action }) => {
  const { t } = useTranslation();

  return (
    <Dialog sx={{ width: '100%' }} open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('Are you sure you want to hide this property?')}</DialogTitle>
      <CloseOutlinedIcon
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          color: theme.palette.text.secondary,
          cursor: 'pointer'
        }}
      />

      <DialogContent
        sx={{
          borderTop: `1px solid ${theme.palette.border.grey}`,
          borderBottom: `1px solid ${theme.palette.border.grey}`,
          py: 0,
          [theme.breakpoints.down('md')]: {
            py: 2
          }
        }}
      >
        <Grid
          sx={{
            display: 'flex'
          }}
          container
          spacing={2}
        ></Grid>
      </DialogContent>

      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 5, pb: 2 }}>
        <Button onClick={handleClose} color="primary">
          {t('Cancel')}
        </Button>
        <Button
          onClick={action}
          variant="contained"
          sx={{
            width: '200px',
            [theme.breakpoints.down('md')]: {
              width: '150px'
            }
          }}
        >
          {t('Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HideModal;
