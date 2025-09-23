import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { getViewings, selectViewing } from '../../../../store/slices/viewingSlice';
import { useTranslation } from 'react-i18next';
import { selectAccount } from '../../../../store/slices/accountSlice';
import MyViewingsTable from './MyViewingsTable';
import PropertyNotes from './PropertyNotes';

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3)
}));

const MyViewings = () => {
  const [showNotes, setShowNotes] = useState(false);
  const [choosedPropertyId, setChoosedPropertyId] = useState(null);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { viewings } = useSelector(selectViewing);
  const { data } = useSelector(selectAccount);
  // for now getViewings request gives all viewing (not depends on user)
  const getMyViewings = () => {
    return viewings.data.filter((item) => item.user_id === data.id);
  };

  useEffect(() => {
    dispatch(getViewings(data.id));
  }, [dispatch, data.id]);

  useEffect(() => {
    if (getMyViewings()?.length > 0) {
      // Viewings data loaded
    }
  }, [viewings]);

  const getNotesForProperty = (propertyId) => {
    setChoosedPropertyId(propertyId);
    setShowNotes(true);
  };

  return (
    <MainContent sx={{ paddingTop: '32px', paddingLeft: '42px' }}>
      {showNotes ? (
        <PropertyNotes propertyId={choosedPropertyId} rollBack={setShowNotes} userId={data.id} />
      ) : (
        <>
          <Typography variant="h6" sx={{ marginBottom: '30px' }} gutterBottom>
            {t('Requested viewings')}
          </Typography>
          <MyViewingsTable userId={data.id} showNotes={getNotesForProperty} />
        </>
      )}
    </MainContent>
  );
};

export default MyViewings;
