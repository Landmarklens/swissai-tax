import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { selectProperties } from '../../../../store/slices/propertiesSlice';
import GalleryCard from '../../../galleryCard/GalleryCard';
import { cancelViewing, getViewings, updateViewing } from '../../../../store/slices/viewingSlice';
import { useDispatch, useSelector } from 'react-redux';

const PropertyDetailsModal = ({ open, handleClose, rowData }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentProperty } = useSelector(selectProperties);
  // We will use mocked data for now because we dont have a lot of info of current property
  const mockedData = {
    images: [
      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
    address: 'Sonnenweg 15, 8810 Horgen, Switzerland',
    beds: 3,
    baths: 3,
    sqrFeet: 125,
    id: 10
  };

  const rejectViewing = () => {
    dispatch(cancelViewing(rowData.viewing_id)).then(() => {
      handleClose();
      dispatch(getViewings({}));
    });
  };

  const acceptViewing = () => {
    dispatch(updateViewing({ viewingId: rowData.viewing_id, body: { status: 'scheduled' } })).then(
      () => {
        handleClose();
        dispatch(getViewings({}));
      }
    );
  };

  if (!rowData) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="details-modal-title"
      aria-describedby="details-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minHeight: '200px',
          minWidth: '600px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 0,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 40px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.15)'
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: '700',
              lineHeight: '26px',
              color: '#202020'
            }}
          >
            {t('Details')}
          </Typography>
        </Box>
        <Box
          sx={{
            padding: '16px 40px',
            maxHeight: '600px',
            margin: 'auto',
            flexGrow: 1
          }}
        >
          <GalleryCard item={mockedData} largeCard />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 40px',
            borderTop: '1px solid rgba(0, 0, 0, 0.15)'
          }}
        >
          <Button
            variant="text"
            onClick={handleClose}
            sx={{
              fontWeight: 400
            }}
          >
            {t('Close')}
          </Button>
          <Button
            variant="contained"
            onClick={rejectViewing}
            sx={{
              fontWeight: 400,
              bgcolor: 'red'
            }}
          >
            {t('Cancel viewing')}
          </Button>
          {rowData.status === 'rescheduled' && (
            <Button variant="contained" onClick={acceptViewing}>
              {t('Accept viewing')}
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default PropertyDetailsModal;
