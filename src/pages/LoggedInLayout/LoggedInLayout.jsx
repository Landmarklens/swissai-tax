import { Box } from '@mui/material';
import LoggedInHeader from '../../components/loggedInHeader/loggedInHeader';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { getSubscription } from '../../store/slices/subscriptionsSlice';

const LoggedInLayout = ({ children, hideSubscription, hideProfile }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSubscription());
  }, [dispatch]);

  return (
    <Box>
      <LoggedInHeader hideSubscription={hideSubscription} hideProfile={hideProfile} />
      {children}
    </Box>
  );
};

export default LoggedInLayout;
