import { Modal, Box, Typography, Button, FormLabel, TextField } from '@mui/material';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';

const SignContractModal = ({ open, handleClose, handleConfirm, data, setData }) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        sx={{ '&>.MuiBox-root': { width: 800 } }}
        aria-labelledby="details-modal-title"
        aria-describedby="details-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560,
            minHeight: '200px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 0,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: '700',
                lineHeight: '26px',
                color: '#202020'
              }}
            >
              {t('Sign contract')}
            </Typography>
          </Box>
          <Box
            sx={{
              padding: '24px 40px',
              overflowY: 'auto',
              maxHeight: '600px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px'
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box item xs={12} sm={6}>
                <FormLabel component="legend" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                  {t('Type your legal name to complete signature')}
                </FormLabel>
                <TextField
                  size="small"
                  placeholder={t("filing.jon_adams")}
                  variant="outlined"
                  fullWidth
                  value={data.legalName}
                  onChange={(e) => setData({ ...data, legalName: e.target.value })}
                />
              </Box>
              <Typography
                variant="body1"
                sx={{ color: '#202020', fontSize: 14, fontWeight: 400, mt: 2 }}
              >
                {t(
                  "I, Jon Adams (jadams@gmail.com), certify that I have read the contract, and understand that clicking 'CONFIRM SIGNATURE' constitutes a legally binding signature."
                )}
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                border: '1px solid rgba(20, 0, 53, 0.15)',
                borderRadius: '8px'
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(20, 0, 53, 0.15)'
                }}
              >
                <Typography
                  sx={{ color: '#202020', fontSize: 14, fontWeight: 500 }}
                  variant="body2"
                >
                  {' '}
                  {t('Signature preview')}
                </Typography>
              </Box>
              <Box padding="24px">
                <TextField
                  size="small"
                  placeholder={t("filing.signature")}
                  variant="standard"
                  value={data.signature}
                  onChange={(e) => setData({ ...data, signature: e.target.value })}
                  sx={{
                    '& input': {
                      fontFamily: "'Alex Brush', cursive",
                      fontWeight: 400,
                      fontSize: 24
                    }
                  }}
                  fullWidth
                />
                <Typography
                  sx={{
                    color: '#202020',
                    fontSize: 14,
                    fontWeight: 400,
                    mt: 2
                  }}
                  variant="body2"
                >
                  Jon Adams
                  <br />
                  jadams@gmail.com
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderTop: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                border: 'none',
                boxShadow: 'none',
                background: 'none',
                color: '#002BB7C5',
                fontWeight: 400,
                fontSize: '18px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }
              }}
            >
              {t('Cancel')}
            </Button>
            <Button onClick={handleConfirm} variant="contained" color="primary">
              {t('Confirm Signature')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default SignContractModal;
