import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  ContentCopy as CopyIcon,
  AutoAwesome as AutoIcon,
  Visibility as ViewIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  createViewingSlots,
  updateViewingSlot,
  deleteViewingSlot,
  bulkCreateSlots
} from '../../../../store/slices/tenantSelectionSlice';

const localizer = momentLocalizer(moment);

const ViewingSlotManager = ({ propertyId, onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { viewingSlots, loading } = useSelector((state) => state.tenantSelection);


  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  // Slot form state
  const [slotForm, setSlotForm] = useState({
    date: '',
    time: '',
    duration: 30,
    capacity: 3,
    type: 'group', // 'individual' or 'group'
    notes: ''
  });
  
  // Bulk creation state
  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
    weekdays: [1, 2, 3, 4, 5], // Mon-Fri
    timeSlots: [
      { time: '18:00', duration: 30, capacity: 3 },
      { time: '18:30', duration: 30, capacity: 3 }
    ],
    autoAllocate: true
  });

  // Transform slots for calendar display
  const calendarEvents = viewingSlots?.map(slot => ({
    id: slot.id,
    title: t('viewing.booked_count', { current: slot.current_allocated, max: slot.max_capacity }),
    start: new Date(slot.slot_datetime),
    end: moment(slot.slot_datetime).add(slot.duration_minutes, 'minutes').toDate(),
    resource: slot,
    color: slot.status === 'fully_booked' ? '#f44336' :
           slot.status === 'partially_booked' ? '#ff9800' : '#4caf50'
  })) || [];

  const handleCreateSlot = async () => {

    // Format data according to backend expectations
    const slotData = {
      date: slotForm.date,
      time: slotForm.time,
      duration_minutes: slotForm.duration,
      max_capacity: slotForm.capacity,
      slot_type: slotForm.type,
      notes: slotForm.notes
    };


    try {
      const result = await dispatch(createViewingSlots({
        propertyId,
        slots: [slotData]
      }));


      if (result.error) {
        console.error('[ViewingSlotManager] Error creating slot:', result.error);
        alert(t('modal.viewing_slots.error_create') + ': ' + (result.error.message || t('modal.viewing_slots.error_unknown')));
      } else {
        setShowSlotDialog(false);
        resetSlotForm();
      }
    } catch (error) {
      console.error('[ViewingSlotManager] Exception in handleCreateSlot:', error);
      alert(t('modal.viewing_slots.error_create') + ': ' + error.message);
    }
  };

  const handleBulkCreate = async () => {

    const slots = [];
    const startDate = moment(bulkForm.startDate);
    const endDate = moment(bulkForm.endDate);

    // Generate slots for each day in range
    for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'day')) {
      // Check if it's a selected weekday
      if (bulkForm.weekdays.includes(date.day())) {
        // Add each time slot for this day
        bulkForm.timeSlots.forEach(timeSlot => {
          const slotData = {
            date: date.format('YYYY-MM-DD'),
            time: timeSlot.time,
            duration_minutes: timeSlot.duration,
            max_capacity: timeSlot.capacity,
            slot_type: 'group'
          };
          slots.push(slotData);
        });
      }
    }


    try {
      const result = await dispatch(bulkCreateSlots({ propertyId, slots }));


      if (result.error) {
        console.error('[ViewingSlotManager] Error creating slots:', result.error);
        alert(t('modal.viewing_slots.error_bulk_create') + ': ' + (result.error.message || t('modal.viewing_slots.error_unknown')));
      } else {
        setShowBulkDialog(false);
      }
    } catch (error) {
      console.error('[ViewingSlotManager] Exception in handleBulkCreate:', error);
      alert(t('modal.viewing_slots.error_bulk_create') + ': ' + error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm(t('modal.viewing_slots.confirm_delete'))) {
      await dispatch(deleteViewingSlot({ slotId }));
    }
  };

  const addTimeSlot = () => {
    setBulkForm(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { time: '19:00', duration: 30, capacity: 3 }]
    }));
  };

  const removeTimeSlot = (index) => {
    setBulkForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, field, value) => {
    setBulkForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const resetSlotForm = () => {
    setSlotForm({
      date: '',
      time: '',
      duration: 30,
      capacity: 3,
      type: 'group',
      notes: ''
    });
    setEditingSlot(null);
  };

  const getSlotStatusColor = (slot) => {
    if (slot.status === 'cancelled') return 'default';
    if (slot.status === 'fully_booked') return 'error';
    if (slot.status === 'partially_booked') return 'warning';
    return 'success';
  };

  const getSlotStatusLabel = (slot) => {
    if (slot.status === 'cancelled') return t('viewing.cancelled');
    if (slot.status === 'fully_booked') return t('viewing.status_full');
    if (slot.status === 'partially_booked') return `${slot.current_allocated}/${slot.max_capacity}`;
    return t('viewing.available');
  };

  const weekDays = [
    { value: 0, label: t('viewing.weekday_sun') },
    { value: 1, label: t('viewing.weekday_mon') },
    { value: 2, label: t('viewing.weekday_tue') },
    { value: 3, label: t('viewing.weekday_wed') },
    { value: 4, label: t('viewing.weekday_thu') },
    { value: 5, label: t('viewing.weekday_fri') },
    { value: 6, label: t('viewing.weekday_sat') }
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {t('viewing.schedule_management')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(e, newView) => newView && setView(newView)}
              size="small"
            >
              <ToggleButton value="calendar">
                <CalendarIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              startIcon={<AutoIcon />}
              onClick={() => setShowBulkDialog(true)}
            >
              {t('viewing.bulk_create')}
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setShowSlotDialog(true);
              }}
            >
              {t('viewing.add_slot')}
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {t('viewing.auto_allocation_info')}
          </Typography>
        </Alert>
      </Paper>

      {/* Calendar View */}
      {view === 'calendar' && (
        <Paper sx={{ p: 3, height: 600 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={(event) => {
              setEditingSlot(event.resource);
              setShowSlotDialog(true);
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color,
                opacity: 0.8
              }
            })}
            views={['month', 'week', 'day']}
            defaultView="week"
            step={15}
            timeslots={4}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
          />
        </Paper>
      )}

      {/* List View */}
      {view === 'list' && (
        <Grid container spacing={2}>
          {viewingSlots?.map((slot) => (
            <Grid item xs={12} md={6} lg={4} key={slot.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {moment(slot.slot_datetime).format('MMM DD, YYYY')}
                    </Typography>
                    <Chip
                      label={getSlotStatusLabel(slot)}
                      color={getSlotStatusColor(slot)}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    <Typography>
                      {moment(slot.slot_datetime).format('HH:mm')} -
                      {moment(slot.slot_datetime).add(slot.duration_minutes, 'minutes').format('HH:mm')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Badge badgeContent={slot.current_allocated} color="primary">
                      <PeopleIcon fontSize="small" />
                    </Badge>
                    <Typography variant="body2">
                      {t('viewing.spots_filled', { current: slot.current_allocated, max: slot.max_capacity })}
                    </Typography>
                  </Box>
                  
                  {slot.notes && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {slot.notes}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingSlot(slot);
                        setShowSlotDialog(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={slot.current_allocated > 0}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Slot Dialog */}
      <Dialog open={showSlotDialog} onClose={() => setShowSlotDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSlot ? t('modal.viewing_slots.edit_title') : t('modal.viewing_slots.create_title')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label={t('Date')}
                value={slotForm.date}
                onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label={t('Time')}
                value={slotForm.time}
                onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label={t('viewing.duration_minutes')}
                value={slotForm.duration}
                onChange={(e) => setSlotForm({ ...slotForm, duration: parseInt(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{t('viewing.min')}</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label={t('viewing.max_capacity')}
                value={slotForm.capacity}
                onChange={(e) => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) })}
                helperText={t('viewing.viewers_per_slot')}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('viewing.viewing_type')}</InputLabel>
                <Select
                  value={slotForm.type}
                  onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}
                  label={t('viewing.viewing_type')}
                >
                  <MenuItem value="individual">{t('viewing.individual_viewing')}</MenuItem>
                  <MenuItem value="group">{t('viewing.group_viewing')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('viewing.notes_optional')}
                value={slotForm.notes}
                onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSlotDialog(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleCreateSlot}>
            {editingSlot ? t('modal.viewing_slots.update') : t('modal.viewing_slots.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('modal.viewing_slots.bulk_create_title')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label={t('viewing.start_date')}
                value={bulkForm.startDate}
                onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label={t('viewing.end_date')}
                value={bulkForm.endDate}
                onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>{t('viewing.select_weekdays')}</Typography>
              <ToggleButtonGroup
                value={bulkForm.weekdays}
                onChange={(e, newDays) => setBulkForm({ ...bulkForm, weekdays: newDays })}
                sx={{ flexWrap: 'wrap' }}
              >
                {weekDays.map(day => (
                  <ToggleButton key={day.value} value={day.value}>
                    {day.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>{t('viewing.time_slots')}</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addTimeSlot}>
                  {t('viewing.add_time_slot')}
                </Button>
              </Box>

              {bulkForm.timeSlots.map((slot, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    type="time"
                    label={t('Time')}
                    value={slot.time}
                    onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="number"
                    label={t('viewing.duration')}
                    value={slot.duration}
                    onChange={(e) => updateTimeSlot(index, 'duration', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{t('viewing.min')}</InputAdornment>
                    }}
                  />
                  <TextField
                    type="number"
                    label={t('viewing.capacity')}
                    value={slot.capacity}
                    onChange={(e) => updateTimeSlot(index, 'capacity', parseInt(e.target.value))}
                  />
                  <IconButton onClick={() => removeTimeSlot(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={bulkForm.autoAllocate}
                    onChange={(e) => setBulkForm({ ...bulkForm, autoAllocate: e.target.checked })}
                  />
                }
                label={t('viewing.auto_allocate_label')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkDialog(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleBulkCreate}>
            {t('modal.viewing_slots.create_slots')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Stats */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('viewing.summary_title')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {viewingSlots?.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('viewing.total_slots')}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {viewingSlots?.filter(s => s.status === 'available').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('viewing.available')}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {viewingSlots?.filter(s => s.status === 'partially_booked').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('viewing.partially_booked')}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {viewingSlots?.filter(s => s.status === 'fully_booked').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('viewing.fully_booked')}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {onComplete && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              onClick={onComplete}
              disabled={!viewingSlots?.length}
            >
              {t('viewing.continue_next_step')}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ViewingSlotManager;