import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  Language as LanguageIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageSection = () => {
  const { t } = useTranslation();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [hasChanges, setHasChanges] = useState(false);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    i18n.changeLanguage(language);
    setHasChanges(false);
    // TODO: Save to backend/Redux
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <LanguageIcon sx={{ color: '#DC0018' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('Language & Region')}
          </Typography>
        </Box>

        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>{t('Application Language')}</InputLabel>
            <Select
              value={language}
              onChange={handleLanguageChange}
              label={t('Application Language')}
            >
              <MenuItem value="en">{t('filing.english')}</MenuItem>
              <MenuItem value="de">{t('filing.deutsch')}</MenuItem>
              <MenuItem value="fr">{t('filing.franais')}</MenuItem>
              <MenuItem value="it">{t('filing.italiano')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {hasChanges && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            fullWidth
          >
            {t('Save Changes')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguageSection;
