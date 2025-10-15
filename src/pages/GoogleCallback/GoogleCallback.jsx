import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/accountSlice';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const GoogleCallback = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();


  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');
      const exchange_token = searchParams.get('exchange_token');
      const requires_subscription = searchParams.get('requires_subscription');

      if (error) {
        console.error('[GoogleCallback] OAuth error:', error, error_description);
        navigate('/');
        return;
      }

      // Exchange the token for a secure httpOnly cookie
      if (exchange_token) {
        try {
          console.log('[GoogleCallback] Exchanging token for cookie...');
          await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/exchange-token`, {
            exchange_token
          });
          console.log('[GoogleCallback] Cookie set successfully');

          // Clear URL parameters after successful exchange
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error('[GoogleCallback] Failed to exchange token:', error);
          navigate('/');
          return;
        }
      }

      // Fetch user profile to populate Redux store and localStorage
      console.log('[GoogleCallback] Fetching user profile...');
      const profileAction = await dispatch(fetchUserProfile());

      if (fetchUserProfile.fulfilled.match(profileAction)) {
        console.log('[GoogleCallback] Login successful');

        // Check if subscription is required
        if (requires_subscription === 'true') {
          // Redirect to subscription plans page for plan selection
          console.log('[GoogleCallback] Subscription required, redirecting to plans');
          navigate('/subscription-plans');
        } else {
          // Redirect to filings page
          console.log('[GoogleCallback] Redirecting to filings');
          navigate('/filings');
        }
      } else {
        // If profile fetch failed, redirect to home
        console.error('[GoogleCallback] Profile fetch failed:', profileAction);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, dispatch, searchParams]);

  return (
    <>
      <SEOHelmet
        title={t("filing.signing_in_homeai")}
        description="Completing Google authentication"
      />
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    </>
  );
};

export default GoogleCallback;
