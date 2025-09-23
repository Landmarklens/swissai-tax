import { Check } from '@mui/icons-material';
import { Modal, Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NewContractSuccess = ({ open, handleClose }) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        sx={{ '&>.MuiBox-root': { width: '340px' } }}
        aria-labelledby="details-modal-title"
        aria-describedby="details-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px',
            minHeight: '200px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: '48px 40px 32px',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
          }}
        >
          <Box
            sx={{
              width: '56px',
              height: '56px',
              borderRadius: '56px',
              backgroundColor: '#3E63DD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <Check fontSize="large" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              textAlign: 'center',
              color: '#202020',
              fontWeight: 400
            }}
            variant="body2"
          >
            {t('Signature is confirmed and the contract sent to the renter')}
          </Typography>
          <Button onClick={handleClose} variant="text">
            {t('Got it')}
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default NewContractSuccess;
