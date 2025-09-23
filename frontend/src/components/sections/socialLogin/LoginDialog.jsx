import React from 'react';
import { Dialog, DialogContent, DialogTitle, Button, Box, Grid } from '@mui/material';
import { LoginSocialGoogle, LoginSocialApple, LoginSocialMicrosoft } from 'reactjs-social-login';
import CloseIcon from '@mui/icons-material/Close';
import { Apple } from '../../../assets/svg/Apple';
import { Google } from '../../../assets/svg/Google';
import { Microsoft } from '../../../assets/svg/Microsoft';
import { useTranslation } from 'react-i18next';

/**
 * @deprecated
 */
const LoginDialog = ({ open, handleClose }) => {
  const { t } = useTranslation();

  const handleGoogleLogin = (response) => {
    console.log('Google login response:', response);
    handleClose();
    localStorage.clear()
  };

  const handleMicrosoftLogin = (response) => {
    console.log('Microsoft login response:', response);
    handleClose();
  };

  const handleAppleLogin = (response) => {
    console.log('Apple login response:', response);
    handleClose();
  };

  return (
    <Box sx={{}}>
      <Dialog
        PaperProps={{
          sx: {
            width: '60%',
            height: 320
          }
        }}
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth>
        <DialogContent>
          <Grid container spacing={2}>
            {/* left Section */}
            <Grid item xs={12} md={6}>
              {/* You can add content for the right section here */}
              <Box
                sx={{
                  height: '100%',
                  backgroundColor: '#f5f5f5', // Example background color for the right section
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 2
                }}>
                {/* Right section content */}
              </Box>
            </Grid>

            {/* Right Section */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <DialogTitle sx={{ textAlign: 'left', ml: -3, fontWeight: 600 }}>
                    {t('SignUp & Login')}
                  </DialogTitle>
                  <CloseIcon
                    onClick={handleClose}
                    sx={{ mt: 1.5, cursor: 'pointer', color: '#969697' }}
                  />
                </Box>
                <Button
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    backgroundColor: '#f0f0f3',
                    color: '#969697'
                  }}
                  startIcon={<Google sx={{ width: 24, height: 24, marginRight: 1 }} />}>
                  <LoginSocialGoogle
                    client_id="YOUR_GOOGLE_CLIENT_ID"
                    onResolve={handleGoogleLogin}
                    onReject={handleGoogleLogin}>
                    {t('Continue with Google')}
                  </LoginSocialGoogle>
                </Button>

                <Button
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    backgroundColor: '#f0f0f3',
                    color: '#969697'
                  }}
                  startIcon={<Microsoft />}>
                  <LoginSocialMicrosoft
                    client_id="YOUR_MICROSOFT_CLIENT_ID"
                    onResolve={handleMicrosoftLogin}
                    onReject={handleMicrosoftLogin}>
                    {t('Continue with Microsoft')}
                  </LoginSocialMicrosoft>
                </Button>

                <Button
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    backgroundColor: '#f0f0f3',
                    color: '#969697'
                  }}
                  startIcon={<Apple />}>
                  <LoginSocialApple
                    client_id="YOUR_APPLE_CLIENT_ID"
                    onResolve={handleAppleLogin}
                    onReject={handleAppleLogin}>
                    {t('Continue with Apple')}
                  </LoginSocialApple>
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LoginDialog;
