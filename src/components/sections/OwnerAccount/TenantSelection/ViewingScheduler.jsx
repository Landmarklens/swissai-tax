import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Alert,
  Fab,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const ViewingScheduler = ({ open, onClose, propertyId, applications = [], onScheduleUpdate }) => {
  const [viewingSlots, setViewingSlots] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({
    date: dayjs(),
    duration: 30,
    maxAttendees: 1,
    location: '',
    notes: ''
  });
  const [assignedViewings, setAssignedViewings] = useState({});

  // Mock data for viewing slots
  useEffect(() => {
    const mockSlots = [
      {
        id: 1,
        date: dayjs().add(1, 'day').hour(10).minute(0),
        duration: 30,
        maxAttendees: 1,
        attendees: [],
        location: 'Property Main Entrance',
        status: 'available'
      },
      {
        id: 2,
        date: dayjs().add(1, 'day').hour(14).minute(0),
        duration: 30,
        maxAttendees: 1,
        attendees: [],
        location: 'Property Main Entrance',
        status: 'available'
      },
      {
        id: 3,
        date: dayjs().add(2, 'day').hour(11).minute(0),
        duration: 30,
        maxAttendees: 1,
        attendees: [],
        location: 'Property Main Entrance',
        status: 'available'
      }
    ];
    setViewingSlots(mockSlots);
  }, []);

  const handleAddSlot = () => {
    const slot = {
      id: Date.now(),
      ...newSlot,
      attendees: [],
      status: 'available'
    };
    setViewingSlots([...viewingSlots, slot]);
    setShowAddSlot(false);
    setNewSlot({
      date: dayjs(),
      duration: 30,
      maxAttendees: 1,
      location: '',
      notes: ''
    });
  };

  const handleDeleteSlot = (slotId) => {
    setViewingSlots(viewingSlots.filter(slot => slot.id !== slotId));
  };

  const handleAssignApplicant = (slotId, applicantId) => {
    setViewingSlots(viewingSlots.map(slot => {
      if (slot.id === slotId) {
        const applicant = applications.find(a => a.id === applicantId);
        return {
          ...slot,
          attendees: [...slot.attendees, applicant],
          status: slot.attendees.length + 1 >= slot.maxAttendees ? 'full' : 'available'
        };
      }
      return slot;
    }));

    setAssignedViewings({
      ...assignedViewings,
      [applicantId]: slotId
    });
  };

  const handleRemoveApplicant = (slotId, applicantId) => {
    setViewingSlots(viewingSlots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          attendees: slot.attendees.filter(a => a.id !== applicantId),
          status: 'available'
        };
      }
      return slot;
    }));

    const newAssignments = { ...assignedViewings };
    delete newAssignments[applicantId];
    setAssignedViewings(newAssignments);
  };

  const handleSendInvitations = () => {
    // Send invitations logic
    alert('Viewing invitations sent successfully!');
    if (onScheduleUpdate) {
      onScheduleUpdate();
    }
  };

  const getUnassignedApplicants = () => {
    return applications.filter(app => 
      !assignedViewings[app.id] && 
      ['viewing_requested', 'pending', 'qualified'].includes(app.lead_status || app.status)
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Viewing Scheduler</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddSlot(true)}
          >
            Add Slot
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Viewing Slots */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Viewing Slots
            </Typography>
            
            {viewingSlots.length === 0 ? (
              <Alert severity="info">
                No viewing slots scheduled. Click "Add Slot" to create one.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {viewingSlots.map((slot) => (
                  <Grid item xs={12} sm={6} key={slot.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {slot.date.format('MMM DD, YYYY')}
                          </Typography>
                          <Chip
                            label={slot.status}
                            size="small"
                            color={slot.status === 'available' ? 'success' : 'default'}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {slot.date.format('HH:mm')} ({slot.duration} min)
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {slot.location || 'Not specified'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {slot.attendees.length}/{slot.maxAttendees} attendees
                          </Typography>
                        </Box>

                        {slot.attendees.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Assigned:
                            </Typography>
                            {slot.attendees.map((attendee) => (
                              <Chip
                                key={attendee.id}
                                label={attendee.name || 'Anonymous'}
                                size="small"
                                onDelete={() => handleRemoveApplicant(slot.id, attendee.id)}
                                sx={{ mr: 0.5, mt: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                      
                      <CardActions>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteSlot(slot.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* Unassigned Applicants */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Pending Applicants
              <Badge 
                badgeContent={getUnassignedApplicants().length} 
                color="primary" 
                sx={{ ml: 2 }}
              />
            </Typography>
            
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {getUnassignedApplicants().length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No pending applicants"
                      secondary="All applicants have been assigned viewing slots"
                    />
                  </ListItem>
                ) : (
                  getUnassignedApplicants().map((applicant) => (
                    <React.Fragment key={applicant.id}>
                      <ListItem>
                        <ListItemText
                          primary={applicant.name || 'Anonymous Applicant'}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Score: {applicant.score}/100
                              </Typography>
                              <Typography variant="caption" display="block">
                                Status: {applicant.lead_status || applicant.status}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const availableSlot = viewingSlots.find(s => s.status === 'available');
                              if (availableSlot) {
                                handleAssignApplicant(availableSlot.id, applicant.id);
                              }
                            }}
                            disabled={!viewingSlots.some(s => s.status === 'available')}
                          >
                            Assign
                          </Button>
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          startIcon={<SendIcon />}
          onClick={handleSendInvitations}
          disabled={Object.keys(assignedViewings).length === 0}
        >
          Send Invitations ({Object.keys(assignedViewings).length})
        </Button>
      </DialogActions>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlot} onClose={() => setShowAddSlot(false)}>
        <DialogTitle>Add Viewing Slot</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="Date & Time"
                value={newSlot.date}
                onChange={(newValue) => setNewSlot({ ...newSlot, date: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={newSlot.duration}
                onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Max Attendees"
                value={newSlot.maxAttendees}
                onChange={(e) => setNewSlot({ ...newSlot, maxAttendees: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Location"
                value={newSlot.location}
                onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={newSlot.notes}
                onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddSlot(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSlot}>Add Slot</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ViewingScheduler;