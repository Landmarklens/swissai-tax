import { Box, Paper, Typography } from '@mui/material';
import { Location } from '../../pages/HomeDetails/subComponents/Location';
import { theme } from '../../theme/theme';
import ProgressBar from '../Progress/ProgressBar';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PhotoSizeSelectSmallOutlinedIcon from '@mui/icons-material/PhotoSizeSelectSmallOutlined';
import KingBedOutlinedIcon from '@mui/icons-material/KingBedOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import { SuitCase } from '../../assets/svg/SuitCase';
import { Coin } from '../../assets/svg/Coin';
import { FlowerLotus } from '../../assets/svg/FlowerLotus';
import { Bank } from '../../assets/svg/Bank';
import { CalendarBlank } from '../../assets/svg/CalendarBlank';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';

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
  fontSize: '14px',
  fontWeight: 700,
  color: 'black'
};

const subText = {
  fontSize: '14px',
  fontWeight: 700,
  ml: 1
};

const subPaper = {
  p: 1,
  display: 'flex',
  alignItems: 'center',
  boxShadow: 'none',
  border: `1.5px solid ${theme.palette.border.blue}`,
  flexGrow: 1
};

const iconStyle = {
  p: 1,
  height: '36px',
  width: '36px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const ClientOverview = () => {
  const { t } = useTranslation();

  const clientOverview = useSelector(
    (state) => state.conversations.activeConversationProfile?.clientOverview
  );

  const location = clientOverview?.location?.location || '';
  const budget = clientOverview?.budget_and_lease?.budget || 'No budget';
  const lifestyle = clientOverview?.lifestyle_preferences?.lifestyle || 'No options';
  const leaseDuration = clientOverview?.budget_and_lease?.lease_duration || 'No options';
  const deposit = clientOverview?.budget_and_lease?.deposit || 'No options';
  const roomSize = clientOverview?.apartment_requirements?.room_size || 'No options';
  const amenities =
    clientOverview?.apartment_requirements?.amenities &&
    Array.isArray(clientOverview.apartment_requirements.amenities) &&
    clientOverview.apartment_requirements.amenities.length > 0
      ? clientOverview.apartment_requirements.amenities[0]
      : 'No options';
  const furnishing = Boolean(clientOverview?.apartment_requirements?.furnishing);
  const moveInTiming = clientOverview?.move_in_timing?.move_in_date || 'No options';
  const transportation = Boolean(clientOverview?.lifestyle_preferences?.transportation);
  const neighborhoodPreferences = Boolean(
    clientOverview?.lifestyle_preferences?.neighborhood_preferences
  );

  return (
    <Box>
      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Client Overview')}
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
              <SuitCase />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column'
              }}>
              <Typography sx={mainText}>
                {capitalizeFirstLetter(location || 'No location')}
              </Typography>
              <Typography sx={subText}>{t('Location')}</Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={subPaper}>
            <Box
              sx={{
                ...iconStyle,
                backgroundColor: '#daf1db'
              }}>
              <Coin />
            </Box>
            <Box>
              <Typography sx={mainText}>{budget}</Typography>
              <Typography sx={subText}>{t('Budget')}</Typography>
            </Box>
          </Paper>
          <Paper sx={subPaper}>
            <Box sx={{ backgroundColor: '#fffab8', ...iconStyle }}>
              <FlowerLotus />
            </Box>
            <Box>
              <Typography sx={mainText}>{capitalizeFirstLetter(lifestyle)}</Typography>
              <Typography sx={subText}>{t('Lifestyle')}</Typography>
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper
            variant="outlined"
            sx={{
              boxShadow: 'none',
              border: `1.5px solid ${theme.palette.border.blue}`,
              paddingBottom: 0
            }}>
            <Location locationName={location} />
          </Paper>
        </Box>
      </Box>

      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Budget and Lease Terms')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 1
          }}>
          <Paper
            variant="outlined"
            sx={{
              ...subPaper,
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1
            }}>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between'
              }}>
              <Typography sx={mainText}>{t('Month Budget')}</Typography>
              <Typography sx={subText}>{budget}</Typography>
            </Box>
            <Box sx={{ width: '100%' }}>
              <ProgressBar value={70} />
            </Box>
          </Paper>
          <Paper variant="outlined" sx={subPaper}>
            <Box
              sx={{
                display: 'flex'
              }}>
              <Box
                sx={{
                  ...iconStyle,
                  backgroundColor: '#daf1db'
                }}>
                <Bank />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                <Typography sx={mainText}>{deposit}</Typography>
                <Typography sx={subText}>{t('Deposit')}</Typography>
              </Box>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={subPaper}>
            <Box
              sx={{
                display: 'flex'
              }}>
              <Box
                sx={{
                  ...iconStyle,
                  backgroundColor: '#fffab8'
                }}>
                <CalendarBlank />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                <Typography sx={mainText}>{leaseDuration}</Typography>
                <Typography sx={subText}>{t('Lease duration')}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Apartment Requirements')}
        </Typography>
        <Box sx={innerBox}>
          <Paper
            sx={{
              ...subPaper,
              flexDirection: 'column',
              alignItems: 'left',
              gap: 0.5
            }}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary,
                fontWeight: 200,
                ...mainText
              }}>
              <PhotoSizeSelectSmallOutlinedIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
              {t('Room Size')}
            </Typography>
            <Typography sx={{ ...subText, fontWeight: 600, color: 'black' }}>{roomSize}</Typography>
          </Paper>

          <Paper
            sx={{
              ...subPaper,
              flexDirection: 'column',
              alignItems: 'left',
              gap: 0.5
            }}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary,
                fontWeight: 200,
                ...mainText
              }}>
              <KingBedOutlinedIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
              {t('Furnishing')}
            </Typography>
            <Typography sx={{ ...subText, fontWeight: 600, color: 'black' }}>
              {furnishing ? t('Yes') : t('No')}
            </Typography>
          </Paper>

          <Paper
            sx={{
              ...subPaper,
              flexDirection: 'column',
              alignItems: 'left',
              gap: 0.5
            }}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary,
                fontWeight: 200,
                ...mainText
              }}>
              <ApartmentOutlinedIcon sx={{ fontSize: 18, marginRight: 0.5 }} />
              {t('Amenities')}
            </Typography>
            <Typography sx={{ ...subText, fontWeight: 600, color: 'black' }}>
              {capitalizeFirstLetter(amenities)}
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Lifestyle and Neighborhood Preferences')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 0.5
          }}>
          {lifestyle && <ApartmentOutlinedIcon sx={{ fontSize: 18, fontWeight: 400 }} />}
          {transportation && <StorefrontOutlinedIcon sx={{ fontSize: 18, fontWeight: 400 }} />}
          {neighborhoodPreferences && <PermIdentityIcon sx={{ fontSize: 18, fontWeight: 400 }} />}
        </Box>
      </Box>

      <Box sx={outerBox}>
        <Typography sx={paperHeadings} gutterBottom>
          {t('Move-in Timing')}
        </Typography>
        <Box>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.secondary,
              fontWeight: 200,
              ...mainText
            }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 18, marginRight: 0.5, ml: -1 }} />
            {capitalizeFirstLetter(moveInTiming)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
