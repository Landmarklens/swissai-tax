import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const FilterPanel = ({ filters, onFilterChange, onClose }) => {
  const { t } = useTranslation();
  
  const handleScoreChange = (event, newValue) => {
    onFilterChange({
      scoreRange: {
        min: newValue[0],
        max: newValue[1]
      }
    });
  };
  
  const handleDateChange = (field) => (event) => {
    onFilterChange({
      dateRange: {
        ...filters.dateRange,
        [field]: event.target.value
      }
    });
  };
  
  const handleClearDates = () => {
    onFilterChange({
      dateRange: { start: null, end: null }
    });
  };
  
  const handleReset = () => {
    onFilterChange({
      status: 'all',
      sourcePortal: 'all',
      scoreRange: { min: 0, max: 100 },
      dateRange: { start: null, end: null }
    });
  };
  
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('Advanced Filters')}</Typography>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Score Range Filter */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom id="score-range-label">
            {t('Score Range')}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={[filters.scoreRange.min, filters.scoreRange.max]}
              onChange={handleScoreChange}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              aria-labelledby="score-range-label"
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 75, label: '75' },
                { value: 100, label: '100' }
              ]}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Typography variant="body2">
              {filters.scoreRange.min} - {filters.scoreRange.max}
            </Typography>
          </Box>
        </Grid>
        
        {/* Date Range Filter */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>{t('Application Date Range')}</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              type="date"
              label={t('Start Date')}
              value={filters.dateRange.start || ''}
              onChange={handleDateChange('start')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              type="date"
              label={t('End Date')}
              value={filters.dateRange.end || ''}
              onChange={handleDateChange('end')}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: filters.dateRange.start }}
              fullWidth
              size="small"
            />
          </Box>
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Button
              size="small"
              onClick={handleClearDates}
              sx={{ mt: 1 }}
            >
              {t('Clear Dates')}
            </Button>
          )}
        </Grid>
        
        {/* Portal-Specific Filters */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            {t('Portal-Specific Filters')}
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    sourcePortal: e.target.checked ? 'homegate' : 'all' 
                  })}
                />
              }
              label="Homegate"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    sourcePortal: e.target.checked ? 'flatfox' : 'all' 
                  })}
                />
              }
              label="Flatfox"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    sourcePortal: e.target.checked ? 'immoscout24' : 'all' 
                  })}
                />
              }
              label="ImmoScout24"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    sourcePortal: e.target.checked ? 'direct' : 'all' 
                  })}
                />
              }
              label={t('Direct')}
            />
          </FormGroup>
        </Grid>
        
        {/* AI Analysis Filters */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            {t('AI Analysis Filters')}
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    aiFilters: { onlyGreenFlags: e.target.checked }
                  })}
                />
              }
              label={t('Only Green Flags')}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    aiFilters: { noRedFlags: e.target.checked }
                  })}
                />
              }
              label={t('No Red Flags')}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  onChange={(e) => onFilterChange({ 
                    aiFilters: { highConfidence: e.target.checked }
                  })}
                />
              }
              label={t('High Confidence Score')}
            />
          </FormGroup>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={handleReset}>
          {t('Reset Filters')}
        </Button>
        <Button variant="contained" onClick={onClose}>
          {t('Apply Filters')}
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterPanel;