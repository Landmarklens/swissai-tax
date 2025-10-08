import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { settingsAPI } from '../../../services/api';

const PreferencesTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    // Language & Region
    language: i18n.language || 'en',

    // Tax Preferences
    autoSave: true,
    autoCalculate: true,
    showTaxTips: true,
    defaultTaxYear: new Date().getFullYear(),
    roundingMethod: 'standard',

    // Notifications
    filingReminders: true,
    documentUpdates: true,
    taxNewsletters: false,
    promotionalEmails: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Watch for language changes from header and update preferences state
  useEffect(() => {
    if (i18n.language && i18n.language !== preferences.language) {
      setPreferences(prev => ({
        ...prev,
        language: i18n.language
      }));
    }
  }, [i18n.language]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      const data = response.data;

      setPreferences({
        language: i18n.language || data.preferences?.language || 'en',
        autoSave: data.preferences?.auto_save_enabled ?? true,
        autoCalculate: data.preferences?.auto_calculate_enabled ?? true,
        showTaxTips: data.preferences?.show_tax_tips ?? true,
        defaultTaxYear: data.preferences?.default_tax_year || new Date().getFullYear(),
        roundingMethod: data.preferences?.rounding_method || 'standard',
        filingReminders: data.notifications?.email?.deadline_reminders ?? true,
        documentUpdates: data.notifications?.email?.document_processing ?? true,
        taxNewsletters: data.notifications?.email?.tax_calculation ?? false,
        promotionalEmails: data.notifications?.email?.marketing ?? false
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPrefs) => {
    try {
      setSaving(true);
      setError(null);

      await settingsAPI.updatePreferences({
        language: updatedPrefs.language,
        auto_save_enabled: updatedPrefs.autoSave,
        auto_calculate_enabled: updatedPrefs.autoCalculate,
        show_tax_tips: updatedPrefs.showTaxTips,
        default_tax_year: updatedPrefs.defaultTaxYear,
        rounding_method: updatedPrefs.roundingMethod
      });

      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
      setSaving(false);
    }
  };

  const saveNotifications = async (updatedPrefs) => {
    try {
      setSaving(true);
      setError(null);

      await settingsAPI.updateNotifications({
        email_deadline_reminders: updatedPrefs.filingReminders,
        email_document_processing: updatedPrefs.documentUpdates,
        email_tax_calculation: updatedPrefs.taxNewsletters,
        email_marketing: updatedPrefs.promotionalEmails
      });

      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setError('Failed to save notifications');
      setSaving(false);
    }
  };

  const handleToggle = (setting) => async (event) => {
    const newValue = event.target.checked;
    const updatedPrefs = {
      ...preferences,
      [setting]: newValue
    };
    setPreferences(updatedPrefs);

    // Determine which API to call based on setting type
    if (['filingReminders', 'documentUpdates', 'taxNewsletters', 'promotionalEmails'].includes(setting)) {
      await saveNotifications(updatedPrefs);
    } else {
      await savePreferences(updatedPrefs);
    }
  };

  const handleSelectChange = (field) => async (event) => {
    const newValue = event.target.value;
    const updatedPrefs = {
      ...preferences,
      [field]: newValue
    };
    setPreferences(updatedPrefs);
    await savePreferences(updatedPrefs);
  };

  const handleLanguageChange = async (event) => {
    const newLanguage = event.target.value;
    const updatedPrefs = {
      ...preferences,
      language: newLanguage
    };
    setPreferences(updatedPrefs);

    // Save to backend
    await savePreferences(updatedPrefs);

    // Update language in i18n and route (sync with header)
    const oldLanguage = i18n.language;
    if (newLanguage !== oldLanguage) {
      // Get current path without language prefix
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const currentLangInPath = ['en', 'de', 'fr', 'it'].includes(pathSegments[0]) ? pathSegments[0] : null;

      let pathWithoutLang = location.pathname;
      if (currentLangInPath) {
        pathWithoutLang = '/' + pathSegments.slice(1).join('/');
      }

      // Update i18n and localStorage
      i18n.changeLanguage(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);

      // Navigate to new language path
      const newPath = `/${newLanguage}${pathWithoutLang}${location.search}${location.hash}`;
      navigate(newPath);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ '& .MuiAlert-message': { color: '#000' } }}>
          {t('Settings saved automatically')}
        </Alert>
      )}
      {saving && (
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          {t('Saving...')}
        </Alert>
      )}

      {/* Language & Region */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <LanguageIcon sx={{ color: '#DC0018' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Language & Region')}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>{t('Application Language')}</InputLabel>
            <Select
              value={preferences.language}
              onChange={handleLanguageChange}
              label={t('Application Language')}
              disabled={saving}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="it">Italiano</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Tax Preferences */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <AssignmentIcon sx={{ color: '#DC0018' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Tax Preferences')}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoSave}
                  onChange={handleToggle('autoSave')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Auto-Save Progress')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Automatically save your tax filing progress')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoCalculate}
                  onChange={handleToggle('autoCalculate')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Auto-Calculate Tax')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Automatically update tax calculations as you enter data')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.showTaxTips}
                  onChange={handleToggle('showTaxTips')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Show Tax Tips')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Display helpful tax tips throughout the filing process')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <Box>
              <Typography variant="body1" fontWeight={600} mb={1}>
                {t('Default Tax Year')}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>{t('Tax Year')}</InputLabel>
                <Select
                  value={preferences.defaultTaxYear}
                  onChange={handleSelectChange('defaultTaxYear')}
                  label={t('Tax Year')}
                  disabled={saving}
                >
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2024}>2024</MenuItem>
                  <MenuItem value={2023}>2023</MenuItem>
                  <MenuItem value={2022}>2022</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            <Box>
              <Typography variant="body1" fontWeight={600} mb={1}>
                {t('Rounding Method')}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>{t('Method')}</InputLabel>
                <Select
                  value={preferences.roundingMethod}
                  onChange={handleSelectChange('roundingMethod')}
                  label={t('Method')}
                  disabled={saving}
                >
                  <MenuItem value="standard">{t('Standard (0.05 CHF)')}</MenuItem>
                  <MenuItem value="up">{t('Round Up')}</MenuItem>
                  <MenuItem value="down">{t('Round Down')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <NotificationsIcon sx={{ color: '#DC0018' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('Notifications')}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.filingReminders}
                  onChange={handleToggle('filingReminders')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Filing Reminders')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Get reminders about upcoming tax deadlines')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.documentUpdates}
                  onChange={handleToggle('documentUpdates')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Document Updates')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Notifications when documents are processed')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taxNewsletters}
                  onChange={handleToggle('taxNewsletters')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Tax Tips Newsletter')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Receive monthly tax saving tips and updates')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.promotionalEmails}
                  onChange={handleToggle('promotionalEmails')}
                  color="primary"
                  disabled={saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {t('Promotional Emails')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Special offers and partner promotions')}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PreferencesTab;
