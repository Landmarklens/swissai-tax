import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/accountSlice';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { CircularProgress, Box } from '@mui/material';

const GoogleCallback = () => {

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
        // Store the tokens
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

        // Fetch user profile
        const profileAction = await dispatch(fetchUserProfile());

        if (fetchUserProfile.fulfilled.match(profileAction)) {
          // Handle redirects based on user type
          if (userType === 'landlord') {
            navigate('/owner-account?section=dashboard');
          } else if (userType === 'tenant') {
            // Check for saved plan
            const plan = localStorage.getItem('plan');
            if (plan) {
              localStorage.removeItem('plan');
              navigate(`/payment/${plan}`);
              return;
            }

            // Check for saved search input
            const savedInput = localStorage.getItem('input') || sessionStorage.getItem('temp_input');
            if (savedInput) {
              const params = new URLSearchParams({ input: savedInput });
              navigate(`/chat?${params.toString()}`);
              localStorage.removeItem('input');
              sessionStorage.removeItem('temp_input');
            } else {
              navigate('/my-account?section=searches');
            }
          } else {
            // Default redirect
            navigate('/my-account?section=searches');
          }
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
        title="Signing in... - HomeAI"
        description="Completing Google authentication"
      />
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    </>
  );
};

export default GoogleCallback;
