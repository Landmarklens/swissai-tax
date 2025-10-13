import React, { useState, useEffect } from 'react';
import { Modal, Box, Button, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import googleIcon from '../../assets/login/google-logo.svg';
import ImageBox from './ImageBox';
import CloseIcon from '@mui/icons-material/Close';
import ImageComponent from '../Image/Image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/accountSlice';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import ErrorBoundary from '../ErrorBoundary';
import { TwoFactorVerifyModal, TwoFactorSetup } from '../TwoFactor';

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media (max-width: 580px)': {
    alignItems: 'center',
    padding: '10px 0',
    overflow: 'auto'
  }
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[5],
  borderRadius: theme.shape.borderRadius,
  width: 'calc(100% - 20px)',
  overflow: 'hidden',
  maxWidth: 763,
  maxHeight: 'calc(100vh - 50px)',
  overflowY: 'scroll',

  '@media (max-width: 580px)': {
    height: 'auto'
  }
}));

const SocialButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '40px',
  display: 'flex',
  justifyContent: 'flex-center',
  borderRadius: '6px',
  border: '0!important',
  background: 'rgba(0, 0, 51, 0.06)',
  marginBottom: theme.spacing(1),
  color: '#646464',
  fontSize: '16px',
  fontWeight: 500,
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(2)
  }
}));

const LoginSignupModal = ({ open, onClose, onAuthSuccess }) => {
  const { t } = useTranslation();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const googleAuthUrl = await authService.initiateGoogleLogin('tenant'); // Default user type for tax app

      if (googleAuthUrl && googleAuthUrl.authorization_url) {
        window.location.href = googleAuthUrl.authorization_url;
      } else {
        console.error('[Google Auth] No authorization URL received:', googleAuthUrl);
        toast.error(t('Failed to get Google authorization URL'));
      }
    } catch (error) {
      console.error('[Google Auth] Error initiating Google Sign-In:', error);
      toast.error(t('Failed to initiate Google Sign-In'));
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const access_token = urlParams.get('access_token');
  const token_type = urlParams.get('token_type');

  useEffect(() => {
    if (access_token) {
      localStorage.setItem('user', JSON.stringify({ access_token, token_type }));
      // Redirect to filings page after Google OAuth
      navigate('/filings');
    }
  }, [navigate, access_token]);

  const handleMainLogin = () => {
    setShowLoginForm(true);
    setShowSignupForm(false);
  };

  const handleSignUp = () => {
    setShowSignupForm(true);
    setShowLoginForm(false);
  };

  const handleBackToMain = () => {
    setShowLoginForm(false);
    setShowSignupForm(false);
  };

  const handleLoginSubmit = async (data, skipCloseAndNavigate = false) => {
    try {
      if (hasLoginError) {
        return;
      }
      const login = await authService.login(data.email, data.password);

      if (login.error) {
        // Check if the error indicates user not found
        const errorMessage = login.error.toLowerCase();
        if (errorMessage.includes('user not found') || errorMessage.includes('email not found') || errorMessage.includes('not found')) {
          toast.error(t('This email is not registered. Please sign up first.'));
        } else {
          toast.error(login.error || t('Login failed'));
        }
        setHasLoginError(true);
        return;
      }

      // Check if 2FA is required
      if (login.requires_2fa && login.temp_token) {
        setTemp2FAToken(login.temp_token);
        setShow2FAModal(true);
        return;
      }

      // Cookie-based auth returns {success: true, user: {...}, requires_subscription: bool}
      // Legacy token-based auth returns {access_token: "..."}
      if (login.success || login.access_token) {
        const profileAction = await dispatch(fetchUserProfile());

        if (fetchUserProfile.fulfilled.match(profileAction)) {
          // Only close and navigate if not skipped (e.g., when showing 2FA setup)
          if (!skipCloseAndNavigate) {
            onClose();

            // Check if user needs to subscribe
            if (login.requires_subscription) {
              // Redirect to subscription plans page
              navigate('/subscription/plans');
            } else {
              // Use callback if provided, otherwise default to /filings
              if (onAuthSuccess) {
                onAuthSuccess();
              } else {
                navigate('/filings');
              }
            }
          }
        } else if (fetchUserProfile.rejected.match(profileAction)) {
          toast.error(profileAction?.error?.message || t('Login failed'));
          setHasLoginError(true);
        }
      }
    } catch (error) {
      if (!hasLoginError) {
        toast.error(error?.error || error?.message || t('Login failed'));
        setHasLoginError(true);
      }
    }
  };

  const handle2FASuccess = async (data) => {
    try {
      // Close 2FA modal
      setShow2FAModal(false);
      setTemp2FAToken('');

      // Fetch user profile
      const profileAction = await dispatch(fetchUserProfile());
      if (fetchUserProfile.fulfilled.match(profileAction)) {
        toast.success(t('Login successful!'));
        onClose();

        // Check if user needs subscription (from 2FA response)
        if (data?.requires_subscription) {
          navigate('/subscription/plans');
        } else {
          // Use callback if provided, otherwise default to /filings
          if (onAuthSuccess) {
            onAuthSuccess();
          } else {
            navigate('/filings');
          }
        }
      } else {
        toast.error(t('Failed to load profile'));
      }
    } catch (error) {
      toast.error(t('Login failed'));
    }
  };

  const handleSignupSubmit = async (userData) => {
    try {
      const register = await authService.register(userData);
      if (register.error) {
        toast.error(register.error || t('Registration failed'));
        return;
      }
      if (register.id) {
        // Show success message
        toast.success(t('Registration successful! Logging you in...'));

        // Check if user needs subscription before auto-login
        if (register.requires_subscription && !userData.enable_2fa) {
          // If subscription is required and no 2FA, redirect directly to plans
          // Auto-login first
          await handleLoginSubmit(userData, true); // Skip navigation
          onClose();
          navigate('/subscription/plans');
          return;
        }

        // Auto-login with the credentials just used for registration
        // Skip close/navigate if 2FA setup will be shown
        const skipCloseAndNavigate = userData.enable_2fa;
        await handleLoginSubmit(userData, skipCloseAndNavigate);

        // If user opted for 2FA during signup, show setup modal
        if (userData.enable_2fa) {
          setShow2FASetup(true);
        }
        // Note: If enable_2fa is false, handleLoginSubmit already handled close/navigate
        // and will redirect to plans if requires_subscription is true
      }
    } catch (error) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.error ||
                          error.message;

      // Check if it's a rate limit error (429 or 400 with rate limit message)
      if (error.response?.status === 429) {
        toast.error(t('Too many registration attempts. Please wait a few minutes and try again.'));
      } else if (errorMessage) {
        // Only show error if we have a specific message
        toast.error(errorMessage);
      } else {
        // Generic fallback
        toast.error(t('Registration failed. Please try again.'));
      }
    }
  };

  const handle2FASetupComplete = () => {
    setShow2FASetup(false);
    toast.success(t('Two-factor authentication enabled successfully!'));
    onClose();
    // Use callback if provided, otherwise default to /filings
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      navigate('/filings');
    }
  };

  const handle2FASetupCancel = () => {
    setShow2FASetup(false);
    onClose();
    // Use callback if provided, otherwise default to /filings
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      navigate('/filings');
    }
  };

  return (
    <>
      <StyledModal open={open} onClose={onClose}>
        <ModalContent>
          <Box
            p={0}
            sx={{
              display: 'flex',
              height: '100%',
              '@media (max-width: 580px)': { display: 'block' }
            }}>
            <ImageBox />
            <Box
              sx={{
                width: '50%',
                padding: '32px',
                '@media (max-width: 580px)': { width: 'auto' }
              }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 4
                }}>
                <Typography
                  sx={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'black',
                    marginBottom: 0
                  }}
                  variant="h5"
                  component="h2"
                  align="center"
                  gutterBottom>
                  {t('Sign Up or Login')}
                </Typography>

                {showLoginForm || showSignupForm ? (
                  <IconButton onClick={handleBackToMain} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                  </IconButton>
                ) : (
                  <CloseIcon onClick={onClose} />
                )}
              </Box>

              {!showLoginForm && !showSignupForm && (
                <>
                  {/* <Box
                    sx={{
                      backgroundColor: '#f0f0f0',
                      borderRadius: '8px',
                      padding: '2px',
                      overflow: 'hidden'
                    }}>
                    <Button
                      onClick={() => handleChange('tenant')}
                      sx={{
                        backgroundColor: userType === 'tenant' ? 'white' : 'transparent',
                        color: userType === 'tenant' ? 'black' : 'grey',
                        '&:hover': {
                          backgroundColor: userType === 'tenant' ? 'white' : 'rgba(0, 0, 0, 0.05)'
                        },
                        transition: 'background-color 0.3s, color 0.3s',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        minWidth: '120px',
                        width: '50%'
                      }}>
                      <Typography variant="body2">{t("I'm a Tenant")}</Typography>
                    </Button>
                    <Button
                      onClick={() => handleChange('landlord')}
                      sx={{
                        backgroundColor: userType === 'landlord' ? 'white' : 'transparent',
                        color: userType === 'landlord' ? 'black' : 'grey',
                        '&:hover': {
                          backgroundColor: userType === 'landlord' ? 'white' : 'rgba(0, 0, 0, 0.05)'
                        },
                        transition: 'background-color 0.3s, color 0.3s',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        minWidth: '120px',
                        width: '50%'
                      }}>
                      <Typography variant="body2">{t("I'm an Owner")}</Typography>
                    </Button>
                  </Box> */}
                  <Box
                    sx={{
                      marginTop: 4
                    }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleMainLogin}
                      sx={{ marginBottom: 2 }}>
                      {t('Login')}
                    </Button>
                    <Typography variant="body2" align="center">
                      or{' '}
                      <Button
                        color="primary"
                        onClick={handleSignUp}
                        sx={{ textTransform: 'none', fontSize: '14px' }}>
                        {t('Sign Up')}
                      </Button>
                    </Typography>
                    <SocialButton
                      variant="outlined"
                      startIcon={<ImageComponent src={googleIcon} />}
                      onClick={handleGoogleSignIn}
                      fullWidth>
                      {t('Continue with Google')}
                    </SocialButton>
                    {/* <SocialButton
                    variant="outlined"
                    startIcon={<ImageComponent src={microsoftIcon} />}
                    fullWidth
                  >
                    Continue with Microsoft
                  </SocialButton>
                  <SocialButton
                    variant="outlined"
                    startIcon={<ImageComponent src={appleIcon} />}
                    fullWidth
                  >
                    Continue with Apple
                  </SocialButton> */}
                  </Box>
                </>
              )}

              {showLoginForm && (
                <ErrorBoundary>
                  <LoginForm
                    onBack={handleBackToMain}
                    onSubmit={handleLoginSubmit}
                    hasLoginError={hasLoginError}
                    setHasLoginError={setHasLoginError}
                  />
                </ErrorBoundary>
              )}

              {showSignupForm && (
                <ErrorBoundary>
                  <SignupForm
                    onBack={handleBackToMain}
                    onSubmit={handleSignupSubmit}
                  />
                </ErrorBoundary>
              )}
            </Box>
          </Box>
        </ModalContent>
      </StyledModal>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorVerifyModal
        open={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setTemp2FAToken('');
        }}
        tempToken={temp2FAToken}
        onSuccess={handle2FASuccess}
      />

      {/* Two-Factor Setup Modal for New Signup */}
      {show2FASetup && (
        <Modal
          open={show2FASetup}
          onClose={handle2FASetupCancel}
          aria-labelledby="2fa-setup-modal"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: '90%', md: '800px' },
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
            }}
          >
            <TwoFactorSetup
              onComplete={handle2FASetupComplete}
              onCancel={handle2FASetupCancel}
            />
          </Box>
        </Modal>
      )}
    </>
  );
};

export default LoginSignupModal;
