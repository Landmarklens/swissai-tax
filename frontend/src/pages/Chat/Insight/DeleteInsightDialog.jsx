import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';

const DeleteInsightDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle>Delete Insight</DialogTitle>
    <DialogContent>
      <p>Are you sure you want to delete this insight?</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Yes, Delete
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default DeleteInsightDialog;
