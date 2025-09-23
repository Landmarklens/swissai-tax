import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Paper,
  Grid,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp as ScoreIcon,
  AttachMoney as IncomeIcon,
  CreditScore as CreditIcon,
  Work as WorkIcon,
  People as ReferencesIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ScoringSetup = ({ weights, onChange, errors }) => {
  const { t } = useTranslation();

  const scoringFactors = [
    { key: 'income', label: t('Income & Financial Stability'), icon: <IncomeIcon />, color: '#4CAF50' },
    { key: 'creditScore', label: t('Credit Score'), icon: <CreditIcon />, color: '#2196F3' },
    { key: 'references', label: t('References'), icon: <ReferencesIcon />, color: '#FF9800' },
    { key: 'employmentHistory', label: t('Employment History'), icon: <WorkIcon />, color: '#9C27B0' },
    { key: 'otherFactors', label: t('Other Factors'), icon: <HomeIcon />, color: '#607D8B' }
  ];

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  const handleWeightChange = (key) => (event, value) => {
    const diff = value - weights[key];
    const remainingKeys = Object.keys(weights).filter(k => k !== key);
    const remainingTotal = 100 - value;
    
    const newWeights = { ...weights, [key]: value };
    
    // Distribute the difference among other factors proportionally
    if (remainingKeys.length > 0 && totalWeight > value) {
      const scale = remainingTotal / (totalWeight - weights[key]);
      remainingKeys.forEach(k => {
        newWeights[k] = Math.round(weights[k] * scale);
      });
    }
    
    // Ensure total is exactly 100
    const newTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (newTotal !== 100 && remainingKeys.length > 0) {
      newWeights[remainingKeys[0]] += 100 - newTotal;
    }
    
    onChange(newWeights);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Scoring Weights')}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {t('Adjust how much each factor contributes to the overall applicant score. Weights must sum to 100%.')}
      </Typography>

      {errors.scoring && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.scoring}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('Total Weight')}
          </Typography>
          <Chip
            label={`${totalWeight}%`}
            color={totalWeight === 100 ? 'success' : 'error'}
            variant="filled"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={totalWeight}
          color={totalWeight === 100 ? 'success' : 'error'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      <Grid container spacing={3}>
        {scoringFactors.map((factor) => (
          <Grid item xs={12} key={factor.key}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ color: factor.color, mr: 2 }}>
                  {factor.icon}
                </Box>
                <Box flexGrow={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {factor.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getFactorDescription(factor.key, t)}
                  </Typography>
                </Box>
                <Chip
                  label={`${weights[factor.key]}%`}
                  sx={{ bgcolor: factor.color, color: 'white' }}
                />
              </Box>
              
              <Slider
                value={weights[factor.key]}
                onChange={handleWeightChange(factor.key)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: factor.color
                  },
                  '& .MuiSlider-track': {
                    bgcolor: factor.color
                  }
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>{t('Tip:')}</strong> {t('Higher weights on financial factors (income, credit) lead to more financially stable tenants, while higher weights on references and employment history favor tenants with proven track records.')}
        </Typography>
      </Alert>
    </Box>
  );
};

const getFactorDescription = (key, t) => {
  const descriptions = {
    income: t('Monthly income relative to rent, savings, and financial documents'),
    creditScore: t('Credit history, payment records, and financial responsibility'),
    references: t('Previous landlord references and personal recommendations'),
    employmentHistory: t('Job stability, contract type, and employment duration'),
    otherFactors: t('Move-in date flexibility, communication quality, and special circumstances')
  };
  return descriptions[key] || '';
};

export default ScoringSetup;