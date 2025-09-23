import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Slider,
  Typography,
  Autocomplete,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { usePostalCodeSuggestions } from '../../../../hooks/useAnalytics';

const LocationFilter = ({ 
  filters, 
  onFiltersChange, 
  disabled = false 
}) => {
  const [localPostalCode, setLocalPostalCode] = useState(filters.postal_code || '');
  const { suggestions, loading: suggestionsLoading, searchPostalCodes } = usePostalCodeSuggestions();

  // Debounce postal code search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localPostalCode && localPostalCode.length >= 2) {
        searchPostalCodes(localPostalCode);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localPostalCode, searchPostalCodes]);

  const handlePostalCodeChange = (event, value) => {
    const newValue = typeof value === 'string' ? value : (value?.postal_code || '');
    setLocalPostalCode(newValue);
    onFiltersChange({
      ...filters,
      postal_code: newValue,
      // Set default radius when postal code is selected, clear it when postal code is cleared
      radius_km: newValue ? (filters.radius_km || 10) : null
    });
  };

  const handleRadiusChange = (event, value) => {
    onFiltersChange({
      ...filters,
      radius_km: value
    });
  };

  const handlePropertyTypeChange = (event) => {
    onFiltersChange({
      ...filters,
      property_type: event.target.value || null
    });
  };

  const handleBedroomsChange = (event) => {
    onFiltersChange({
      ...filters,
      bedrooms: event.target.value || null
    });
  };

  const clearLocationFilter = () => {
    setLocalPostalCode('');
    onFiltersChange({
      ...filters,
      postal_code: null,
      radius_km: null
    });
  };

  const propertyTypes = [
    'apartment',
    'house',
    'studio',
    'duplex',
    'penthouse',
    'loft',
    'villa'
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
        Location & Property Filters
      </Typography>

      <Grid container spacing={3}>
        {/* Postal Code Search */}
        <Grid item xs={12} md={4}>
          <Autocomplete
            freeSolo
            options={suggestions}
            getOptionLabel={(option) => 
              typeof option === 'string' 
                ? option 
                : `${option.postal_code} - ${option.city} (${option.property_count} properties)`
            }
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {option.postal_code} - {option.city}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.property_count} properties available
                  </Typography>
                </Box>
              </Box>
            )}
            loading={suggestionsLoading}
            value={localPostalCode}
            onChange={handlePostalCodeChange}
            onInputChange={(event, newValue) => setLocalPostalCode(newValue)}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Swiss Postal Code"
                placeholder="e.g. 8001, 1200"
                helperText="Enter postal code to filter by location"
                fullWidth
              />
            )}
          />
        </Grid>

        {/* Radius Slider */}
        <Grid item xs={12} md={4}>
          <Box>
            <Typography gutterBottom id="radius-slider-label">
              Radius: {filters.radius_km || 10} km
            </Typography>
            <Slider
              value={filters.radius_km || 10}
              onChange={handleRadiusChange}
              min={1}
              max={50}
              step={1}
              disabled={disabled || !filters.postal_code}
              marks={[
                { value: 5, label: '5km' },
                { value: 15, label: '15km' },
                { value: 30, label: '30km' },
                { value: 50, label: '50km' }
              ]}
              sx={{ mt: 1 }}
              aria-label="Search radius in kilometers"
              aria-labelledby="radius-slider-label"
            />
            {!filters.postal_code && (
              <Typography variant="caption" color="text.secondary">
                Select postal code first to enable radius
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Property Type Filter */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Property Type</InputLabel>
            <Select
              value={filters.property_type || ''}
              onChange={handlePropertyTypeChange}
              disabled={disabled}
              label="Property Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {propertyTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Bedrooms Filter */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Bedrooms</InputLabel>
            <Select
              value={filters.bedrooms || ''}
              onChange={handleBedroomsChange}
              disabled={disabled}
              label="Bedrooms"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value={0}>Studio</MenuItem>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <MenuItem key={num} value={num}>
                  {num} Bedroom{num > 1 ? 's' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      {(filters.postal_code || filters.property_type || filters.bedrooms !== null) && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
            Active filters:
          </Typography>
          
          {filters.postal_code && (
            <Chip
              label={`${filters.postal_code} (${filters.radius_km || 10}km)`}
              onDelete={() => clearLocationFilter()}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {filters.property_type && (
            <Chip
              label={filters.property_type.charAt(0).toUpperCase() + filters.property_type.slice(1)}
              onDelete={() => handlePropertyTypeChange({ target: { value: '' } })}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {filters.bedrooms !== null && filters.bedrooms !== undefined && filters.bedrooms !== '' && (
            <Chip
              label={filters.bedrooms === 0 ? 'Studio' : `${filters.bedrooms} Bedroom${filters.bedrooms > 1 ? 's' : ''}`}
              onDelete={() => handleBedroomsChange({ target: { value: '' } })}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

LocationFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default React.memo(LocationFilter);