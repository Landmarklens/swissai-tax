import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import { Google } from '../../../assets/svg/Google';
import { FormLabel } from 'react-bootstrap';
import { styled } from '@mui/system';
import { Visa } from '../../../assets/svg/Visa';
import { Amex } from '../../../assets/svg/Amex';
import { Discover } from '../../../assets/svg/Discover';
import { MasterCard } from '../../../assets/svg/Mastercard';
import { Cvv } from '../../../assets/svg/Cvv';
import { useTranslation } from 'react-i18next';

const PaymentMethod = ({ profile }) => {
  const { t } = useTranslation();
  const InputField = styled(TextField)({
    marginBottom: '20px',
    '& .MuiInputBase-root': {
      height: '40px'
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: { sm: '50%', xs: 'auto' },
        px: { sm: 5, xs: 2 }
      }}
    >
      <Box
        sx={{
          flex: 1,
          paddingTop: '64px',
          width: '100%',
          maxWidth: '520px'
        }}
      >
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f4f8', borderRadius: 1 }}>
          <Typography sx={{ mb: '3px', fontWeight: 'bold', color: '#202020' }}>
            {profile?.firstname} {profile?.lastname}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Google sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ marginLeft: '8px' }}>
              {profile?.email}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {t('Payment Method')}
        </Typography>

        <Grid spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormLabel
              component="legend"
              style={{
                color: '#80838D',
                fontSize: '14px',
                marginBottom: '4px',
                display: 'inline-block'
              }}
            >
              Cardholder Name
            </FormLabel>
            <InputField
              size="small"
              placeholder="Enter Cardholder Name"
              variant="outlined"
              fullWidth
            />
          </Grid>
        </Grid>

        <Grid spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormLabel
              component="legend"
              style={{
                color: '#80838D',
                fontSize: '14px',
                marginBottom: '4px',
                display: 'inline-block'
              }}
            >
              Credit Card Number
            </FormLabel>
            <InputField
              size="small"
              placeholder="XXXX XXXX XXXX XXXX"
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Visa />
                    <Amex />
                    <Discover />
                    <MasterCard />
                  </Box>
                )
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                Expiration Date
              </FormLabel>
              <InputField size="small" placeholder="MM/YY" variant="outlined" fullWidth />
            </Grid>
          </Grid>
          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                CVV/CVC
              </FormLabel>
              <InputField
                size="small"
                placeholder="***"
                variant="outlined"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Cvv />
                    </Box>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Address
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                First name
              </FormLabel>
              <InputField
                size="small"
                placeholder="Enter First name"
                variant="outlined"
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                Last name
              </FormLabel>
              <InputField size="small" placeholder="Enter Last name" variant="outlined" fullWidth />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ width: '100%' }}>
            <FormLabel
              component="legend"
              style={{
                color: '#80838D',
                fontSize: '14px',
                marginBottom: '4px',
                display: 'inline-block'
              }}
            >
              Country
            </FormLabel>
            <Select
              fullWidth
              defaultValue=""
              displayEmpty
              variant="outlined"
              size="small"
              sx={{ flex: 1, height: 40 }}
            >
              <MenuItem value="" disabled>
                Country
              </MenuItem>
            </Select>
          </Box>
          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                City
              </FormLabel>
              <InputField size="small" placeholder="Enter City" variant="outlined" fullWidth />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ width: '100%' }}>
            <FormLabel
              component="legend"
              style={{
                color: '#80838D',
                fontSize: '14px',
                marginBottom: '4px',
                display: 'inline-block'
              }}
            >
              State
            </FormLabel>
            <Select
              fullWidth
              defaultValue=""
              displayEmpty
              variant="outlined"
              sx={{ flex: 1, height: 40 }}
            >
              <MenuItem value="" disabled>
                Select State
              </MenuItem>
            </Select>
          </Box>
          <Grid sx={{ width: '100%' }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormLabel
                component="legend"
                style={{
                  color: '#80838D',
                  fontSize: '14px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}
              >
                ZIP
              </FormLabel>
              <InputField size="small" placeholder="Enter ZIP" variant="outlined" fullWidth />
            </Grid>
          </Grid>
        </Box>

        <Grid sx={{ width: '100%' }} spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormLabel
              component="legend"
              style={{
                color: '#80838D',
                fontSize: '14px',
                marginBottom: '4px',
                display: 'inline-block'
              }}
            >
              Address
            </FormLabel>
            <InputField size="small" placeholder="Enter Address" variant="outlined" fullWidth />
          </Grid>
        </Grid>

        <FormControlLabel
          control={<Checkbox />}
          label={
            <Typography variant="body2">
              <span style={{ fontWeight: 500, fontSize: 16 }}>
                Secure save my information for 1-click checkout
              </span>
              <br />
              <span style={{ color: '#646464', fontSize: 14 }}>
                Pay faster on Home AI and everywhere link is accepted.
              </span>
            </Typography>
          }
          sx={{
            mb: 3,
            borderRadius: '8px',
            border: '1px solid #C1D0FF',
            marginLeft: 0,
            width: 1,
            py: '12px'
          }}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#4a5af9',
            color: 'white',
            py: 1.5,
            marginBottom: '64px'
          }}
        >
          Subscribe
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentMethod;
