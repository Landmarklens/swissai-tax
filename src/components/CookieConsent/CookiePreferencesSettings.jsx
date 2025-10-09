import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  getCookieConsent,
  setCookieConsent,
  clearCookieConsent,
  CookieCategories,
} from '../../utils/cookieConsent/cookieConsentManager';
import { initializeAnalytics, disableAnalytics } from '../../utils/cookieConsent/analyticsIntegration';

const CookiePreferencesSettings = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    [CookieCategories.ESSENTIAL]: true,
    [CookieCategories.ANALYTICS]: false,
    [CookieCategories.PREFERENCES]: false,
  });
  const [savedMessage, setSavedMessage] = useState(false);
  const [consentDate, setConsentDate] = useState(null);

  useEffect(() => {
    // Load current consent preferences
    const consent = getCookieConsent();
    if (consent) {
      setPreferences(consent.preferences);
      setConsentDate(new Date(consent.timestamp));
    }
  }, []);

  const handleToggle = (category) => {
    if (category === CookieCategories.ESSENTIAL) return; // Cannot toggle essential
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = () => {
    setCookieConsent({
      analytics: preferences[CookieCategories.ANALYTICS],
      preferences: preferences[CookieCategories.PREFERENCES],
    });

    // Update analytics based on new preferences
    if (preferences[CookieCategories.ANALYTICS]) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }

    setSavedMessage(true);
    setConsentDate(new Date());

    // Hide success message after 3 seconds
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleWithdrawConsent = () => {
    if (window.confirm(t('settings.cookies.withdraw_confirm', 'Are you sure you want to withdraw all cookie consent? This will reset your preferences and you will see the cookie banner again on your next visit.'))) {
      clearCookieConsent();
      disableAnalytics();
      setPreferences({
        [CookieCategories.ESSENTIAL]: true,
        [CookieCategories.ANALYTICS]: false,
        [CookieCategories.PREFERENCES]: false,
      });
      setConsentDate(null);
      setSavedMessage(false);
      alert(t('settings.cookies.consent_withdrawn', 'Cookie consent withdrawn. You will see the cookie banner on your next page load.'));
      window.location.reload();
    }
  };

  const cookieCategories = [
    {
      id: CookieCategories.ESSENTIAL,
      title: t('cookieConsent.essential.title', 'Essential Cookies'),
      description: t(
        'cookieConsent.essential.description',
        'These cookies are necessary for the website to function and cannot be disabled.'
      ),
      required: true,
    },
    {
      id: CookieCategories.ANALYTICS,
      title: t('cookieConsent.analytics.title', 'Analytics Cookies'),
      description: t(
        'cookieConsent.analytics.description',
        'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.'
      ),
      required: false,
    },
    {
      id: CookieCategories.PREFERENCES,
      title: t('cookieConsent.preferences.title', 'Preference Cookies'),
      description: t(
        'cookieConsent.preferences.description',
        'These cookies enable the website to remember choices you make and provide enhanced, more personal features.'
      ),
      required: false,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.cookies.title', 'Cookie Preferences')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('settings.cookies.description', 'Manage your cookie preferences and control what data is collected when you use our website.')}
      </Typography>

      {savedMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('settings.cookies.preferences_saved', 'Cookie preferences saved successfully!')}
        </Alert>
      )}

      {consentDate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('settings.cookies.last_updated', 'Last updated')}: {consentDate.toLocaleString()}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <List>
            {cookieCategories.map((category, index) => (
              <React.Fragment key={category.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                    mb={1}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {category.title}
                      </Typography>
                      {category.required && (
                        <Chip
                          label={t('cookieConsent.alwaysActive', 'Always Active')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences[category.id]}
                          onChange={() => handleToggle(category.id)}
                          disabled={category.required}
                        />
                      }
                      label=""
                    />
                  </Box>
                  <ListItemText
                    secondary={category.description}
                    sx={{ mt: 0 }}
                  />
                </ListItem>
                {index < cookieCategories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" color="primary" onClick={handleSave}>
          {t('settings.cookies.save', 'Save Preferences')}
        </Button>
        <Button variant="outlined" color="error" onClick={handleWithdrawConsent}>
          {t('settings.cookies.withdraw_all', 'Withdraw All Consent')}
        </Button>
        <Button
          variant="text"
          href="/cookie-policy"
          target="_blank"
        >
          {t('cookieConsent.cookiePolicy', 'Cookie Policy')}
        </Button>
      </Box>
    </Box>
  );
};

export default CookiePreferencesSettings;
