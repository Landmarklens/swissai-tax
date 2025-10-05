import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const NotificationSection = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    filingReminders: true,
    documentUpdates: true,
    taxNewsletters: false,
    promotionalEmails: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving notification settings:', settings);
    // TODO: Save to backend/Redux
    setHasChanges(false);
  };

  return (
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
                checked={settings.emailNotifications}
                onChange={handleToggle('emailNotifications')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {t('Email Notifications')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Receive important updates via email')}
                </Typography>
              </Box>
            }
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={settings.filingReminders}
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
                checked={settings.documentUpdates}
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
                checked={settings.taxNewsletters}
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
                checked={settings.promotionalEmails}
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

        {hasChanges && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            fullWidth
            sx={{ mt: 3 }}
          >
            {t('Save Changes')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSection;
