import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Edit,
  Close,
  TrendingUp,
  TrendingDown,
  Remove as MinusIcon
} from '@mui/icons-material';

/**
 * Document Extraction Preview Component
 * Shows AI-extracted data with editing and confirmation options
 *
 * @param {Object} props
 * @param {import('../../types/interview').ExtractedData} props.extractedData - Extracted data
 * @param {number} props.confidence - Confidence score (0-1)
 * @param {function} props.onConfirm - Callback when user confirms
 * @param {function} props.onEdit - Callback when user edits data
 * @param {function} props.onReject - Callback when user rejects
 * @param {boolean} [props.loading] - Whether still processing
 */
const DocumentExtractionPreview = ({
  extractedData,
  confidence,
  onConfirm,
  onEdit,
  onReject,
  loading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(extractedData);

  /**
   * Get confidence level and color
   */
  const getConfidenceLevel = () => {
    const confidencePercent = Math.round(confidence * 100);
    if (confidence >= 0.9) {
      return { level: 'High', color: 'success', icon: <TrendingUp /> };
    } else if (confidence >= 0.7) {
      return { level: 'Medium', color: 'warning', icon: <MinusIcon /> };
    } else {
      return { level: 'Low', color: 'error', icon: <TrendingDown /> };
    }
  };

  /**
   * Format currency value
   */
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  /**
   * Handle edit mode toggle
   */
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      onEdit(editedData);
    }
    setIsEditing(!isEditing);
  };

  /**
   * Handle field change
   */
  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle confirm
   */
  const handleConfirm = () => {
    onConfirm(isEditing ? editedData : extractedData);
  };

  /**
   * Handle reject
   */
  const handleReject = () => {
    if (window.confirm('Are you sure you want to reject this extraction? You will need to manually enter the data.')) {
      onReject();
    }
  };

  const confidenceInfo = getConfidenceLevel();

  if (loading) {
    return (
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Processing Document...
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Our AI is extracting data from your document. This may take a few moments.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ my: 2, border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Extracted Data
          </Typography>
          <Chip
            label={`${confidenceInfo.level} Confidence (${Math.round(confidence * 100)}%)`}
            color={confidenceInfo.color}
            icon={confidenceInfo.icon}
            size="small"
          />
        </Box>

        {/* Confidence Alert */}
        {confidence < 0.9 && (
          <Alert severity={confidenceInfo.color} sx={{ mb: 2 }}>
            <Typography variant="body2">
              {confidence < 0.7
                ? 'Low confidence extraction. Please review carefully and make corrections if needed.'
                : 'Medium confidence extraction. Please verify the extracted data is correct.'}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Extracted Fields */}
        <Grid container spacing={2}>
          {Object.entries(extractedData).map(([key, value]) => {
            // Skip metadata and confidence fields
            if (key === 'metadata' || key === 'confidence') return null;

            const label = key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());

            return (
              <Grid item xs={12} sm={6} key={key}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    {label}
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData[key] || ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      type={typeof value === 'number' ? 'number' : 'text'}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={500}>
                      {typeof value === 'number' && key.includes('amount')
                        ? formatCurrency(value)
                        : value || '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Metadata (if exists) */}
        {extractedData.metadata && Object.keys(extractedData.metadata).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Additional Information
            </Typography>
            <Box sx={{ mt: 1 }}>
              {Object.entries(extractedData.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="error"
            startIcon={<Close />}
            onClick={handleReject}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEditToggle}
            disabled={loading}
          >
            {isEditing ? 'Save Changes' : 'Edit'}
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleConfirm}
            disabled={loading}
          >
            Confirm & Continue
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DocumentExtractionPreview;
