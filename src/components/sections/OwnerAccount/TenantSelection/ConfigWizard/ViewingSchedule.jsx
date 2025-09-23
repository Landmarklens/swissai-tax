import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Chip,
  Paper,
  Grid,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ViewingSchedule = ({ settings, onChange, errors }) => {
  const { t } = useTranslation();

  const weekDays = [
    { value: 'monday', label: t('Mon') },
    { value: 'tuesday', label: t('Tue') },
    { value: 'wednesday', label: t('Wed') },
    { value: 'thursday', label: t('Thu') },
    { value: 'friday', label: t('Fri') },
    { value: 'saturday', label: t('Sat') },
    { value: 'sunday', label: t('Sun') }
  ];

  const timeSlots = [
    { value: 'morning', label: t('Morning'), time: '09:00 - 12:00' },
    { value: 'afternoon', label: t('Afternoon'), time: '12:00 - 17:00' },
    { value: 'evening', label: t('Evening'), time: '17:00 - 20:00' }
  ];

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({
      ...settings,
      [field]: value
    });
  };

  const handleDaysChange = (event, newDays) => {
    if (newDays !== null) {
      onChange({
        ...settings,
        preferredDays: newDays
      });
    }
  };

  const handleTimesChange = (event, newTimes) => {
    if (newTimes !== null) {
      onChange({
        ...settings,
        preferredTimes: newTimes
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Viewing Schedule Settings')}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {t('Configure how viewings are scheduled and managed for qualified applicants.')}
      </Typography>

      {errors.viewing && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.viewing}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <GroupsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            {t('Viewing Capacity')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={t('Max Invites per Viewing')}
              value={settings.maxInvitesPerViewing}
              onChange={handleChange('maxInvitesPerViewing')}
              InputProps={{
                inputProps: { min: 1, max: 20 },
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupsIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              helperText={t('Maximum number of applicants to invite per viewing slot')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoScheduleEnabled}
                  onChange={handleChange('autoScheduleEnabled')}
                  color="primary"
                />
              }
              label={t('Auto-schedule top applicants')}
            />
          </Grid>
        </Grid>
      </Paper>

      {settings.autoScheduleEnabled && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <CalendarIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Preferred Days')}
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={settings.preferredDays}
              onChange={handleDaysChange}
              aria-label="preferred days"
              sx={{ flexWrap: 'wrap' }}
            >
              {weekDays.map((day) => (
                <ToggleButton key={day.value} value={day.value} sx={{ m: 0.5 }}>
                  {day.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {settings.preferredDays.length === 0 && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {t('Please select at least one preferred day')}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <TimeIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Preferred Time Slots')}
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={settings.preferredTimes}
              onChange={handleTimesChange}
              aria-label="preferred times"
              sx={{ width: '100%' }}
            >
              {timeSlots.map((slot) => (
                <ToggleButton key={slot.value} value={slot.value} sx={{ flexGrow: 1, flexDirection: 'column' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {slot.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {slot.time}
                  </Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Paper>
        </>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            {t('Time Settings')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('Viewing Duration')}</InputLabel>
              <Select
                value={settings.duration}
                onChange={handleChange('duration')}
                label={t('Viewing Duration')}
              >
                <MenuItem value={15}>15 {t('minutes')}</MenuItem>
                <MenuItem value={30}>30 {t('minutes')}</MenuItem>
                <MenuItem value={45}>45 {t('minutes')}</MenuItem>
                <MenuItem value={60}>60 {t('minutes')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('Buffer Time')}</InputLabel>
              <Select
                value={settings.buffer}
                onChange={handleChange('buffer')}
                label={t('Buffer Time')}
              >
                <MenuItem value={0}>{t('No buffer')}</MenuItem>
                <MenuItem value={15}>15 {t('minutes')}</MenuItem>
                <MenuItem value={30}>30 {t('minutes')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('Buffer time is added between viewings for preparation and travel.')}
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>{t('Note:')}</strong> {t('Viewing invitations will be sent automatically to qualified applicants based on their score ranking and your availability settings.')}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ViewingSchedule;