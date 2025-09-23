import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageIcon from '@mui/icons-material/Language';

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: 120,
  backgroundColor: 'transparent',
  borderRadius: '8px',
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: '8px 12px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
}));

const LanguageSelector = ({ variant = 'outlined' }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];

  const changeLanguageWithRouting = (newLanguage) => {
    // Get current path without language prefix
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentLangInPath = ['en', 'de', 'fr', 'it'].includes(pathSegments[0]) ? pathSegments[0] : null;

    let pathWithoutLang = location.pathname;
    if (currentLangInPath) {
      pathWithoutLang = '/' + pathSegments.slice(1).join('/');
    }

    // Navigate to new language path
    const newPath = `/${newLanguage}${pathWithoutLang}${location.search}${location.hash}`;
    navigate(newPath);

    // Update i18n
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    changeLanguageWithRouting(newLanguage);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  if (variant === 'menu') {
    return (
      <FormControl size="small">
        <StyledSelect
          value={currentLanguage}
          onChange={handleLanguageChange}
          displayEmpty
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>{currentLang.flag}</Typography>
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                {currentLang.name}
              </Typography>
            </Box>
          )}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Typography>{language.flag}</Typography>
              </ListItemIcon>
              <ListItemText primary={language.name} />
            </MenuItem>
          ))}
        </StyledSelect>
      </FormControl>
    );
  }

  // Simple button variant for mobile
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1 }}>
        <LanguageIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
        Language
      </Typography>
      {languages.map((language) => (
        <MenuItem
          key={language.code}
          onClick={() => changeLanguageWithRouting(language.code)}
          selected={language.code === currentLanguage}
          sx={{
            borderRadius: '4px',
            mb: 0.5,
            backgroundColor: language.code === currentLanguage ? 'rgba(62, 99, 221, 0.08)' : 'transparent',
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Typography>{language.flag}</Typography>
          </ListItemIcon>
          <ListItemText primary={language.name} />
        </MenuItem>
      ))}
    </Box>
  );
};

export default LanguageSelector;