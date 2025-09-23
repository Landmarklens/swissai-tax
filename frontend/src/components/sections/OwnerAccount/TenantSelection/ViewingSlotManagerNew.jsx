import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  ContentCopy as CopyIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format, addDays, addWeeks, setHours, setMinutes, startOfWeek, endOfWeek } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../../../utils/api/getApiUrl';
import { getSafeUser } from '../../../../utils/localStorage/safeJSONParse';

const ViewingSlotManager = ({ propertyId, onComplete, onBack }) => {
  const { t } = useTranslation();
  
  const [slots, setSlots] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slotConfig, setSlotConfig] = useState({
    type: 'single', // single, recurring, bulk
    date: new Date(),
    time: new Date(),
    duration: 30, // minutes
    capacity: 1,
    recurringDays: [],
    recurringWeeks: 1,
    bulkTimeSlots: []
  });
  
  const [quickTemplates] = useState([
    {
      name: 'Weekend Open House',
      description: 'Saturday & Sunday, 2-hour slots',
      config: {
        days: ['Saturday', 'Sunday'],
        times: ['10:00', '12:00', '14:00'],
        duration: 120,
        capacity: 5
      }
    },
    {
      name: 'Weekday Evenings',
      description: 'Mon-Fri, 30-min slots after work',
      config: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: ['17:30', '18:00', '18:30', '19:00'],
        duration: 30,
        capacity: 1
      }
    },
    {
      name: 'Individual Viewings',
      description: 'One-on-one appointments',
      config: {
        days: ['flexible'],
        times: ['flexible'],
        duration: 20,
        capacity: 1
      }
    }
  ]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    // Load existing slots if any
    fetchExistingSlots();
  }, [propertyId]);

  const fetchExistingSlots = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/viewing-slots/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleAddSlot = () => {
    const newSlot = {
      id: Date.now(),
      date: format(slotConfig.date, 'yyyy-MM-dd'),
      time: format(slotConfig.time, 'HH:mm'),
      duration: slotConfig.duration,
      capacity: slotConfig.capacity,
      allocated: 0,
      status: 'available'
    };
    
    if (slotConfig.type === 'single') {
      setSlots([...slots, newSlot]);
    } else if (slotConfig.type === 'recurring') {
      const recurringSlots = generateRecurringSlots();
      setSlots([...slots, ...recurringSlots]);
    } else if (slotConfig.type === 'bulk') {
      const bulkSlots = generateBulkSlots();
      setSlots([...slots, ...bulkSlots]);
    }
    
    setShowAddDialog(false);
    resetSlotConfig();
  };

  const generateRecurringSlots = () => {
    const generatedSlots = [];
    const startDate = new Date(slotConfig.date);
    const weeks = slotConfig.recurringWeeks;
    
    for (let week = 0; week < weeks; week++) {
      slotConfig.recurringDays.forEach(day => {
        const dayIndex = daysOfWeek.indexOf(day);
        const weekStart = startOfWeek(addWeeks(startDate, week), { weekStartsOn: 1 });
        const slotDate = addDays(weekStart, dayIndex);
        
        slotConfig.bulkTimeSlots.forEach(timeSlot => {
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const slotTime = setMinutes(setHours(slotDate, hours), minutes);
          
          generatedSlots.push({
            id: Date.now() + Math.random(),
            date: format(slotDate, 'yyyy-MM-dd'),
            time: timeSlot,
            duration: slotConfig.duration,
            capacity: slotConfig.capacity,
            allocated: 0,
            status: 'available'
          });
        });
      });
    }
    
    return generatedSlots;
  };

  const generateBulkSlots = () => {
    const generatedSlots = [];
    const baseDate = new Date(slotConfig.date);
    
    slotConfig.bulkTimeSlots.forEach((timeSlot, index) => {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotTime = setMinutes(setHours(baseDate, hours), minutes);
      
      generatedSlots.push({
        id: Date.now() + index,
        date: format(baseDate, 'yyyy-MM-dd'),
        time: timeSlot,
        duration: slotConfig.duration,
        capacity: slotConfig.capacity,
        allocated: 0,
        status: 'available'
      });
    });
    
    return generatedSlots;
  };

  const resetSlotConfig = () => {
    setSlotConfig({
      type: 'single',
      date: new Date(),
      time: new Date(),
      duration: 30,
      capacity: 1,
      recurringDays: [],
      recurringWeeks: 1,
      bulkTimeSlots: []
    });
  };

  const handleDeleteSlot = (slotId) => {
    setSlots(slots.filter(slot => slot.id !== slotId));
  };

  const handleApplyTemplate = (template) => {
    // Apply template configuration
    setSlotConfig({
      ...slotConfig,
      type: 'recurring',
      recurringDays: template.config.days === ['flexible'] ? [] : template.config.days,
      bulkTimeSlots: template.config.times === ['flexible'] ? [] : template.config.times,
      duration: template.config.duration,
      capacity: template.config.capacity
    });
    setShowAddDialog(true);
  };

  const handleSaveSlots = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/viewing-slots/${propertyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          },
          body: JSON.stringify({ slots })
        }
      );
      
      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving slots:', error);
    }
  };

  const getSlotsByDate = () => {
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const getTotalCapacity = () => {
    return slots.reduce((total, slot) => total + slot.capacity, 0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Viewing Slots
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Set up available time slots for property viewings. The AI will automatically assign applicants to these slots.
      </Typography>

      {/* Quick Templates */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Templates
        </Typography>
        <Grid container spacing={2}>
          {quickTemplates.map((template, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleApplyTemplate(template)}
              >
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      label={`${template.config.duration} min`}
                      icon={<TimeIcon />}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={`${template.config.capacity} ${template.config.capacity === 1 ? 'person' : 'people'}`}
                      icon={<GroupIcon />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Current Slots Summary */}
      {slots.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Configured Slots
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip 
                label={`${slots.length} slots`}
                color="primary"
                icon={<EventIcon />}
              />
              <Chip 
                label={`${getTotalCapacity()} total capacity`}
                color="success"
                icon={<PeopleIcon />}
              />
            </Box>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slots.slice(0, 5).map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>{slot.date}</TableCell>
                    <TableCell>{slot.time}</TableCell>
                    <TableCell>{slot.duration} min</TableCell>
                    <TableCell>
                      <Badge badgeContent={slot.allocated} color="primary">
                        <Chip 
                          size="small" 
                          label={`${slot.capacity - slot.allocated}/${slot.capacity}`}
                        />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={slot.status}
                        color={slot.status === 'available' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDeleteSlot(slot.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {slots.length > 5 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              And {slots.length - 5} more slots...
            </Typography>
          )}
        </Paper>
      )}

      {/* Add Slots Button */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setShowAddDialog(true)}
        fullWidth
        sx={{ mb: 3 }}
      >
        Add Viewing Slots
      </Button>

      {/* Add Slot Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Viewing Slots</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ToggleButtonGroup
              value={slotConfig.type}
              exclusive
              onChange={(e, value) => value && setSlotConfig({ ...slotConfig, type: value })}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="single">Single Slot</ToggleButton>
              <ToggleButton value="bulk">Multiple on Same Day</ToggleButton>
              <ToggleButton value="recurring">Recurring Weekly</ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2}>
              {/* Date Selection */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={slotConfig.date}
                    onChange={(newValue) => setSlotConfig({ ...slotConfig, date: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Time Selection for Single Slot */}
              {slotConfig.type === 'single' && (
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Time"
                      value={slotConfig.time}
                      onChange={(newValue) => setSlotConfig({ ...slotConfig, time: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
              )}

              {/* Multiple Time Slots for Bulk */}
              {(slotConfig.type === 'bulk' || slotConfig.type === 'recurring') && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Time Slots
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                      <Chip
                        key={time}
                        label={time}
                        onClick={() => {
                          const newSlots = slotConfig.bulkTimeSlots.includes(time)
                            ? slotConfig.bulkTimeSlots.filter(t => t !== time)
                            : [...slotConfig.bulkTimeSlots, time];
                          setSlotConfig({ ...slotConfig, bulkTimeSlots: newSlots });
                        }}
                        color={slotConfig.bulkTimeSlots.includes(time) ? 'primary' : 'default'}
                        variant={slotConfig.bulkTimeSlots.includes(time) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Recurring Days Selection */}
              {slotConfig.type === 'recurring' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Repeat on Days
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {daysOfWeek.map(day => (
                        <Chip
                          key={day}
                          label={day.substring(0, 3)}
                          onClick={() => {
                            const newDays = slotConfig.recurringDays.includes(day)
                              ? slotConfig.recurringDays.filter(d => d !== day)
                              : [...slotConfig.recurringDays, day];
                            setSlotConfig({ ...slotConfig, recurringDays: newDays });
                          }}
                          color={slotConfig.recurringDays.includes(day) ? 'primary' : 'default'}
                          variant={slotConfig.recurringDays.includes(day) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Repeat for {slotConfig.recurringWeeks} week(s)
                    </Typography>
                    <Slider
                      value={slotConfig.recurringWeeks}
                      onChange={(e, value) => setSlotConfig({ ...slotConfig, recurringWeeks: value })}
                      min={1}
                      max={8}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </>
              )}

              {/* Duration */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Duration: {slotConfig.duration} minutes
                </Typography>
                <Slider
                  value={slotConfig.duration}
                  onChange={(e, value) => setSlotConfig({ ...slotConfig, duration: value })}
                  min={15}
                  max={120}
                  step={15}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              {/* Capacity */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Capacity: {slotConfig.capacity} {slotConfig.capacity === 1 ? 'person' : 'people'}
                </Typography>
                <Slider
                  value={slotConfig.capacity}
                  onChange={(e, value) => setSlotConfig({ ...slotConfig, capacity: value })}
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSlot} variant="contained">
            Add Slots
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveSlots}
          disabled={slots.length === 0}
        >
          Save Slots & Continue
        </Button>
      </Box>

      {/* Info Alert */}
      {slots.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            How viewing slots work:
          </Typography>
          <Typography variant="body2">
            • The AI will automatically assign applicants to available slots when they request viewings
          </Typography>
          <Typography variant="body2">
            • Applicants receive confirmation emails with their assigned time
          </Typography>
          <Typography variant="body2">
            • You can set different capacities for group viewings or individual appointments
          </Typography>
          <Typography variant="body2">
            • Slots are managed automatically - no manual scheduling needed
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ViewingSlotManager;