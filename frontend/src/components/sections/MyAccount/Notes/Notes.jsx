import { Box, styled, Typography } from '@mui/material';
import NotesCard from '../../../notesCard/notesCard';
import { jsonData } from '../../../../db';
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PropertyFeedback from '../../PropertyFeedback/PropertyFeedback';
import { CreateFeedbackModal } from '../../../modals/CreateFeedbackModal';
import { getNote, selectNotes } from '../../../../store/slices/notesSlice';

import { fetchProperties, selectProperties } from '../../../../store/slices/propertiesSlice';
import { useTranslation } from 'react-i18next';

const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2)
}));

const Notes = ({ userId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { notes, currentNote, addNote } = useSelector(selectNotes);
  const { properties } = useSelector(selectProperties);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    setFeedbackModal(false);
    if (addNote.isSuccess) {
      dispatch(getNote());
    }
  }, [addNote, dispatch]);

  const showFeedback = (direction) => {
    if (!properties.data || properties.data.length === 0) return;

    const currentIndex = properties.data.findIndex((note) => note.id === selectedNoteId);

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % properties.data.length;
    } else {
      newIndex = (currentIndex - 1 + properties.data.length) % properties.data.length;
    }

    setSelectedNoteId(properties.data[newIndex].id);
  };

  const openFeedbackModal = () => {
    setFeedbackModal(true);
  };

  const handleNoteAdded = () => {
    dispatch(fetchProperties());
    if (selectedNoteId) {
      dispatch(getNote(selectedNoteId));
    }
  };

  useEffect(() => {
    if (selectedNoteId !== null) {
      dispatch(getNote(selectedNoteId));
    }
  }, [selectedNoteId, dispatch]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId || !properties.data) return null;
    return properties.data.find((note) => note.id === selectedNoteId);
  }, [selectedNoteId, properties.data]);

  useEffect(() => {
    if (selectedNoteId !== null) {
      dispatch(getNote(selectedNoteId));
    }
  }, [selectedNoteId, dispatch]);

  return (
    <Box sx={{ px: 3, width: '100%' }}>
      <HeaderContainer>
        {selectedNote ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              variant="body1"
              fontWeight="normal"
              onClick={() => setSelectedNoteId(null)}
            >
              <ChevronLeftIcon />
              {t('Back')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                mr: '-8px'
              }}
            >
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                variant="body1"
                onClick={() => showFeedback(0)}
                fontWeight="normal"
              >
                <ChevronLeftIcon />
                {t('Previous')}
              </Typography>
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => showFeedback(1)}
                variant="body1"
                fontWeight="normal"
              >
                {t('Next')}
                <ChevronRightIcon />
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="h6" fontWeight="normal">
            {t('Notes')}
          </Typography>
        )}
      </HeaderContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          gap: '18px'
        }}
      >
        {selectedNoteId ? (
          <Box>
            <NotesCard item={selectedNote} openFeedback={() => {}} />
            <PropertyFeedback
              openFeedbackModal={openFeedbackModal}
              feedbacks={notes?.data.filter((item) => item.property_id === selectedNoteId)}
            />
          </Box>
        ) : (
          properties &&
          properties?.data.map((item, index) => (
            <NotesCard openFeedback={() => setSelectedNoteId(item.id)} key={index} item={item} />
          ))
        )}
      </Box>
      <CreateFeedbackModal
        open={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        propertyId={selectedNoteId}
        onNoteAdded={handleNoteAdded}
      />
    </Box>
  );
};

export default Notes;
