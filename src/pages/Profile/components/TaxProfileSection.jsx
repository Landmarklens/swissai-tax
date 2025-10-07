import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const TaxProfileSection = () => {
  const { t } = useTranslation();
  const { profile } = useSelector(state => state.account);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    filingStatus: profile?.tax?.filingStatus || 'single',
    dependents: profile?.tax?.dependents || 0,
    ahvNumber: profile?.tax?.ahvNumber || '',
    taxId: profile?.tax?.taxId || '',
    pillar3a: profile?.tax?.pillar3a || false
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      filingStatus: profile?.tax?.filingStatus || 'single',
      dependents: profile?.tax?.dependents || 0,
      ahvNumber: profile?.tax?.ahvNumber || '',
      taxId: profile?.tax?.taxId || '',
      pillar3a: profile?.tax?.pillar3a || false
    });
  };

  const handleSave = () => {
    // TODO: Dispatch Redux action to update tax profile
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
            {t('Tax Profile')}
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
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>{t('Filing Status')}</InputLabel>
              <Select
                value={formData.filingStatus}
                onChange={handleChange('filingStatus')}
                label={t('Filing Status')}
              >
                <MenuItem value="single">{t('Single')}</MenuItem>
                <MenuItem value="married">{t('Married')}</MenuItem>
                <MenuItem value="married_separately">{t('Married Filing Separately')}</MenuItem>
                <MenuItem value="widowed">{t('Widowed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('Number of Dependents')}
              type="number"
              value={formData.dependents}
              onChange={handleChange('dependents')}
              disabled={!isEditing}
              variant="outlined"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('AHV Number')}
              value={formData.ahvNumber}
              onChange={handleChange('ahvNumber')}
              disabled={!isEditing}
              variant="outlined"
              placeholder="756.XXXX.XXXX.XX"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('Tax ID (Optional)')}
              value={formData.taxId}
              onChange={handleChange('taxId')}
              disabled={!isEditing}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>{t('Pillar 3a Account')}</InputLabel>
              <Select
                value={formData.pillar3a}
                onChange={handleChange('pillar3a')}
                label={t('Pillar 3a Account')}
              >
                <MenuItem value={false}>{t('No')}</MenuItem>
                <MenuItem value={true}>{t('Yes')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TaxProfileSection;
