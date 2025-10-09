import React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography
} from '@mui/material';
import { theme } from '../../theme/theme';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useTranslation } from 'react-i18next';

const ContactManagerForm = ({ open, handleClose }) => {
  const { t } = useTranslation();

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      height: '35px',
      borderRadius: '4px',

      '& input': {
        padding: '12px 14px'
      }
    },
    '& .MuiInputLabel-root': {
      top: '-5px'
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle
          sx={{
            fontSize: '16px',
            borderBottom: `1px solid ${theme.palette.border.grey}`,
            fontWeight: 600
          }}>
          {t('Contact manager')}
        </DialogTitle>
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
            [theme.breakpoints.down('md')]: {
              py: '6px'
            }
          }}>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 1,
              [theme.breakpoints.down('md')]: {
                gap: 0.5
              }
            }}
            noValidate
            autoComplete="off">
            <Box>
              <Typography variant="body2" sx={{ marginBottom: '5px', fontWeight: 600 }}>
                {t('First name')}
              </Typography>
              <TextField
                sx={textFieldStyle}
                variant="outlined"
                fullWidth
                placeholder={t('Enter your First name')}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ marginBottom: '5px', fontWeight: 600 }}>
                {t('Last name')}
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                placeholder={t('Enter your Last name')}
                sx={textFieldStyle}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ marginBottom: '5px', fontWeight: 600 }}>
                {t('Email')}
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                placeholder={t('Enter email address')}
                sx={textFieldStyle}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ marginBottom: '5px', fontWeight: 600 }}>
                {t('Phone number')}
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                placeholder={t("filing.8769879876")}
                sx={textFieldStyle}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.border.grey}`
          }}>
          <Button
            onClick={handleClose}
            color="primary"
            sx={{ backgroundColor: 'transparent', color: '#3e63dd' }}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            sx={{ width: '120px', py: 1, fontWeight: 400 }}
            onClick={handleClose}>
            {t('Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContactManagerForm;
