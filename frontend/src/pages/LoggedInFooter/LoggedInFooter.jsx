import { Box } from '@mui/material';
import LoggedInFooterComp from '../../components/LoggedInFooter/LoggedInFooter';

const LoggedInFooter = ({ children, hideSubscription, hideProfile }) => {
  return (
    <Box>
      {children}
      <LoggedInFooterComp hideSubscription={hideSubscription} hideProfile={hideProfile} />
    </Box>
  );
};

export default LoggedInFooter;
