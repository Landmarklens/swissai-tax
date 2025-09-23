import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, CircularProgress } from '@mui/material';
import MyPropertiesBox from './MyPropertiesBox';
import { styled } from '@mui/material/styles';
import { fetchProperties, selectProperties } from '../../../../store/slices/propertiesSlice';
import { useTranslation } from 'react-i18next';

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3)
}));

const MyProperties = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { properties } = useSelector(selectProperties);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (properties.length > 0) {
      // Properties data loaded
    }
  }, [properties]);
  return (
    <MainContent sx={{ paddingTop: '32px', paddingLeft: '42px' }}>
      <Typography variant="h4" sx={{ marginBottom: '30px' }} gutterBottom>
        {t('My Properties')}
      </Typography>
      <MyPropertiesBox properties={properties.data} />
    </MainContent>
  );
};

export default MyProperties;
