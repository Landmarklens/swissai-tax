import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import ImageComponent from '../Image/Image';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.1)'
}));

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px'
});

const NavLinks = styled(Box)(({ theme }) => ({
  display: 'flex'
}));

const NavLink = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'transparent' // Prevent hover background
  }
}));

const LoggedInFooter = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleNavigate = (link) => {
    navigate(link);
  };

  const linkSx = {
    color: '#1F2D5C',
    padding: {
      xs: '6px',
      md: '10px'
    }
  };

  return (
    <StyledAppBar position="static" sx={{ borderTop: `1px solid #ddd}` }}>
      <StyledToolbar
        className="mobile-links"
        sx={{
          flexDirection: {
            xs: 'column',
            md: 'row'
          },
          alignItems: {
            xs: 'center',
            md: 'unset'
          }
        }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            mb: {
              xs: 2,
              md: 0
            }
          }}>
          <ImageComponent name="logo" height={26} alt="HOME AI Logo" />
        </Box>

        <NavLinks
          className="mobile-links"
          sx={{
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            alignItems: {
              xs: 'center',
              md: 'unset'
            }
          }}>
          {/*
          <NavLink onClick={() => handleNavigate('/search-property')} sx={linkSx}>
            {t('Search property')}
          </NavLink>
          <NavLink onClick={() => handleNavigate('/privacy-policy')} sx={linkSx}>
            {t('Privacy Policy')}
          </NavLink>
          <NavLink onClick={() => handleNavigate('/terms-and-conditions')} sx={linkSx}>
            {t('Terms and Conditions')}
          </NavLink>
          <NavLink onClick={() => handleNavigate('/support')} sx={linkSx}>
            {t('Support')}
          </NavLink>
          */}
        </NavLinks>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: {
              xs: 2,
              md: 0
            }
          }}>
          © 2025 Home AI, LLC
        </Typography>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default LoggedInFooter;