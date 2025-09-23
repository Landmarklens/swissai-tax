import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Coin } from '../../assets/svg/Coin';
import { useTranslation } from 'react-i18next';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: 12,
  borderRadius: 8,
  border: '1px solid #C1D0FF',
  background: '#EDF2FE',
  boxShadow: 'none'
}));

const PropertiesContainer = styled(Box)(({ theme }) => ({
  borderRadius: 6,
  border: '1px solid #C1D0FF',
  background: '#fff',
  marginTop: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}));

const iconStyle = {
  p: 1,
  height: '26px',
  width: '26px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const BudgetCard = ({ budget }) => {
  const { t } = useTranslation();

  const getProgressColor = (index) => {
    const colors = ['#2B9A66', '#FFDC00', '#DC3E42'];
    return colors[index % colors.length];
  };

  return (
    <StyledPaper id="optimal_pricing">
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: '#202020', fontSize: 16, fontWeight: 500 }}
      >
        {t('Optimal pricing and rental trends')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          mt: '12px'
        }}
      >
        <Box
          sx={{
            ...iconStyle,
            backgroundColor: '#daf1db'
          }}
        >
          <Coin />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 20,
              color: '#202020',
              fontWeight: 700,
              mb: 0
            }}
            variant="h4"
            gutterBottom
          >
            {budget.price}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: '#646464',
              fontWeight: 400,
              mb: 0
            }}
            variant="body2"
            color="textSecondary"
            gutterBottom
          >
            {t('Average property asking rent')}
          </Typography>
        </Box>
      </Box>
      <PropertiesContainer>
        {budget.properties.map((property, index) => (
          <Box key={property.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: '6px'
              }}
            >
              <Typography
                sx={{
                  mb: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#202020'
                }}
                variant="body2"
                gutterBottom
              >
                {property.address}
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#202020' }} variant="body2">
                {property.price}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={property.progress}
              sx={{
                height: 6,
                borderRadius: 4,
                backgroundColor: `${getProgressColor(index)}22`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: getProgressColor(index)
                }
              }}
            />
          </Box>
        ))}
      </PropertiesContainer>
    </StyledPaper>
  );
};

export default BudgetCard;
