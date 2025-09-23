import React from 'react';
import { FormControl, FormLabel, MenuItem, Select, FormHelperText, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const labelSx = {
  fontWeight: 500,
  mb: 1,
  fontSize: '0.875rem',
  color: 'text.primary'
};

const languageOptions = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' }
];

const LanguageSelect = ({ formik, sx = {}, onBlur }) => {
  const { t } = useTranslation();

  const error = formik.touched.language && Boolean(formik.errors.language);
  const helperText = formik.touched.language && formik.errors.language;

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <FormLabel component="legend" sx={labelSx}>
        {t('Language')}
      </FormLabel>
      <FormControl fullWidth size="small" error={error}>
        <Select
          id="language"
          name="language"
          displayEmpty
          variant="outlined"
          value={formik.values.language}
          onChange={formik.handleChange}
          onBlur={(e) => {
            formik.handleBlur(e);
            onBlur?.(e);
          }}>
          <MenuItem disabled value="">
            {t('Select language')}
          </MenuItem>
          {languageOptions.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};

export { LanguageSelect };
