import { Box } from '@mui/material';
import Footer from '../../components/footer/Footer';
import LoggedInHeader from '../../components/loggedInHeader/loggedInHeader';
import LoggedInFooter from '../LoggedInFooter/LoggedInFooter';

const BasicLayout = (props) => {
  const { children, withPadding } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
      <LoggedInHeader></LoggedInHeader>
      <Box
        sx={{
          flex: 1,
          padding: withPadding && 4
        }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default BasicLayout;
