import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import {
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { settingsAPI } from '../../../services/api';

const PreferencesTab = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [preferences, setPreferences] = useState({
    // Language & Region
    language: 'en',

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

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      const data = response.data;

      setPreferences({
        language: data.preferences?.language || 'en',
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

  const handleToggle = (setting) => (event) => {
    setPreferences({
      ...preferences,
      [setting]: event.target.checked
    });
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSelectChange = (field) => (event) => {
    setPreferences({
      ...preferences,
      [field]: event.target.value
    });
    setHasChanges(true);
    setSuccess(false);
  };

  const handleLanguageChange = (event) => {
    setPreferences({
      ...preferences,
      language: event.target.value
    });
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update preferences
      await settingsAPI.updatePreferences({
        language: preferences.language,
        auto_save_enabled: preferences.autoSave,
        auto_calculate_enabled: preferences.autoCalculate,
        show_tax_tips: preferences.showTaxTips,
        default_tax_year: preferences.defaultTaxYear,
        rounding_method: preferences.roundingMethod
      });

      // Update notifications
      await settingsAPI.updateNotifications({
        email_deadline_reminders: preferences.filingReminders,
        email_document_processing: preferences.documentUpdates,
        email_tax_calculation: preferences.taxNewsletters,
        email_marketing: preferences.promotionalEmails
      });

      // Update language in i18n
      i18n.changeLanguage(preferences.language);

      setHasChanges(false);
      setSuccess(true);
      setSaving(false);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{t('Settings saved successfully')}</Alert>}

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

      {/* Save Button */}
      {hasChanges && (
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          fullWidth
          size="large"
        >
          {saving ? t('Saving...') : t('Save All Changes')}
        </Button>
      )}
    </Box>
  );
};

export default PreferencesTab;
