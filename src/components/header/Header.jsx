import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme, useMediaQuery } from '@mui/material';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import LoginSignupModal from '../login/Login';
import ImageComponent from '../Image/Image';
import styles from './Header.module.css';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

import { PersonalAccountIcon } from '../personalAccountIcon/personalAccountIcon';

import authService from '../../services/authService';
import { toast } from 'react-toastify';

const Header = () => {
  const { t } = useTranslation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [searchParams, setSearchParams] = useSearchParams();

  const isLoginInQuery = searchParams.has('login');

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    setIsLoggedIn(isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    setLoginOpen(isLoginInQuery);
  }, [isLoginInQuery]);


  // Check if user is in the tax filing interview process
  const isInFilingProcess = location.pathname.includes('/tax-filing/interview/');

  const menuOptions = [
    { to: '/', label: t('Home') },
    // { to: '/tenants', label: t('For Tenants') },
    // { to: '/owners', label: t('For Owners') },
    { to: '/features', label: t('Features') },
    { to: '/plan', label: t('Pricing') },
    { to: '/security', label: t('Security') },
    { to: '/faq', label: t('FAQ') },
    // { to: "/about-us", label: t("About Us") },
    { to: '/contact-us', label: t('Contact Us') }
  ];

  const loggedInMenuOptions = [
    { to: '/dashboard', label: t('Dashboard') },
    { to: '/filings', label: t('Tax Filings') },
    { to: '/documents', label: t('Documents') },
    { to: '/profile', label: t('Profile') },
    { to: '/settings', label: t('Settings') }
  ];

  // Filter menu options when user is in filing process or logged in
  const visibleMenuOptions = isInFilingProcess ? [] : (isLoggedIn ? loggedInMenuOptions : menuOptions);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleOptionClick = (to) => {
    setDrawerOpen(false);
    navigate(to);
  };

  const getStoredUserData = () => {
    try {
      const storedData = localStorage.getItem('persist:root');
      if (!storedData) return null;

      const userObject = JSON.parse(storedData);
      if (!userObject?.account) return null;

      const user = JSON.parse(userObject.account);
      return user;
    } catch (error) {
      // Error parsing user data - return null
      return null;
    }
  };

  const user = getStoredUserData();

  const getStartedHandler = () => {
    if (isAuthenticated) {
      return navigate('/dashboard');
    }

    // toast.error('Please log in');
    setLoginOpen(true);
  };

  const handleLoginClick = () => {
    setLoginOpen(true);
    // Note: We intentionally don't clear localStorage here to preserve
    // cookie consent and other user preferences across login sessions
  };

  const handleModalClose = () => {
    setSearchParams({});
    setLoginOpen(false);
  };

  const drawerContent = (
    <Box
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
      className={styles.drawerContent}>
      <List>
        {visibleMenuOptions?.map((option, index) => (
          <ListItem key={index}>
            <Link
              to={option.to}
              onClick={() => handleOptionClick(option.to)}
              className={`${styles.drawerLink} ${
                location.pathname === option.to ? styles.drawerLinkActive : ''
              }`}>
              <ListItemText primary={option.label} />
            </Link>
          </ListItem>
        ))}

        <ListItem>
          <LanguageSelector variant="list" />
        </ListItem>

        {!isLoggedIn && (
          <>
            <ListItem>
              <Button
                variant="outlined"
                fullWidth
                className={styles.drawerLoginButton}
                onClick={handleLoginClick}>
                {t('Log In')}
              </Button>
            </ListItem>
            <ListItem>
              <Button variant="contained" fullWidth onClick={getStartedHandler}>
                {t('Get Started')}
              </Button>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" className={styles.appBar}>
        <Container maxWidth="xl">
          <Toolbar className={styles.toolbar}>
            {isMobile ? (
              <>
                <Box>
                  <Link to="/" style={{ textDecoration: 'none' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '24px',
                        color: '#DC0018',
                        fontFamily: 'SF Pro Display',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      Swiss<Box component="span" sx={{ color: '#003DA5' }}>Tax</Box>
                    </Typography>
                  </Link>
                </Box>
                <IconButton
                  sx={{ zIndex: 100 }}
                  edge="end"
                  color={theme.palette.border.grey}
                  aria-label="menu"
                  onClick={toggleDrawer(true)}>
                  <MenuIcon />
                </IconButton>
                <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                  {drawerContent}
                </Drawer>
              </>
            ) : (
              <Box className={styles.desktopNav}>
                <Box>
                  <Link to="/" style={{ textDecoration: 'none' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '28px',
                        color: '#DC0018',
                        fontFamily: 'SF Pro Display',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      Swiss<Box component="span" sx={{ color: '#003DA5' }}>Tax</Box>
                    </Typography>
                  </Link>
                </Box>
                <Box className={styles.menuContainer} sx={{ display: 'flex !important' }}>
                  {visibleMenuOptions?.map((option, index) => (
                    <Link
                      key={index}
                      to={option.to}
                      className={`${styles.menuLink} ${
                        location.pathname === option.to ? styles.menuLinkActive : ''
                      }`}
                      style={{
                        fontSize: '14px',
                        color:
                          location.pathname === option.to
                            ? `${theme.palette.primary.main}`
                            : '#1A1A1A',

                        borderBottom:
                          location.pathname === option.to
                            ? `2px solid ${theme.palette.primary.lightMain}`
                            : 'none'
                      }}>
                      {option.label}
                    </Link>
                  ))}
                </Box>
                <Box className={styles.actionContainer}>
                  <LanguageSelector variant="menu" />
                  {!isLoggedIn && (
                    <Button
                      variant="outlined"
                      className={styles.loginButton}
                      onClick={handleLoginClick}>
                      {t('Log In')}
                    </Button>
                  )}

                  {isLoggedIn && <PersonalAccountIcon />}
                </Box>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <LoginSignupModal open={loginOpen} onClose={handleModalClose} />
    </>
  );
};

export default Header;
