import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Link as LinkIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useTranslation } from 'react-i18next';

const SUPPORTED_PORTALS = [
  { value: 'auto', label: 'Auto-detect', icon: '🔍' },
  { value: 'homegate', label: 'Homegate.ch', icon: '🏠' },
  { value: 'flatfox', label: 'Flatfox.ch', icon: '🦊' },
  { value: 'immoscout24', label: 'ImmoScout24.ch', icon: '🔍' }
];

const ImportMethodStep = ({
  importMethod,
  onMethodChange,
  propertyData,
  onPropertyDataChange,
  validationErrors,
  onValidationErrorsChange
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState(propertyData.url || '');
  const [portal, setPortal] = useState(propertyData.portal || 'auto');
  const [manualData, setManualData] = useState({
    title: propertyData.title || '',
    address: propertyData.address || '',
    price_chf: propertyData.price_chf || '',
    bedrooms: propertyData.bedrooms || '',
    square_meters: propertyData.square_meters || '',
    available_from: propertyData.available_from || null,
    description: propertyData.description || ''
  });

  // Auto-detect portal from URL
  useEffect(() => {
    if (url) {
      if (url.includes('homegate.ch')) {
        setPortal('homegate');
      } else if (url.includes('flatfox.ch')) {
        setPortal('flatfox');
      } else if (url.includes('immoscout24.ch')) {
        setPortal('immoscout24');
      }
    }
  }, [url]);

  // Update parent property data
  useEffect(() => {
    if (importMethod === 'url') {
      onPropertyDataChange({ ...propertyData, url, portal });
    } else {
      onPropertyDataChange({ ...propertyData, ...manualData });
    }
  }, [url, portal, manualData, importMethod]);

  const handleManualDataChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setManualData({ ...manualData, [field]: value });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      onValidationErrorsChange(newErrors);
    }
  };

  const renderMethodSelection = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        How would you like to add your property?
      </Typography>
      
      <RadioGroup
        value={importMethod}
        onChange={(e) => onMethodChange(e.target.value)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                cursor: 'pointer',
                border: importMethod === 'url' ? '2px solid' : '1px solid',
                borderColor: importMethod === 'url' ? 'primary.main' : 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => onMethodChange('url')}
            >
              <FormControlLabel
                value="url"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinkIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Import from URL
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Paste a link from Homegate, Flatfox, or ImmoScout24
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                cursor: 'pointer',
                border: importMethod === 'manual' ? '2px solid' : '1px solid',
                borderColor: importMethod === 'manual' ? 'primary.main' : 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => onMethodChange('manual')}
            >
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EditIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Manual Entry
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Enter property details manually
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Grid>
        </Grid>
      </RadioGroup>
    </Box>
  );

  const renderUrlImport = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Import Property from Listing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the URL of your property listing from a supported portal
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t("filing.property_url")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={!!validationErrors.url}
            helperText={validationErrors.url || 'Example: https://www.homegate.ch/rent/...'}
            placeholder={t("filing.httpswwwhomegatechrent")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('filing.portal')}</InputLabel>
            <Select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              label={t("filing.portal")}
            >
              {SUPPORTED_PORTALS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{p.icon}</span>
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>{t('filing.supported_portals')}</strong>
        </Typography>
        <Box sx={{ mt: 1 }}>
          {SUPPORTED_PORTALS.slice(1).map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              size="small"
              sx={{ mr: 1, mt: 0.5 }}
              icon={<span>{p.icon}</span>}
            />
          ))}
        </Box>
      </Alert>
    </Box>
  );

  const renderManualEntry = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Enter Property Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in the property information manually
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t("filing.property_title_optional")}
            value={manualData.title}
            onChange={handleManualDataChange('title')}
            placeholder={t("filing.eg_beautiful_35_room_apartment")}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label={t("filing.full_address")}
            value={manualData.address}
            onChange={handleManualDataChange('address')}
            placeholder={t("filing.eg_bahnhofstrasse_10_8001_zrich")}
            error={!!validationErrors.address}
            helperText={validationErrors.address || 'Enter the complete address including street, number, postal code and city'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="number"
            label={t("filing.monthly_rent_chf")}
            value={manualData.price_chf}
            onChange={handleManualDataChange('price_chf')}
            error={!!validationErrors.price}
            helperText={validationErrors.price}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  CHF
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="number"
            label={t("filing.number_of_rooms")}
            value={manualData.bedrooms}
            onChange={handleManualDataChange('bedrooms')}
            error={!!validationErrors.bedrooms}
            helperText={validationErrors.bedrooms || 'e.g., 3.5 for a 3.5 room apartment'}
            InputProps={{
              step: 0.5
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label={t("filing.size_m")}
            value={manualData.square_meters}
            onChange={handleManualDataChange('square_meters')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  m²
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={t("filing.available_from")}
              value={manualData.available_from}
              onChange={(newValue) => handleManualDataChange('available_from')(newValue)}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t("filing.description_optional")}
            value={manualData.description}
            onChange={handleManualDataChange('description')}
            placeholder={t("filing.add_any_additional_details_about_t_6c0c03")}
          />
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          After entering the property details, you'll set up email forwarding to automatically 
          receive and process tenant applications from various portals.
        </Typography>
      </Alert>
    </Box>
  );

  return (
    <Box>
      {renderMethodSelection()}
      
      <Divider sx={{ my: 3 }} />
      
      {importMethod === 'url' ? renderUrlImport() : renderManualEntry()}
    </Box>
  );
};

export default ImportMethodStep;