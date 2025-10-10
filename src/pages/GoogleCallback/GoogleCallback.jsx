import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/accountSlice';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const GoogleCallback = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();


  useEffect(() => {
    const handleCallback = async () => {

      const access_token = searchParams.get('access_token');
      const token_type = searchParams.get('token_type');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      if (error) {
        console.error('[GoogleCallback] OAuth error:', error, error_description);
        navigate('/');
        return;
      }

      if (access_token && token_type) {
        // LEGACY: Store tokens temporarily for backward compatibility
        // TODO: Backend should use httpOnly cookies instead of URL params
        localStorage.setItem('user', JSON.stringify({ access_token, token_type }));

        // Decode token to get user type
        let decoded;
        let userType;
        try {
          decoded = jwtDecode(access_token);
          userType = decoded?.user_type;
        } catch (decodeError) {
          console.error('[GoogleCallback] Failed to decode token:', decodeError);
        }

        // Fetch user profile - this will store proper user data
        const profileAction = await dispatch(fetchUserProfile());

        if (fetchUserProfile.fulfilled.match(profileAction)) {
          // Redirect to filings page for SwissTax app
          console.log('[GoogleCallback] Login successful, redirecting to filings');
          navigate('/filings');
        } else {
          // If profile fetch failed, still redirect to a safe page
          console.error('[GoogleCallback] Profile fetch failed:', profileAction);
          navigate('/');
        }
      } else {
        // No tokens found, redirect to home
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
