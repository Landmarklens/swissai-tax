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

const LoginSignupModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [userType, setUserType] = useState('tenant');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const savedInput = localStorage.getItem('input');
      if (savedInput) {
        const decodedInput = decodeURIComponent(savedInput);
        sessionStorage.setItem('temp_input', decodedInput);
      }

      const googleAuthUrl = await authService.initiateGoogleLogin(userType);

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
    const decoded = access_token ? jwtDecode(access_token) : null;
    const userType = decoded ? decoded?.user_type : null;

    if (access_token) {
      localStorage.setItem('user', JSON.stringify({ access_token, token_type }));

      if (userType === 'landlord') {
        navigate('/owner-account?section=dashboard');
      }

      if (userType === 'tenant') {
        const plan = localStorage.getItem('plan');
        if (plan) {
          localStorage.removeItem('plan');
          return navigate(`/payment/${plan}`);
        }
        
        // Check for saved search input (from localStorage or sessionStorage)
        const savedInput = localStorage.getItem('input') || sessionStorage.getItem('temp_input');
        if (savedInput) {
          const params = new URLSearchParams({ input: savedInput });
          navigate(`/chat?${params.toString()}`);
          localStorage.removeItem('input');
          sessionStorage.removeItem('temp_input');
        } else {
          navigate('/my-account?section=searches');
        }
      }
    }
  }, [navigate, access_token]);

  const handleChange = (option) => {
    setUserType(option);
  };

  const handleMainLogin = () => {
    setShowLoginForm(true);
    setShowSignupForm(false);
    const savedInput = localStorage.getItem('input');
    localStorage.clear();
    if (savedInput) {
      const decodedInput = decodeURIComponent(savedInput);
      localStorage.setItem('input', decodedInput);
    }
  };

  const handleSignUp = () => {
    setShowSignupForm(true);
    setShowLoginForm(false);
    const savedInput = localStorage.getItem('input');
    localStorage.clear();
    if (savedInput) {
      const decodedInput = decodeURIComponent(savedInput);
      localStorage.setItem('input', decodedInput);
    }
  };

  const handleBackToMain = () => {
    setShowLoginForm(false);
    setShowSignupForm(false);
  };

  const handleLoginSubmit = async (data, type) => {
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
      }

      if (login.access_token) {
        const profileAction = await dispatch(fetchUserProfile());
        if (fetchUserProfile.fulfilled.match(profileAction)) {
          const userProfile = profileAction.payload;

          onClose();
          
          // Check if there's a saved search input (only for tenants)
          const savedInput = localStorage.getItem('input');
          if (savedInput && userProfile.user_type === 'tenant') {
            // Redirect to chat with the saved input
            const params = new URLSearchParams({ input: savedInput });
            navigate(`/chat?${params.toString()}`);
            // Clear the saved input after use
            localStorage.removeItem('input');
          } else if (type) {
            // After signup, redirect based on user_type from profile
            if (userProfile.user_type === 'landlord') {
              navigate('/owner-account?section=dashboard');
            } else {
              navigate('/my-account?section=searches');
            }
          } else {
            // Regular login redirect based on user_type
            if (userProfile.user_type === 'landlord') {
              navigate('/owner-account?section=dashboard');
            } else {
              navigate('/my-account?section=searches');
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

  const handleSignupSubmit = async (userData) => {
    try {
      const register = await authService.register(userData);
      if (register.error) {
        toast.error(register.error || t('Registration failed'));
      }
      if (register.id) {
        // Pass false to ensure proper redirect based on user_type
        handleLoginSubmit(userData, false);
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
                    userType={userType}
                    onBack={handleBackToMain}
                    onSubmit={handleSignupSubmit}
                    onUserTypeChange={setUserType}
                  />
                </ErrorBoundary>
              )}
            </Box>
          </Box>
        </ModalContent>
      </StyledModal>
    </>
  );
};

export default LoginSignupModal;
