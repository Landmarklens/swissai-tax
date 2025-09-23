import React, { useState } from 'react';
import { Box, Button, Typography, Avatar } from '@mui/material';
import { theme } from '../../../theme/theme';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import dayjs from 'dayjs';
import { CreateFeedbackModal } from '../../../components/modals/CreateFeedbackModal';
import { useDispatch } from 'react-redux';
import { getNote, addNote } from '../../../store/slices/notesSlice';
import { useTranslation } from 'react-i18next';
import { removeWhitespace } from './../../../utils/removeWhitespace';
import { getLocalStorageUser } from './../../../utils/localStorage/getLocalStorageUser';

const buttonStyling = {
  width: '100%',
  height: '40px',
  backgroundColor: 'transparent',
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.text.primary}`,
  py: 0.5,
  borderRadius: '5px',
  fontWeight: 400,
  fontSize: '12px',
  [theme.breakpoints.down('md')]: {
    fontSize: '12px',
    px: 2,
    width: '100%'
  }
};

const heading = {
  [theme.breakpoints.down('md')]: {
    fontSize: '14px'
  }
};

export const Feedback = ({ propertyNotes, propertyId, onAddNote }) => {
  const { t } = useTranslation();

  const [feedbackModal, setFeedbackModal] = useState(false);
  const dispatch = useDispatch();
  const user = getLocalStorageUser();
  const handleNoteAdded = (feedback) => {
    // onAddNote(feedback);

    dispatch(addNote({ property_id: propertyId, note: feedback })).then(() =>
      setFeedbackModal(false)
    );
  };

  return (
    <Box
      sx={{
        width: '60%',
        pb: 3,
        display: 'flex',
        [theme.breakpoints.down('md')]: {
          width: '100%'
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#edf2fe',
          borderRadius: '7px',
          px: 5,
          border: `1px solid ${theme.palette.border.blue}`,
          flexGrow: 1,
          [theme.breakpoints.down('md')]: {
            px: 2
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexGrow: 1,
            py: 2,
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.border.blue}`,
            [theme.breakpoints.down('md')]: { flexDirection: 'column' }
          }}
        >
          <Box sx={{ width: '80%', display: 'flex' }}>
            <Box>
              <MessageOutlinedIcon sx={{ color: 'blue', mt: 0.5, mr: 1 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={heading}>
                {t('User Feedback')}
              </Typography>
              <Typography py={1} pr={1} color="text.secondary">
                {t(
                  'Did you get the experience with this apartment? Provide feedback to the AI about what was good or bad.'
                )}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              width: '25%',
              display: 'flex',
              justifyContent: 'end',
              mt: 0.5,
              [theme.breakpoints.down('sm')]: { width: '100%' }
            }}
          >
            <Button onClick={() => setFeedbackModal(true)} sx={buttonStyling}>
              {t('Write a feedback')}
            </Button>
          </Box>
        </Box>

        {propertyNotes.map((feedback, index) => (
          <Box key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                py: 3,
                borderBottom:
                  index < propertyNotes.length - 1
                    ? `1px solid ${theme.palette.border.blue}`
                    : 'none',
                [theme.breakpoints.down('md')]: {
                  flexDirection: 'column',
                  py: 1,
                  rowGap: 1
                }
              }}
            >
              <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <Avatar src={feedback.avatar_url} sx={{ marginRight: 1 }}>
                  {removeWhitespace(feedback.user_name).charAt(0)}
                </Avatar>
                <Box>
                  <Typography color="text.primary" fontWeight="bold">
                    {feedback.user_name}
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ marginBottom: 1 }}>
                    {feedback.feedback}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {dayjs(feedback.created_at).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <CreateFeedbackModal
        open={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        propertyId={propertyId}
        onNoteAdded={handleNoteAdded}
      />
    </Box>
  );
};
