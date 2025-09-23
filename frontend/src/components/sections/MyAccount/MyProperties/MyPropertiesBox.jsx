import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import AIAvatar from '../../../../assets/svg/AIAvatar';
import ImageIcon from '@mui/icons-material/Image';
import { getCurrencySymbol } from '../../../../constants/currencyMapping';
import { useTranslation } from 'react-i18next';

const MyPropertiesBox = ({ properties }) => {
  const { t } = useTranslation();
  const ImagePlaceholder = () => (
    <Box
      sx={{
        height: '140px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f0f0f0'
      }}
    >
      <ImageIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />{' '}
    </Box>
  );

  return (
    <Grid container spacing={3}>
      {properties &&
        properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.id}>
            <Card
              sx={{
                maxWidth: 345,
                boxShadow: 'unset',
                border: '1px solid #c1d0ff'
              }}
            >
              <Box sx={{ position: 'relative' }}>
                {property.primary_image_url ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={property.primary_image_url}
                    alt={property.address}
                  />
                ) : (
                  <ImagePlaceholder />
                )}

                <Box sx={{ position: 'absolute', top: '14px', left: '7px' }}>
                  <AIAvatar />
                </Box>
              </Box>
              <CardContent sx={{ padding: 'unset', pb: '16px!important' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                    paddingTop: '12px',
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  <Typography variant="h6" component="div">
                    {property.price}
                    {getCurrencySymbol(property.currency)}{' '}
                    <Typography variant="caption">{t('per month')}</Typography>
                  </Typography>
                  <Typography
                    sx={{
                      color: property.status === 'Viewed' ? '#34C759' : '#FF9500'
                    }}
                    size="small"
                  >
                    {property?.status}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingBottom: '8px'
                  }}
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                >
                  {property.address}
                  {', '}
                  {property?.country}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
    </Grid>
  );
};

export default MyPropertiesBox;
