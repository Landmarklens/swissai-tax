import React from 'react';
import { Box, Typography, Chip, LinearProgress, Tooltip, IconButton } from '@mui/material';
import { Info, Refresh, CheckCircle, Warning } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';

const EnrichmentDataDisplay = ({ enrichment, onRefresh }) => {
  const { t } = useTranslation();
  if (!enrichment) return null;

  const { metadata, data, missing_fields } = enrichment;
  const completenessPercent = Math.round((metadata?.completeness || 0) * 100);

  // Calculate data age
  const getDataAge = () => {
    if (!metadata?.computed_at) return null;
    const computedTime = new Date(metadata.computed_at);
    const ageMinutes = Math.floor((Date.now() - computedTime) / 60000);
    
    if (ageMinutes < 60) return t('minutes_ago', { count: ageMinutes });
    if (ageMinutes < 1440) return t('hours_ago', { count: Math.floor(ageMinutes / 60) });
    return t('days_ago', { count: Math.floor(ageMinutes / 1440) });
  };

  const dataAge = getDataAge();
  const isStale = dataAge && parseInt(dataAge) > 120;

  return (
    <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.background.paper, borderRadius: 2 }}>
      {/* Data Completeness Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {t('property_insights')}
          </Typography>
          {metadata?.cache_hit && (
            <Chip 
              label={t('cached')} 
              size="small" 
              sx={{ fontSize: '11px', height: '20px' }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {dataAge && (
            <Typography variant="caption" color="text.secondary">
              {t('updated')} {dataAge}
            </Typography>
          )}
          <Tooltip title={t('refresh_data')}>
            <IconButton size="small" onClick={onRefresh} disabled={!isStale}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Completeness Indicator */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {t('data_completeness')}
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {completenessPercent}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={completenessPercent} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: completenessPercent >= 80 ? 
                theme.palette.success.main : 
                completenessPercent >= 50 ? 
                  theme.palette.warning.main : 
                  theme.palette.error.main
            }
          }}
        />
      </Box>

      {/* Enrichment Data Display */}
      {data && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Travel Times */}
          {data.work_travel && (
            <Box>
              <Typography variant="caption" fontWeight="medium" color="text.secondary">
                {t('commute_to_work')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2">
                  {Math.round(data.work_travel.duration / 60)} min • {(data.work_travel.distance / 1000).toFixed(1)} km
                </Typography>
                {data.work_travel.meets_max_time ? (
                  <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <Warning sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                )}
              </Box>
            </Box>
          )}

          {/* Tax Information */}
          {data.tax_burden ? (
            <Box>
              <Typography variant="caption" fontWeight="medium" color="text.secondary">
                {t('estimated_tax')}
              </Typography>
              <Typography variant="body2">
                {t('tax_amount_per_year', { amount: data.tax_burden.annual_tax.toLocaleString(), rate: (data.tax_burden.effective_rate * 100).toFixed(1) })}
              </Typography>
            </Box>
          ) : (
            missing_fields?.find(f => f.field === 'tax_burden') && (
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: theme.palette.warning.light + '20',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Info sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                <Box>
                  <Typography variant="caption" fontWeight="medium">
                    {t('tax_calculation_unavailable')}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {t('add_income_for_tax_estimates')}
                  </Typography>
                </Box>
              </Box>
            )
          )}

          {/* Nearby Amenities */}
          {data.amenities_within_1000m && Object.keys(data.amenities_within_1000m).length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight="medium" color="text.secondary">
                {t('nearby_amenities_within_1km')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {Object.entries(data.amenities_within_1000m).map(([type, count]) => (
                  <Chip
                    key={type}
                    label={`${type}: ${count}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '11px', height: '24px' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Healthcare Access */}
          {(data.distance_to_hospital_m || data.distance_to_pharmacy_m) && (
            <Box>
              <Typography variant="caption" fontWeight="medium" color="text.secondary">
                {t('healthcare_access')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                {data.distance_to_hospital_m && (
                  <Typography variant="body2">
                    {t('hospital')}: {(data.distance_to_hospital_m / 1000).toFixed(1)} km
                  </Typography>
                )}
                {data.distance_to_pharmacy_m && (
                  <Typography variant="body2">
                    {t('pharmacy')}: {(data.distance_to_pharmacy_m / 1000).toFixed(1)} km
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

EnrichmentDataDisplay.propTypes = {
  enrichment: PropTypes.shape({
    metadata: PropTypes.object,
    data: PropTypes.object,
    missing_fields: PropTypes.array
  }),
  onRefresh: PropTypes.func
};

export default EnrichmentDataDisplay;