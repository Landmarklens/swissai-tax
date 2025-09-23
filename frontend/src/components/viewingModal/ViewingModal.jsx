import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  Typography,
  Paper,
  Avatar,
  TextField,
  Box
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { theme } from '../../theme/theme';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import GalleryCard from '../galleryCard/GalleryCard';
import { numberFormatter } from '../../utils';
import { useDispatch } from 'react-redux';
import { requestViewing, updateViewing } from '../../store/slices/viewingSlice';
import utc from 'dayjs/plugin/utc';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useTranslation } from 'react-i18next';

dayjs.extend(utc);
dayjs.extend(advancedFormat);

const ViewingModal = ({ open, handleClose, property, isCalendar = true, viewingId = null }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('12:00 AM');
  const dispatch = useDispatch();

  const times = [
    '12:00 AM',
    '1:00 AM',
    '2:00 AM',
    '3:00 AM',
    '4:00 AM',
    '5:00 AM',
    '6:00 AM',
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
    '11:00 PM'
  ];

  const dateTimePaperPropsStyles = {
    sx: {
      '& .MuiPickersDay-root': {
        borderRadius: 0.4
      },
      '& .Mui-selected': {
        borderRadius: 0.4
      },
      ' .MuiPickersCalendarHeader-label': {
        color: 'black',
        fontWeight: 600
      },
      '.MuiPickersCalendarHeader-root': {
        display: 'flex',
        alignItems: 'center',
        justifyItems: 'center'
      },
      '.MuiPickersCalendarHeader-root:first-of-type': {
        order: 0,
        paddingRight: '20px',
        paddingLeft: '20px'
      },
      '.MuiPickersArrowSwitcher-root': {
        display: 'inline-flex'
        // visibility: "hidden"
      },
      '.MuiPickersCalendarHeader-label': {
        textAlign: 'center'
      },
      '.MuiPickersArrowSwitcher-spacer': {
        width: '220px'
      },
      '.css-31ca4x-MuiPickersFadeTransitionGroup-root': {
        display: 'flex',
        position: 'absolute',
        paddingLeft: '80px'
      },
      '.css-9reuh9-MuiPickersArrowSwitcher-root': {
        marginLeft: '-2px'
      },
      '.MuiPickersArrowSwitcher-button': {
        paddingRight: '7px'
      }
    }
  };

  const handleRequestViewing = () => {
    const dateTime = dayjs(`${dayjs().format('YYYY-MM-DD')} ${selectedTime}`);

    const formattedDate = dateTime.utc().format('HH:mm:ss.SSS[Z]');

    const body = {
      //fix body from mock
      property_id: property?.id || '10',
      scheduled_date: dayjs(selectedDate).format('YYYY-MM-DD'),
      scheduled_time: formattedDate
    };
    if (!isCalendar) {
      dispatch(updateViewing({ viewingId, body: { ...body, status: 'rescheduled' } })).then(() => {
        handleClose();
      });
      return;
    }

    dispatch(requestViewing(body)).then(() => {
      handleClose();
    });
  };

  return (
    <Dialog sx={{ width: '100%' }} open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {!isCalendar ? t('Reschedule viewing') : t('AI Application Submission')}
      </DialogTitle>
      <CloseOutlinedIcon
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          color: theme.palette.text.secondary,
          cursor: 'pointer'
        }}
      />

      <DialogContent
        sx={{
          borderTop: `1px solid ${theme.palette.border.grey}`,
          borderBottom: `1px solid ${theme.palette.border.grey}`,
          py: 0,
          [theme.breakpoints.down('md')]: {
            py: 2
          }
        }}
      >
        <Grid
          sx={{
            display: 'flex'
          }}
          container
          spacing={2}
        >
          {/* Left Side: Property Details */}
          {isCalendar && (
            <Grid
              sx={{
                borderRight: `1px solid ${theme.palette.border.grey}`,
                display: 'flex',
                alignItems: 'center',
                [theme.breakpoints.down('md')]: {
                  border: 'none',
                  mx: 0
                }
              }}
              item
              xs={12}
              md={4.5}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  boxShadow: 'none',
                  gap: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  mr: 2,
                  [theme.breakpoints.down('md')]: {
                    mr: 0
                  }
                }}
              >
                <GalleryCard
                  item={{
                    images: [
                      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                    ],
                    price: numberFormatter(property.price),
                    address: `${property.address}, ${property.city}, ${property.country}`,
                    beds: property.bedrooms,
                    baths: property.bathrooms,
                    sqrFeet: numberFormatter(property.square_feet)
                  }}
                />
              </Paper>
            </Grid>
          )}

          {/* Right Side: Date and Time Picker */}
          <Grid
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            item
            xs={12}
            md={7.5}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '22px',
                  color: 'black',
                  fontWeight: 500,
                  pt: 1,
                  pl: 2
                }}
              >
                {t('Select Date and Time')}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <StaticDatePicker
                  minDate={dayjs()}
                  label={t('Select date and time')}
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  renderInput={(params) => <TextField {...params} sx={{ width: '100%' }} />}
                  slotProps={{
                    actionBar: { actions: [] },
                    toolbar: { hidden: true },
                    layout: dateTimePaperPropsStyles
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box>
              <Grid
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 355,
                  paddingBottom: 1,
                  flexWrap: 'nowrap',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  [theme.breakpoints.down('sm')]: {
                    flexDirection: 'row'
                  }
                }}
                container
                spacing={2}
                mt={1}
              >
                {times.map((time) => (
                  <Grid
                    sx={{
                      flexGrow: 1
                    }}
                    item
                    key={time}
                  >
                    <Button
                      sx={{
                        width: '120px',
                        height: '40px',
                        flexGrow: 1,
                        color: selectedTime === time ? '#fff' : theme.palette.text.secondary,
                        border: `1px solid ${
                          selectedTime === time ? 'transparent' : theme.palette.text.secondary
                        }`,
                        background: selectedTime === time ? '#3F63EC' : '',
                        '&:hover': {
                          background: selectedTime === time ? '#3F63EC' : ''
                        }
                      }}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 5, pb: 2 }}>
        <Button onClick={handleClose} color="primary">
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleRequestViewing}
          variant="contained"
          sx={{
            width: '200px',
            [theme.breakpoints.down('md')]: {
              width: '150px'
            }
          }}
        >
          {t('Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewingModal;
