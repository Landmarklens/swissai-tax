import { Box, Typography } from '@mui/material';
import React from 'react';
import { theme } from '../../../theme/theme';
import { numberFormatter } from '../../../utils';
import { useTranslation } from 'react-i18next';

const Details = ({ details }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };
  return (
    <Box
      sx={{
        py: 5
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 500,
            color: 'black',
            [theme.breakpoints.down('md')]: {
              fontSize: '20px'
            },
            [theme.breakpoints.down('sm')]: {
              fontSize: '14px'
            }
          }}
        >
          {details.address}
        </Typography>
        <Box
          sx={{
            py: 3
          }}
        >
          <Typography
            sx={{
              backgroundColor: '#f4fbf6',
              border: ' 1px solid #cfebdb',
              color: '#65aa8a',
              py: 0.5,
              width: '110px',
              textAlign: 'center',
              borderRadius: '5px'
            }}
          >
            {details.status}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: '80%',
          display: 'grid',
          flexDirection: 'column',
          gap: 2,

          [theme.breakpoints.down('sm')]: {
            width: '100%',
            gridTemplateColumns: '1fr'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1
          }}
        >
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Price')}
          </Typography>
          <Typography sx={{ flex: 2, fontSize: '12px', fontWeight: 500, color: 'black' }}>
            {numberFormatter(details.price)}
          </Typography>
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Size')}
          </Typography>
          <Typography sx={{ flex: 2, fontSize: '12px', fontWeight: 500, color: 'black' }}>
            {numberFormatter(details.sqrFeet)} {t('sqm')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Past viewing')}
          </Typography>
          <Typography sx={{ flex: 3, fontSize: '12px', fontWeight: 500, color: 'black' }}>
            {details.past}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Rooms')}
          </Typography>
          <Typography sx={{ flex: 2, fontWeight: 500, color: 'black', fontSize: '12px' }}>
            {details.beds} Bed / {details.baths} Ba
          </Typography>
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Built')}
          </Typography>
          <Typography sx={{ flex: 2, fontSize: '12px', fontWeight: 500, color: 'black' }}>
            {details.built}
          </Typography>
          <Typography sx={{ color: 'text.secondary', flex: 1, fontSize: '12px' }}>
            {t('Upcoming viewing')}
          </Typography>
          <Typography sx={{ flex: 3, fontSize: '12px', fontWeight: 500, color: 'black' }}>
            {details.upcoming}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Details;
