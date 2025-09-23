import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Typography,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const DecisionModal = ({ open, onClose, application, onConfirm }) => {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [scheduleViewing, setScheduleViewing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!decision) {
      setError('Please select a decision');
      return;
    }
    
    if (decision === 'reject' && !reason) {
      setError('Please provide a reason for rejection');
      return;
    }

    onConfirm({
      decision,
      reason,
      scheduleViewing,
      leadId: application?.id
    });

    // Reset form
    setDecision('');
    setReason('');
    setScheduleViewing(false);
    setError('');
    onClose();
  };

  const handleClose = () => {
    setDecision('');
    setReason('');
    setScheduleViewing(false);
    setError('');
    onClose();
  };

  if (!application) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Make Decision for Application
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Applicant Information
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Name:</strong> {application.name || 'Anonymous'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Score:</strong> 
                <Chip 
                  label={`${application.score || 0}/100`}
                  size="small"
                  color={application.score >= 70 ? 'success' : application.score >= 50 ? 'warning' : 'error'}
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Status:</strong> {application.lead_status || application.status || 'Pending'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Decision</FormLabel>
          <RadioGroup
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <FormControlLabel
              value="accept"
              control={<Radio color="success" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  Accept Application
                </Box>
              }
            />
            <FormControlLabel
              value="reject"
              control={<Radio color="error" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CancelIcon color="error" sx={{ mr: 1 }} />
                  Reject Application
                </Box>
              }
            />
            <FormControlLabel
              value="schedule_viewing"
              control={<Radio color="info" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon color="info" sx={{ mr: 1 }} />
                  Schedule for Viewing
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {(decision === 'reject' || decision === 'accept') && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={decision === 'reject' ? 'Reason for Rejection (Required)' : 'Additional Notes (Optional)'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required={decision === 'reject'}
            variant="outlined"
            placeholder={
              decision === 'reject' 
                ? 'Please provide a reason for rejection...'
                : 'Any additional notes or comments...'
            }
          />
        )}

        {decision === 'schedule_viewing' && (
          <Alert severity="info">
            The applicant will be invited to schedule a viewing. You can manage viewing slots in the Viewings tab.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color={decision === 'accept' ? 'success' : decision === 'reject' ? 'error' : 'primary'}
          disabled={!decision || (decision === 'reject' && !reason)}
        >
          Confirm Decision
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DecisionModal;