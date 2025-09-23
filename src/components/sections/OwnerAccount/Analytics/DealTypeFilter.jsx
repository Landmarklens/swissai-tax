import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RentIcon from '@mui/icons-material/Key';
import SellIcon from '@mui/icons-material/Sell';

const DealTypeFilter = ({ 
  filters, 
  onFiltersChange, 
  disabled = false 
}) => {
  const handleDealTypeChange = (event) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      deal_type: value
    });
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          Market Type
        </Typography>
      </Box>
      
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Choose market data to analyze
        </FormLabel>
        <RadioGroup
          value={filters.deal_type || 'rent'}
          onChange={handleDealTypeChange}
          row
        >
          <FormControlLabel
            value="rent"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RentIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Rent
              </Box>
            }
          />
          <FormControlLabel
            value="buy"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SellIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Buy
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          🔍 Showing data for <strong>{(filters.deal_type || 'rent') === 'rent' ? 'rental' : 'purchase'}</strong> properties only
        </Typography>
      </Box>
    </Paper>
  );
};

DealTypeFilter.propTypes = {
  filters: PropTypes.shape({
    deal_type: PropTypes.string
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default React.memo(DealTypeFilter);