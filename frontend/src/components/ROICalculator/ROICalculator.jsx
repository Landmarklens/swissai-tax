import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/system';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';

const CalculatorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
  border: '2px solid rgba(62, 99, 221, 0.08)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #3E63DD 0%, #AA99EC 100%)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  }
}));

const ResultCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: 'white',
  borderRadius: '16px',
  textAlign: 'center',
  border: '2px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(62, 99, 221, 0.2)',
  },
  '& .MuiTypography-root': {
    position: 'relative',
    zIndex: 1,
  }
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    backgroundColor: theme.palette.primary.main,
    width: 24,
    height: 24,
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(62, 99, 221, 0.3)',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(62, 99, 221, 0.16)',
    }
  },
  '& .MuiSlider-track': {
    backgroundColor: theme.palette.primary.main,
    height: 8,
    borderRadius: 4,
  },
  '& .MuiSlider-rail': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    height: 8,
    borderRadius: 4,
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '8px',
    padding: '4px 8px',
  }
}));

const ROICalculator = ({ onGetStarted }) => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState(3);
  const [avgRent, setAvgRent] = useState(2000);
  const [vacancyDays, setVacancyDays] = useState(30);
  const [openExplanation, setOpenExplanation] = useState(false);

  // Calculate ROI metrics
  const [timeSaved, setTimeSaved] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [vacancyReduction, setVacancyReduction] = useState(0);
  const [yearlyBenefit, setYearlyBenefit] = useState(0);

  useEffect(() => {
    console.log('[DEBUG] ROI Calculator - Properties:', properties, 'Avg Rent:', avgRent, 'Vacancy Days:', vacancyDays);

    // Time saved calculation (hours per month)
    const hoursPerProperty = 5; // Average hours saved per property per month (more conservative)
    const calculatedTimeSaved = properties * hoursPerProperty;
    setTimeSaved(calculatedTimeSaved);

    // Vacancy reduction (days) - much more conservative
    // Typically reduce vacancy by 15-25%, capped at 7 days
    const reductionPercentage = 0.2; // 20% reduction
    const maxReduction = 7; // Maximum 7 days reduction
    const calculatedVacancyReduction = Math.min(vacancyDays * reductionPercentage, maxReduction);
    setVacancyReduction(calculatedVacancyReduction);

    // Money saved calculation
    const dailyLoss = avgRent / 30;
    const vacancySavings = calculatedVacancyReduction * dailyLoss * properties;
    const timeSavingsValue = calculatedTimeSaved * 35; // CHF 35 per hour value (more conservative)
    const calculatedMoneySaved = vacancySavings + timeSavingsValue;
    setMoneySaved(calculatedMoneySaved);

    // Yearly benefit
    const monthlyPlatformCost = 49 * properties;
    const monthlyBenefit = calculatedMoneySaved - monthlyPlatformCost;
    setYearlyBenefit(monthlyBenefit * 12);

    console.log('[DEBUG] ROI Calculator Results:', {
      timeSaved: calculatedTimeSaved,
      vacancyReduction: calculatedVacancyReduction,
      moneySaved: calculatedMoneySaved,
      yearlyBenefit: monthlyBenefit * 12
    });
  }, [properties, avgRent, vacancyDays]);

  return (
    <CalculatorContainer elevation={1}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a1a' }}>
          {t('ROI Calculator')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', lineHeight: 1.6 }}>
          {t('See how much time and money you can save with AI-powered property management')}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Number of Properties')}
              </Typography>
              <Chip
                label={properties}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <StyledSlider
              value={properties}
              onChange={(e, value) => setProperties(value)}
              min={1}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Average Monthly Rent (CHF)')}
              </Typography>
              <Chip
                label={`CHF ${avgRent.toLocaleString()}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <StyledSlider
              value={avgRent}
              onChange={(e, value) => setAvgRent(value)}
              min={500}
              max={5000}
              step={100}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `CHF ${value.toLocaleString()}`}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Average Vacancy Period (days)')}
              </Typography>
              <Chip
                label={`${vacancyDays} days`}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <StyledSlider
              value={vacancyDays}
              onChange={(e, value) => setVacancyDays(value)}
              min={7}
              max={90}
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{
            mb: 3,
            pb: 2,
            borderBottom: '2px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('Your Estimated Savings')}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ResultCard>
                <AccessTimeIcon sx={{ color: '#3E63DD', fontSize: '2.5rem', mb: 1.5 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                  {timeSaved}
                  <Typography component="span" variant="h6" sx={{ ml: 0.5, fontWeight: 500 }}>
                    hrs
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t('Time Saved Monthly')}
                </Typography>
              </ResultCard>
            </Grid>

            <Grid item xs={6}>
              <ResultCard>
                <TrendingUpIcon sx={{ color: '#65BA74', fontSize: '2.5rem', mb: 1.5 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                  {Math.round(vacancyReduction)}
                  <Typography component="span" variant="h6" sx={{ ml: 0.5, fontWeight: 500 }}>
                    days
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t('Vacancy Reduction')}
                </Typography>
              </ResultCard>
            </Grid>

            <Grid item xs={12}>
              <ResultCard sx={{
                background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%)',
                borderColor: 'rgba(62, 99, 221, 0.15)',
                py: 3,
                position: 'relative'
              }}>
                <IconButton
                  size="small"
                  onClick={() => setOpenExplanation(true)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(62, 99, 221, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(62, 99, 221, 0.2)',
                    }
                  }}
                >
                  <HelpOutlineIcon sx={{ fontSize: '1.25rem', color: '#3E63DD' }} />
                </IconButton>
                <MonetizationOnIcon sx={{ color: '#3E63DD', fontSize: '2.5rem', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Yearly Net Benefit')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#3E63DD', fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1 }}>
                  CHF {yearlyBenefit.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {t('After platform costs')}
                </Typography>
              </ResultCard>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('Platform cost')}: CHF {49 * properties}/month
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onGetStarted}
              sx={{
                py: 1.5,
                fontSize: '16px',
                textTransform: 'none',
                borderRadius: '8px'
              }}>
              {t('Start Saving Today')}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Explanation Modal */}
      <Dialog
        open={openExplanation}
        onClose={() => setOpenExplanation(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('How We Calculate Your Savings')}
          </Typography>
          <IconButton
            onClick={() => setOpenExplanation(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#3E63DD' }}>
              {t('Your Input Values')}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary={`Properties: ${properties}`}
                  secondary={`Monthly rent per property: CHF ${avgRent.toLocaleString()}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`Current vacancy period: ${vacancyDays} days`}
                />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#3E63DD' }}>
              {t('Calculation Breakdown')}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              1. {t('Vacancy Reduction')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              AI reduces vacancy by 20% (max 7 days)
            </Typography>
            <Typography variant="body2" sx={{ pl: 2, mb: 2 }}>
              • Your reduction: {vacancyReduction.toFixed(1)} days
              <br />
              • Daily loss prevented: CHF {(avgRent / 30).toFixed(0)} × {vacancyReduction.toFixed(1)} days
              <br />
              • Total vacancy savings: <strong>CHF {(vacancyReduction * (avgRent / 30) * properties).toFixed(0)}/month</strong>
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              2. {t('Time Saved')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              5 hours saved per property monthly through automation
            </Typography>
            <Typography variant="body2" sx={{ pl: 2, mb: 2 }}>
              • Hours saved: {properties} × 5 = {timeSaved} hours
              <br />
              • Value of time: {timeSaved} hours × CHF 35/hour
              <br />
              • Time value: <strong>CHF {(timeSaved * 35).toFixed(0)}/month</strong>
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              3. {t('Platform Cost')}
            </Typography>
            <Typography variant="body2" sx={{ pl: 2, mb: 2 }}>
              • CHF 49 × {properties} properties = <strong>CHF {(49 * properties).toFixed(0)}/month</strong>
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              4. {t('Net Benefit Calculation')}
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              • Total savings: CHF {moneySaved.toFixed(0)}/month
              <br />
              • Minus platform cost: -CHF {(49 * properties).toFixed(0)}/month
              <br />
              • Monthly benefit: CHF {(moneySaved - 49 * properties).toFixed(0)}
              <br />
              • <strong>Yearly benefit: CHF {yearlyBenefit.toFixed(0)}</strong>
            </Typography>
          </Box>

          <Box sx={{
            p: 2,
            backgroundColor: 'rgba(62, 99, 221, 0.05)',
            borderRadius: '8px',
            mt: 3
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{t('Note')}:</strong> {t('These are conservative estimates based on average performance. Actual results may vary based on location, property type, and market conditions.')}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenExplanation(false)}
            variant="contained"
            sx={{ borderRadius: '8px' }}
          >
            {t('Got it')}
          </Button>
        </DialogActions>
      </Dialog>
    </CalculatorContainer>
  );
};

export default ROICalculator;