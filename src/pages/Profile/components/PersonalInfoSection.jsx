import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const PersonalInfoSection = () => {
  const { t } = useTranslation();
  const { data: profile } = useSelector(state => state.account);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    municipality: profile?.municipality || '',
    postalCode: profile?.postal_code || '',
    canton: profile?.canton || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original profile data
    setFormData({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      municipality: profile?.municipality || '',
      postalCode: profile?.postal_code || '',
      canton: profile?.canton || ''
    });
  };

  const handleSave = () => {
    // TODO: Dispatch Redux action to update profile
    setIsEditing(false);
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            {t('Personal Information')}
          </Typography>
          {!isEditing ? (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={handleEdit}
            >
              {t('Edit')}
            </Button>
          ) : (
            <Box display="flex" gap={1}>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                size="small"
                onClick={handleSave}
              >
                {t('Save')}
              </Button>
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                size="small"
                onClick={handleCancel}
              >
                {t('Cancel')}
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('First Name')}
              value={formData.firstName}
              onChange={handleChange('firstName')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('Last Name')}
              value={formData.lastName}
              onChange={handleChange('lastName')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('Email')}
              type="email"
              value={profile?.email || ''}
              disabled={true}
              variant="outlined"
              helperText={t('Email cannot be changed')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('Phone')}
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('Address')}
              value={formData.address}
              onChange={handleChange('address')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('Municipality')}
              value={formData.municipality}
              onChange={handleChange('municipality')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('Postal Code')}
              value={formData.postalCode}
              onChange={handleChange('postalCode')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('Canton')}
              value={formData.canton}
              onChange={handleChange('canton')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;
