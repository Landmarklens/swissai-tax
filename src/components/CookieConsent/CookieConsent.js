import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Link,
  Paper,
  Slide,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CookieIcon from '@mui/icons-material/Cookie';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import {
  hasConsent,
  acceptAllCookies,
  rejectNonEssentialCookies,
  setCookieConsent,
  CookieCategories,
} from '../../utils/cookieConsent/cookieConsentManager';

const CookieConsent = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [preferences, setPreferences] = useState({
    [CookieCategories.ESSENTIAL]: true, // Always true, disabled
    [CookieCategories.ANALYTICS]: false,
    [CookieCategories.PREFERENCES]: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const userHasConsent = hasConsent();
    setShowBanner(!userHasConsent);
    setOpen(!userHasConsent);
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
    setOpen(false);
    setShowSettingsDialog(false);
  };

  const handleRejectAll = () => {
    rejectNonEssentialCookies();
    setShowBanner(false);
    setOpen(false);
    setShowSettingsDialog(false);
  };

  const handleSavePreferences = () => {
    setCookieConsent({
      analytics: preferences[CookieCategories.ANALYTICS],
      preferences: preferences[CookieCategories.PREFERENCES],
    });
    setShowBanner(false);
    setOpen(false);
    setShowSettingsDialog(false);
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleTogglePreference = (category) => {
    if (category === CookieCategories.ESSENTIAL) return; // Cannot toggle essential
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const cookieCategories = [
    {
      id: CookieCategories.ESSENTIAL,
      title: t('cookieConsent.essential.title', 'Essential Cookies'),
      description: t(
        'cookieConsent.essential.description',
        'These cookies are necessary for the website to function and cannot be disabled. They are usually only set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.'
      ),
      required: true,
    },
    {
      id: CookieCategories.ANALYTICS,
      title: t('cookieConsent.analytics.title', 'Analytics Cookies'),
      description: t(
        'cookieConsent.analytics.description',
        'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular and see how visitors move around the site.'
      ),
      required: false,
    },
    {
      id: CookieCategories.PREFERENCES,
      title: t('cookieConsent.preferences.title', 'Preference Cookies'),
      description: t(
        'cookieConsent.preferences.description',
        'These cookies enable the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.'
      ),
      required: false,
    },
  ];

  return (
    <>
      {/* Bottom Banner */}
      <Slide direction="up" in={open && showBanner} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            borderRadius: 0,
            borderTop: '3px solid',
            borderColor: 'primary.main',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              maxWidth: '1400px',
              margin: '0 auto',
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={2}
            >
              {/* Cookie Icon and Message */}
              <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
                <CookieIcon color="primary" sx={{ fontSize: 40, flexShrink: 0, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {t('cookieConsent.title', 'Cookie Preferences')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t(
                      'cookieConsent.bannerDescription',
                      'We use cookies to enhance your browsing experience and analyze our traffic. You can accept all cookies, reject non-essential ones, or customize your preferences.'
                    )}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      underline="hover"
                      variant="body2"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {t('cookieConsent.privacyPolicy', 'Privacy Policy')}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      •
                    </Typography>
                    <Link
                      href="/cookie-policy"
                      target="_blank"
                      underline="hover"
                      variant="body2"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {t('cookieConsent.cookiePolicy', 'Cookie Policy')}
                    </Link>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                <Button
                  onClick={handleRejectAll}
                  variant="outlined"
                  color="inherit"
                  size="medium"
                  sx={{ minWidth: { xs: '100%', sm: '140px' } }}
                >
                  {t('cookieConsent.rejectAll', 'Reject Non-Essential')}
                </Button>
                <Button
                  onClick={handleOpenSettings}
                  variant="outlined"
                  color="primary"
                  size="medium"
                  startIcon={<SettingsIcon />}
                  sx={{ minWidth: { xs: '100%', sm: '140px' } }}
                >
                  {t('cookieConsent.customize', 'Customize')}
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  variant="contained"
                  color="primary"
                  size="medium"
                  sx={{ minWidth: { xs: '100%', sm: '140px' } }}
                >
                  {t('cookieConsent.acceptAll', 'Accept All')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Settings Dialog */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <SettingsIcon color="primary" />
              <Typography variant="h5" component="span" fontWeight="600">
                {t('cookieConsent.customizeTitle', 'Customize Cookie Preferences')}
              </Typography>
            </Box>
            <IconButton onClick={() => setShowSettingsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t(
              'cookieConsent.settingsDescription',
              'Choose which types of cookies you want to allow. Essential cookies cannot be disabled as they are necessary for the website to function properly.'
            )}
          </Typography>

          <Box sx={{ mt: 2 }}>
            {cookieCategories.map((category, index) => (
              <Accordion
                key={category.id}
                defaultExpanded={index === 0}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                    pr={2}
                  >
                    <Typography fontWeight="600">{category.title}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences[category.id]}
                          onChange={() => handleTogglePreference(category.id)}
                          disabled={category.required}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label={
                        category.required
                          ? t('cookieConsent.alwaysActive', 'Always Active')
                          : ''
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            {t('cookieConsent.learnMore', 'For more information, please read our')}{' '}
            <Link href="/privacy-policy" target="_blank" underline="hover">
              {t('cookieConsent.privacyPolicy', 'Privacy Policy')}
            </Link>{' '}
            {t('cookieConsent.and', 'and')}{' '}
            <Link href="/cookie-policy" target="_blank" underline="hover">
              {t('cookieConsent.cookiePolicy', 'Cookie Policy')}
            </Link>
            .
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleRejectAll} variant="outlined" color="inherit">
            {t('cookieConsent.rejectAll', 'Reject Non-Essential')}
          </Button>
          <Button onClick={handleSavePreferences} variant="contained" color="primary">
            {t('cookieConsent.savePreferences', 'Save Preferences')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CookieConsent;
