import React, { useState } from 'react';
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
  MenuItem
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TaxPreferencesSection = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    autoSave: true,
    autoCalculate: true,
    showTaxTips: true,
    defaultTaxYear: new Date().getFullYear(),
    roundingMethod: 'standard'
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (setting) => (event) => {
    setPreferences({
      ...preferences,
      [setting]: event.target.checked
    });
    setHasChanges(true);
  };

  const handleSelectChange = (field) => (event) => {
    setPreferences({
      ...preferences,
      [field]: event.target.value
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving tax preferences:', preferences);
    // TODO: Save to backend/Redux
    setHasChanges(false);
  };

  return (
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

export default TaxPreferencesSection;
