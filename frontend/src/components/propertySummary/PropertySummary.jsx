import React from 'react';
import { Box, Paper, Typography, Input } from '@mui/material';

import { Location } from '../../pages/HomeDetails/subComponents/Location';
import { theme } from '../../theme/theme';
import { SuitCase } from '../../assets/svg/SuitCase';
import { Coin } from '../../assets/svg/Coin';
import { CalendarBlank } from '../../assets/svg/CalendarBlank';
import { UniteSquare } from '../../assets/svg/UniteSquare';
import { Wall } from '../../assets/svg/Wall';
import { Resize } from '../../assets/svg/Resize';
import { MapPin } from '../../assets/svg/MapPin';
import { PawPrint } from '../../assets/svg/PawPrint';
import { CigaretteSlash } from '../../assets/svg/CigaretteSlash';
import { CreditCard } from '../../assets/svg/CreditCard';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectProperties } from '../../store/slices/propertiesSlice';
import { numberFormatter } from '../../utils';

const PropertySummary = ({ noPadding, uploadedImages }) => {
  const { t } = useTranslation();
  const { currentProperty } = useSelector(selectProperties);

  const paperHeadings = {
    fontSize: '16px',
    color: 'black',
    fontWeight: 500
  };
  const outerBox = {
    display: 'flex',
    flexDirection: 'column',
    p: 2,
    mb: 3,
    boxShadow: 'none',
    backgroundColor: theme.palette.background.skyBlue,
    border: `1.5px solid ${theme.palette.border.blue}`,
    rowGap: 1,
    borderRadius: '10px'
  };
  const innerBox = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 1
  };
  const mainText = {
    ml: 1,
    fontSize: '12px',
    fontWeight: 550,
    color: 'black'
  };
  const subText = {
    fontSize: '12px',
    ml: 1
  };
  const subPaper = {
    p: 1,
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'none',
    border: `1.5px solid ${theme.palette.border.blue}`,
    width: '150px',
    flexGrow: 1
  };
  const iconStyle = {
    p: 1,
    height: '26px',
    width: '26px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const imagesArray = () => {
    const result = [];

    for (let i = 1; i < uploadedImages.length; i += 2) {
      if (i + 1 < uploadedImages.length) {
        result.push([uploadedImages[i], uploadedImages[i + 1]]);
      } else {
        result.push([uploadedImages[i]]);
      }
    }

    return result;
  };

  const data = currentProperty.data;

  return (
    <Box p={!noPadding ? 2 : 0}>
      {/* Client Overview Section */}
      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Property Overview')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}>
          <Paper sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: theme.palette.background.skyBlue
              }}>
              <UniteSquare />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column'
              }}>
              <Typography sx={mainText}>
                {/* {numberFormatter(data?.square_feet)} {t('m2')} */}
                {'1800 m2'}
              </Typography>
              <Typography sx={subText}>{t('Size')}</Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: '#daf1db'
              }}>
              <Wall />
            </Box>
            <Box>
              <Typography sx={mainText}>{data?.year_built}</Typography>
              <Typography sx={subText}>{t('Built')}</Typography>
            </Box>
          </Paper>
          <Paper sx={subPaper}>
            <Box sx={{ backgroundColor: '#fffab8', ...iconStyle }}>
              <Resize />
            </Box>
            <Box>
              <Typography sx={mainText}>
                {/* {data?.bedrooms} {t('beds')}. / {data?.bathrooms} {t('baths')}. */}
                {2} {t('beds')}. / {2} {t('baths')}.
              </Typography>
              <Typography sx={subText}>{t('Rooms')}</Typography>
            </Box>
          </Paper>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}>
          <Paper sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: theme.palette.background.skyBlue
              }}>
              <MapPin />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column'
              }}>
              <Typography sx={mainText}>
                {/* {data?.address}, {data?.city}, {data?.country} */}
                Sonnenweg 15, 8810 Horgen, Switzerland
              </Typography>
              <Typography sx={subText}>{t('Location')}</Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ ...subPaper, maxWidth: '30%' }}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: '#daf1db'
              }}>
              <Coin />
            </Box>
            <Box>
              {/* <Typography sx={mainText}>{numberFormatter(data?.price || 0)}.-</Typography> */}
              <Typography sx={mainText}>CHF 1000 - CHF 2000</Typography>

              <Typography sx={subText}>{t('Budget')}</Typography>
            </Box>
          </Paper>
        </Box>
        {/* Dummy map */}
        <Box>
          <Paper
            variant="outlined"
            sx={{
              boxShadow: 'none',
              border: `1.5px solid ${theme.palette.border.blue}`,
              paddingBottom: 0
            }}>
            <Location latitude={data?.latitude} longitude={data?.longitude} hideContact />
          </Paper>
        </Box>
      </Box>
      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Photo Upload and Enhancement')}
        </Typography>
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <Box
            sx={{
              width: '100%',
              height: '248px',
              backgroundPosition: 'center',
              borderRadius: '4px',
              backgroundSize: 'cover',
              // backgroundImage: `url(${uploadedImages[0].url})`,
              backgroundImage: `url(
                'https://media2.homegate.ch/f_auto/t_web_dp_fullscreen/listings/v2/hgonif/4001637107/image/e4f70d92694d12d06e24fe1ae97eaeb7.jpg'
              )`
            }}
          />
          {imagesArray().map((images) => (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '120px',
                width: '120px',
                minWidth: '120px',
                gap: '8px'
              }}>
              {images.map((image) => (
                <Box
                  sx={{
                    width: '100%',
                    borderRadius: '4px',
                    height: '120px',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    // backgroundImage: `url(${image.url})`
                    backgroundImage: `url(
                      'https://media2.homegate.ch/f_auto/t_web_dp_fullscreen/listings/v2/hgonif/4001637107/image/e4f70d92694d12d06e24fe1ae97eaeb7.jpg'
                    )`
                  }}
                />
              ))}
            </Box>
          ))}
        </Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 400, mt: 1, fontSize: 16, color: '#202020' }}
          gutterBottom>
          {data?.description ||
            t(
              "The spacious property is located near the city center with a beautiful landscape and everything you need in the environment. Even though it's 5 minutes further from your work, it offers a larger kitchen, making it a good compromise."
            )}
        </Typography>
      </Box>
      {/* Tenant Preferences */}
      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Tenant Preferences')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PawPrint />
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#202020' }} variant="body1">
              {t('Pet policy')}: {t('Yes')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CigaretteSlash />
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#202020' }} variant="body1">
              {t('Smoking policy')}: No
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarBlank fill="#202020" />
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#202020' }} variant="body1">
              {t('Lease duration: 6 months')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Application Filtering Setup */}
      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Application Filtering Setup')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}>
          <Paper sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: '#daf1db'
              }}>
              <CreditCard fill="#3E9B4F" />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column'
              }}>
              <Typography sx={mainText}>£9500 - £12500</Typography>
              <Typography sx={subText}>Income</Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: '#fffab8'
              }}>
              <Coin fill="#9E6C00" />
            </Box>
            <Box>
              <Typography sx={mainText}>CHF 9500 - CHF 12000</Typography>
              <Typography sx={subText}>Credit score</Typography>
            </Box>
          </Paper>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}>
          <Paper sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: theme.palette.background.skyBlue
              }}>
              <SuitCase />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column'
              }}>
              <Typography sx={mainText}>
                {t('Full')}, {t('Part-time')}
              </Typography>
              <Typography sx={subText}>{t('Employment')}</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default PropertySummary;
