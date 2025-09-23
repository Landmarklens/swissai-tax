import React, { useState } from 'react';
import { Modal, Typography, IconButton, Divider, Button } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { addNote } from '../../store/slices/notesSlice';
import { useTranslation } from 'react-i18next';
import { toast, ToastContainer } from 'react-toastify';

const StyledModalBox = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 640,
  maxWidth: 'calc(100% - 20px)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  boxShadow: 24
}));

const ModalHeader = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 40px',
  marginRight: -8
}));

const ModalContent = styled('div')(() => ({
  padding: '10px 40px',
  margin: '24px 0'
}));

const ModalFooter = styled('div')(() => ({
  padding: '24px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const Textarea = styled('textarea')(() => ({
  marginTop: 8,
  borderRadius: 6,
  padding: '8px 12px',
  border: '1px solid rgba(0, 9, 50, 0.12)',
  background: 'rgba(255, 255, 255, 0.90)',
  minWidth: 'calc(100% - 26px)',
  maxWidth: 'calc(100% - 26px)',
  minHeight: '184px',
  maxHeight: '240px',
  fontSize: 16,
  fontFamily: 'SF Pro Display'
}));

export const CreateFeedbackModal = ({ open, onClose, propertyId, onNoteAdded }) => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const dispatch = useDispatch();

  const handleAddNote = () => {
    if (note.trim()) {
      onNoteAdded(note);
      setNote('');

      dispatch(addNote({ property_id: propertyId, note })).then(() => {
        if (onNoteAdded) {
          onNoteAdded(note);
        }
      });
    } else {
      toast.error('Please enter the feedback.');
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <StyledModalBox>
          <ModalHeader>
            <Typography
              sx={{ fontWeight: 700, fontSize: 18 }}
              id="modal-title"
              variant="h6"
              component="h2"
            >
              {t('New Note')}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </ModalHeader>
          <Divider sx={{ width: '100%' }} />
          <ModalContent>
            <Typography sx={{ fontWeight: 500, fontSize: 16, color: '#1C2024' }} variant="body1">
              {t('Note')}
            </Typography>
            <Textarea
              placeholder={t('Write your note here.')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </ModalContent>
          <Divider sx={{ width: '100%' }} />
          <ModalFooter>
            <Button
              variant="text"
              onClick={onClose}
              sx={{
                fontWeight: 400
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleAddNote}
              sx={{
                fontWeight: 400,
                boxShadow: 'none',
                width: 122,
                height: 48
              }}
            >
              {t('Add Note')}
            </Button>
          </ModalFooter>
        </StyledModalBox>
      </Modal>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};
