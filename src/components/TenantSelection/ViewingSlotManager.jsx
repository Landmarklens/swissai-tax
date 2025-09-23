import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  console.log('[ViewingSlotManager] Component mounted/updated');
  console.log('[ViewingSlotManager] propertyId prop:', propertyId);

  const dispatch = useDispatch();
  const { viewingSlots, loading } = useSelector((state) => state.tenantSelection);

  console.log('[ViewingSlotManager] viewingSlots:', viewingSlots);
  console.log('[ViewingSlotManager] loading:', loading);

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
    title: `${slot.current_allocated}/${slot.max_capacity} booked`,
    start: new Date(slot.slot_datetime),
    end: moment(slot.slot_datetime).add(slot.duration_minutes, 'minutes').toDate(),
    resource: slot,
    color: slot.status === 'fully_booked' ? '#f44336' : 
           slot.status === 'partially_booked' ? '#ff9800' : '#4caf50'
  })) || [];

  const handleCreateSlot = async () => {
    console.log('[ViewingSlotManager] handleCreateSlot called');
    console.log('[ViewingSlotManager] slotForm:', slotForm);
    console.log('[ViewingSlotManager] propertyId:', propertyId);

    // Format data according to backend expectations
    const slotData = {
      date: slotForm.date,
      time: slotForm.time,
      duration_minutes: slotForm.duration,
      max_capacity: slotForm.capacity,
      slot_type: slotForm.type,
      notes: slotForm.notes
    };

    console.log('[ViewingSlotManager] Formatted slotData:', slotData);

    try {
      console.log('[ViewingSlotManager] Dispatching createViewingSlots action...');
      const result = await dispatch(createViewingSlots({
        propertyId,
        slots: [slotData]
      }));

      console.log('[ViewingSlotManager] createViewingSlots result:', result);

      if (result.error) {
        console.error('[ViewingSlotManager] Error creating slot:', result.error);
        alert('Failed to create viewing slot: ' + (result.error.message || 'Unknown error'));
      } else {
        console.log('[ViewingSlotManager] Slot created successfully');
        setShowSlotDialog(false);
        resetSlotForm();
      }
    } catch (error) {
      console.error('[ViewingSlotManager] Exception in handleCreateSlot:', error);
      alert('Failed to create viewing slot: ' + error.message);
    }
  };

  const handleBulkCreate = async () => {
    console.log('[ViewingSlotManager] handleBulkCreate called');
    console.log('[ViewingSlotManager] bulkForm:', bulkForm);

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

    console.log('[ViewingSlotManager] Generated slots:', slots);

    try {
      console.log('[ViewingSlotManager] Dispatching bulkCreateSlots action...');
      const result = await dispatch(bulkCreateSlots({ propertyId, slots }));

      console.log('[ViewingSlotManager] bulkCreateSlots result:', result);

      if (result.error) {
        console.error('[ViewingSlotManager] Error creating slots:', result.error);
        alert('Failed to create viewing slots: ' + (result.error.message || 'Unknown error'));
      } else {
        console.log('[ViewingSlotManager] Slots created successfully');
        setShowBulkDialog(false);
      }
    } catch (error) {
      console.error('[ViewingSlotManager] Exception in handleBulkCreate:', error);
      alert('Failed to create viewing slots: ' + error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this viewing slot?')) {
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
    if (slot.status === 'cancelled') return 'Cancelled';
    if (slot.status === 'fully_booked') return 'Full';
    if (slot.status === 'partially_booked') return `${slot.current_allocated}/${slot.max_capacity}`;
    return 'Available';
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Viewing Schedule Management
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
              Bulk Create
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                console.log('[ViewingSlotManager] Add Slot button clicked');
                console.log('[ViewingSlotManager] Setting showSlotDialog to true');
                setShowSlotDialog(true);
              }}
            >
              Add Slot
            </Button>
          </Box>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Viewing slots are automatically allocated to applicants based on availability. 
            Each slot can accommodate multiple viewers (group viewings) or single applicants.
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
                      {slot.current_allocated} of {slot.max_capacity} spots filled
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
      {console.log('[ViewingSlotManager] Rendering Dialog, showSlotDialog:', showSlotDialog)}
      <Dialog open={showSlotDialog} onClose={() => setShowSlotDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSlot ? 'Edit Viewing Slot' : 'Create Viewing Slot'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={slotForm.date}
                onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Time"
                value={slotForm.time}
                onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={slotForm.duration}
                onChange={(e) => setSlotForm({ ...slotForm, duration: parseInt(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Capacity"
                value={slotForm.capacity}
                onChange={(e) => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) })}
                helperText="Number of viewers per slot"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Viewing Type</InputLabel>
                <Select
                  value={slotForm.type}
                  onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}
                  label="Viewing Type"
                >
                  <MenuItem value="individual">Individual Viewing</MenuItem>
                  <MenuItem value="group">Group Viewing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (optional)"
                value={slotForm.notes}
                onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSlotDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSlot}>
            {editingSlot ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Create Viewing Slots</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={bulkForm.startDate}
                onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={bulkForm.endDate}
                onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Select Weekdays</Typography>
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
                <Typography>Time Slots</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addTimeSlot}>
                  Add Time Slot
                </Button>
              </Box>
              
              {bulkForm.timeSlots.map((slot, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    type="time"
                    label="Time"
                    value={slot.time}
                    onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="number"
                    label="Duration"
                    value={slot.duration}
                    onChange={(e) => updateTimeSlot(index, 'duration', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">min</InputAdornment>
                    }}
                  />
                  <TextField
                    type="number"
                    label="Capacity"
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
                label="Automatically allocate applicants to available slots"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkCreate}>
            Create Slots
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Stats */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Viewing Schedule Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {viewingSlots?.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Slots
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {viewingSlots?.filter(s => s.status === 'available').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Available
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {viewingSlots?.filter(s => s.status === 'partially_booked').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Partially Booked
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {viewingSlots?.filter(s => s.status === 'fully_booked').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Fully Booked
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
              Continue to Next Step
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ViewingSlotManager;