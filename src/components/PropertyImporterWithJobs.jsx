import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Link as LinkIcon,
  CloudDownload as ImportIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImportJobProgress from './ImportJobProgress';
import { getApiUrl } from '../utils/api/getApiUrl';
import authService from '../services/authService';
import { toast } from 'react-toastify';

/**
 * Updated Property Importer that uses the new job-based async import system
 * 
 * This replaces the old approach that created placeholder properties immediately.
 * Now it:
 * 1. Creates an import job
 * 2. Shows real-time progress via SSE
 * 3. Only shows the property after it's fully imported
 */
const PropertyImporterWithJobs = ({ onPropertyImported, onClose, embedded = false, onFormStateChange }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [error, setError] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Supported platforms
  const supportedPlatforms = [
    { name: 'Homegate', domain: 'homegate.ch', example: 'https://www.homegate.ch/mieten/123456' },
    { name: 'ImmoScout24', domain: 'immoscout24.ch', example: 'https://www.immoscout24.ch/en/d/flat-rent-zurich/123456' },
    { name: 'Flatfox', domain: 'flatfox.ch', example: 'https://flatfox.ch/en/flat/123456' }
  ];

  // Notify parent of form state when embedded
  useEffect(() => {
    if (embedded && onFormStateChange) {
      onFormStateChange({
        isValidUrl,
        isCreatingJob,
        currentJob,
        onStartImport: handleStartImport
      });
    }
  }, [embedded, isValidUrl, isCreatingJob, currentJob, onFormStateChange]);

  const validateUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      const isSupported = supportedPlatforms.some(platform => 
        urlObj.hostname.includes(platform.domain)
      );
      setIsValidUrl(isSupported);
      return isSupported;
    } catch {
      setIsValidUrl(false);
      return false;
    }
  };

  const handleUrlChange = (event) => {
    const newUrl = event.target.value;
    setUrl(newUrl);
    if (newUrl) {
      validateUrl(newUrl);
    } else {
      setIsValidUrl(false);
    }
    setError(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        validateUrl(text);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const handleStartImport = async () => {
    if (!isValidUrl) return;

    setIsCreatingJob(true);
    setError(null);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await axios.post(
        `${getApiUrl()}/api/tenant-selection/import-property`,
        { url },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // 30 second timeout for job creation
        }
      );

      console.log('[PropertyImporter] Import response:', response.data);

      if (response.data.success) {
        // Handle new job-based response format
        if (response.data.import_job) {
          setCurrentJob(response.data.import_job);
        }
        // Handle old immediate import format (backward compatibility)
        else if (response.data.property) {
          console.log('[PropertyImporter] Received old format - property imported immediately:', response.data.property.id);
          // Call success handler directly for immediate import
          onPropertyImported?.({
            id: response.data.property.id,
            imported: true,
            immediate: true
          });
          
          // Close the import dialog after a short delay
          setTimeout(() => {
            onClose?.();
          }, 2000);
          return;
        } else {
          throw new Error('Invalid response format - no import_job or property found');
        }
      } else {
        throw new Error('Failed to create import job');
      }
    } catch (error) {
      console.error('[PropertyImporter] Error creating import job:', error);
      let errorMessage = 'Failed to start import';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid URL or unsupported platform';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleJobComplete = (propertyId) => {
    console.log('[PropertyImporter] Import completed successfully:', propertyId);
    
    // Show success message with toast
    toast.success('Property imported successfully! Redirecting to your properties...');
    
    // Notify parent component
    onPropertyImported?.({
      id: propertyId,
      imported: true,
      importJobId: currentJob.id
    });
    
    // Navigate to properties list and refresh after a short delay
    setTimeout(() => {
      // Refresh the properties list
      window.location.href = '/owner-account?section=listing';
    }, 1500);
  };

  const handleJobError = (errorMessage) => {
    console.error('[PropertyImporter] Import job failed:', errorMessage);
    setError(errorMessage);
  };

  const handleCancelJob = () => {
    // TODO: Implement job cancellation API call
    setCurrentJob(null);
    setUrl('');
    setError(null);
  };

  const handleClose = () => {
    if (currentJob && ['pending', 'processing', 'downloading', 'parsing', 'saving'].includes(currentJob.status)) {
      if (window.confirm('Import is in progress. Are you sure you want to close? The import will continue in the background.')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  // If we have an active job, show progress
  if (currentJob) {
    const progressContent = (
      <>
        {!embedded && (
          <DialogTitle>
            Property Import in Progress
          </DialogTitle>
        )}
        <DialogContent>
          <ImportJobProgress
            jobId={currentJob.id}
            onComplete={handleJobComplete}
            onError={handleJobError}
            onCancel={handleCancelJob}
          />
        </DialogContent>
        {!embedded && (
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        )}
      </>
    );

    return embedded ? (
      progressContent
    ) : (
      <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
        {progressContent}
      </Dialog>
    );
  }

  // Otherwise, show import form
  const formContent = (
    <>
      {!embedded && (
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ImportIcon color="primary" />
            Import Property from URL
          </Box>
        </DialogTitle>
      )}
      <DialogContent>
        <Box sx={{ mt: embedded ? 0 : 2 }}>
          {/* Supported Platforms */}
          <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Supported Platforms:
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {supportedPlatforms.map((platform) => (
                  <Paper
                    key={platform.name}
                    sx={{ 
                      p: 1, 
                      bgcolor: 'primary.50',
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}
                  >
                    <Typography variant="caption" color="primary">
                      {platform.name}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* URL Input */}
          <TextField
            fullWidth
            label="Property Listing URL"
            placeholder="https://www.homegate.ch/mieten/123456"
            value={url}
            onChange={handleUrlChange}
            error={!!(url && !isValidUrl)}
            helperText={
              url && !isValidUrl 
                ? "Please enter a valid URL from a supported platform" 
                : "Paste the complete URL from the property listing page"
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon color={isValidUrl ? 'primary' : 'disabled'} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handlePasteFromClipboard}
                    startIcon={<PasteIcon />}
                  >
                    Paste
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Import Process Info */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Import Process:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              • Property data will be downloaded and processed (2-3 minutes)
              • You'll see real-time progress updates
              • The property will appear in your list when complete
              • You can safely close this window - import will continue in background
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      {!embedded && (
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStartImport}
            disabled={!isValidUrl || isCreatingJob}
            startIcon={<ImportIcon />}
          >
            {isCreatingJob ? 'Starting Import...' : 'Start Import'}
          </Button>
        </DialogActions>
      )}
    </>
  );

  return embedded ? (
    formContent
  ) : (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      {formContent}
    </Dialog>
  );
};

export default PropertyImporterWithJobs;