import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OCRPreview = ({ open, onClose, document, onSave }) => {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(document?.ocrData || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Update editedData when document changes
  useEffect(() => {
    if (document?.ocrData && !editMode) {
      setEditedData(document.ocrData);
    }
  }, [document, editMode]);

  const handleEdit = () => {
    setEditMode(true);
    setEditedData(document.ocrData || {});
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(document.id, editedData);
      setEditMode(false);
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save OCR data:', err);
      }
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedData(document.ocrData || {});
  };

  if (!document) return null;

  const renderField = (key, value) => {
    const fieldLabels = {
      grossSalary: t('Gross Salary'),
      taxWithheld: t('Tax Withheld'),
      employer: t('Employer'),
      employerAddress: t('Employer Address'),
      employeeId: t('Employee ID'),
      socialSecurityContributions: t('Social Security Contributions'),
      pensionContributions: t('Pension Contributions'),
      healthInsurance: t('Health Insurance'),
      amount: t('Amount'),
      date: t('Date'),
      reference: t('Reference Number'),
      accountNumber: t('Account Number'),
      iban: t('IBAN'),
      bic: t('BIC')
    };

    const label = fieldLabels[key] || key;
    const isNumeric = typeof value === 'number';

    return editMode ? (
      <TextField
        fullWidth
        label={label}
        value={editedData[key] || ''}
        onChange={(e) => handleChange(key, isNumeric ? parseFloat(e.target.value) : e.target.value)}
        type={isNumeric ? 'number' : 'text'}
        variant="outlined"
        size="small"
      />
    ) : (
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {isNumeric ? `CHF ${value.toLocaleString('de-CH')}` : value}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {t('OCR Results')} - {document.fileName}
          </Typography>
          {!editMode && (
            <Button
              startIcon={<EditIcon />}
              onClick={handleEdit}
              variant="outlined"
              size="small"
            >
              {t('Edit')}
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          {editMode
            ? t('Review and correct the extracted data below')
            : t('Please verify the extracted data is correct')}
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {document.ocrData ? (
          <Grid container spacing={3}>
            {Object.entries(document.ocrData).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={`${document.id}-field-${key}`}>
                {renderField(key, value)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('Processing document...')}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary">
          {t('Document Type')}: {document.type}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          {t('Upload Date')}: {new Date(document.uploadedAt).toLocaleString()}
        </Typography>
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button
              onClick={handleCancel}
              disabled={saving}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? t('Saving...') : t('Save')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} startIcon={<CloseIcon />}>
              {t('Close')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OCRPreview;
