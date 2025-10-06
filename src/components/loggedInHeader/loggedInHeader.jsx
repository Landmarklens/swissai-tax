import { Box, useMediaQuery, Typography } from '@mui/material';
import ImageComponent from '../Image/Image';
import { useTranslation } from 'react-i18next';
import { PersonalAccountIcon } from '../personalAccountIcon/personalAccountIcon';
import { Link } from 'react-router-dom';
import { theme } from '../../theme/theme';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

const containerSx = {
  height: '64px',
  background: '#202020',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '24px'
};

const LoggedInHeader = ({ hideProfile }) => {
  const { t } = useTranslation();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Box id="LoggedInHeader" sx={containerSx}>
        <Link to="/" sx={{ textDecoration: 'none' }}>
          <ImageComponent name="logo-white" height={26} alt={t('SwissAI Tax Logo')} />
        </Link>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}>
          <LanguageSelector variant="menu" />
          {!hideProfile && <PersonalAccountIcon />}
        </Box>
      </Box>
    );
  }

  return (
    <Box id="LoggedInHeader" sx={containerSx}>
      <Link to="/" sx={{ textDecoration: 'none' }}>
        <ImageComponent name="logo-white" height={26} alt={t('SwissAI Tax Logo')} />
      </Link>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LanguageSelector variant="menu" />
        {!hideProfile && <PersonalAccountIcon />}
      </Box>
    </Box>
  );
};

export default LoggedInHeader;
