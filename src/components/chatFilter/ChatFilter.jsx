import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: 12,
  borderRadius: 8,
  border: '1px solid #C1D0FF',
  background: '#EDF2FE',
  boxShadow: 'none'
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: '#1F2D5C',
  marginTop: 22,
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    border: '1px solid #CDCED6',
    '&::before': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-track': {
    height: 12
  },
  '& .MuiSlider-rail': {
    height: 12,
    background: 'rgba(0, 0, 51, 0.06)',
    border: '1px solid rgba(0, 9, 50, 0.12)'
  }
}));

const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    height: '32px',
    borderRadius: '4px',
    background: '#fff',
    '& input': {
      padding: '12px 14px'
    }
  },
  '& .MuiInputLabel-root': {
    top: '-5px'
  }
};

const ChatFilter = forwardRef(function ChatFilter({ filter }, ref) {
  const { t } = useTranslation();
  const [income, setIncome] = useState([9500, 12500]);
  const [creditScore, setCreditScore] = useState([9500, 12500]);
  const [employment, setEmployment] = useState({
    fullTime: false,
    partTime: false,
    apprenticeship: true,
    traineeship: false,
    internship: false,
    casualEmployment: false,
    employmentOnCommission: false,
    contract: true,
    probation: false,
    seasonal: false,
    leased: false,
    contingent: false
  });

  useImperativeHandle(ref, () => ({
    resetFilter(income, creditScore, employment) {
      setIncome(income);
      setCreditScore(creditScore);
      setEmployment(employment);
    }
  }));

  const handleIncomeChange = (event, newValue) => {
    setIncome(newValue);
  };

  const handleCreditScoreChange = (event, newValue) => {
    setCreditScore(newValue);
  };

  const handleEmploymentChange = (event) => {
    setEmployment({
      ...employment,
      [event.target.name]: event.target.checked
    });
  };

  const handleSelectAll = (event) => {
    const newEmployment = Object.keys(employment).reduce((acc, key) => {
      acc[key] = event.target.checked;
      return acc;
    }, {});
    setEmployment(newEmployment);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <StyledPaper>
        <Typography
          sx={{ fontWeight: 500, color: '#202020', fontSize: 16 }}
          variant="h6"
          gutterBottom
        >
          {t('Income')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            mt: '12px'
          }}
        >
          <StyledSlider
            value={income}
            onChange={handleIncomeChange}
            valueLabelDisplay="auto"
            min={0}
            max={20000}
          />
          <Box sx={{ gap: '4px' }} display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('Min')}
              </Typography>
              <TextField
                sx={textFieldStyle}
                variant="outlined"
                fullWidth
                value={`£${income[0]}`}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontSize: 16,
                color: '#00051D74',
                fontWeight: 400,
                mt: '26px'
              }}
            >
              -
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('Max')}
              </Typography>
              <TextField
                sx={textFieldStyle}
                variant="outlined"
                fullWidth
                value={`£${income[1]}`}
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Box>
        </Box>
      </StyledPaper>

      <StyledPaper>
        <Typography
          sx={{ fontWeight: 500, color: '#202020', fontSize: 16 }}
          variant="h6"
          gutterBottom
        >
          {t('Employment')}
        </Typography>
        <FormGroup>
          <Box
            sx={{
              display: 'flex',
              paddingLeft: '12px',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            {Object.entries(employment).map(([key, value], index) => (
              <FormControlLabel
                key={index}
                sx={{
                  background: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #rgba(0, 6, 46, 0.20)',
                  height: '28px',
                  padding: '0 12px 0 8px',
                  '& .MuiButtonBase-root': { padding: 0 }
                }}
                control={
                  <Checkbox
                    checked={value}
                    onChange={handleEmploymentChange}
                    name={key}
                    sx={{ mr: '5px' }}
                  />
                }
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              />
            ))}
            <FormControlLabel
              sx={{
                background: '#fff',
                borderRadius: '4px',
                border: '1px solid #rgba(0, 6, 46, 0.20)',
                height: '28px',
                padding: '0 12px 0 8px',
                '& .MuiButtonBase-root': { padding: 0 }
              }}
              control={
                <Checkbox
                  checked={Object.values(employment).every(Boolean)}
                  onChange={handleSelectAll}
                  name="selectAll"
                  sx={{ mr: '5px' }}
                />
              }
              label={t('Select all')}
            />
          </Box>
        </FormGroup>
      </StyledPaper>

      <StyledPaper>
        <Typography
          sx={{ fontWeight: 500, color: '#202020', fontSize: 16 }}
          variant="h6"
          gutterBottom
        >
          {t('Credit score')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            mt: '12px'
          }}
        >
          <StyledSlider
            value={creditScore}
            onChange={handleCreditScoreChange}
            valueLabelDisplay="auto"
            min={0}
            max={20000}
          />
          <Box sx={{ gap: '4px' }} display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('Min')}
              </Typography>
              <TextField
                sx={textFieldStyle}
                variant="outlined"
                fullWidth
                value={`£${creditScore[0]}`}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontSize: 16,
                color: '#00051D74',
                fontWeight: 400,
                mt: '26px'
              }}
            >
              -
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('Max')}
              </Typography>
              <TextField
                sx={textFieldStyle}
                variant="outlined"
                fullWidth
                value={`£${creditScore[1]}`}
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Box>
        </Box>
      </StyledPaper>
    </Box>
  );
});

export default ChatFilter;
