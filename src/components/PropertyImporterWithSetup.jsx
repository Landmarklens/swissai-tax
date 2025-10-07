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
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Link as LinkIcon,
  CloudDownload as ImportIcon,
  ContentPaste as PasteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  HelpOutline as HelpOutlineIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImportJobProgress from './ImportJobProgress';
import { getApiUrl } from '../utils/api/getApiUrl';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';
import { tenantSelectionAPI } from '../api/tenantSelectionApi';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { fetchProperties } from '../store/slices/propertiesSlice';

/**
 * Enhanced Property Importer with integrated Tenant Selection Setup
 * This follows the same flow as manual property creation
 */
const PropertyImporterWithSetup = ({ onPropertyImported, onClose, embedded = false, onFormStateChange }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Import Property', 'Property Details', 'Tenant Selection Setup', 'Viewing Schedule', 'Email Setup', 'Complete'];
  
  // Import state
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [error, setError] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [importedPropertyId, setImportedPropertyId] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  
  // Email Setup state
  const [emailSetupData, setEmailSetupData] = useState({
    managedEmail: '',
    emailProvider: '',
    forwardingConfirmed: false
  });
  
  // Tenant Selection Setup state
  const [tenantSelectionData, setTenantSelectionData] = useState({
    // Basic criteria
    petsAllowed: false,
    smokingAllowed: false,
    affordabilityCriteria: '3x monthly rent',
    maxOccupants: 4,
    
    // AI Instructions
    aiInstructions: `You are a professional property rental assistant. Your goal is to attract and select responsible, organized tenants who provide complete documentation promptly.

TENANT SELECTION PRIORITIES:
- Prioritize applicants who respond quickly with complete information
- Favor tenants who ask thoughtful, specific questions about the property
- Give preference to those who provide all documents within 24-48 hours
- Look for signs of organization and attention to detail in communications

RESPONSE GUIDELINES:
- Be professional, friendly, and responsive
- Emphasize the importance of complete documentation
- Set clear expectations about viewing times and application process
- Respond to inquiries within 2-4 hours during business hours`,
    
    // Viewing slots - Initialize with one default slot
    viewingSlots: [
      {
        date: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 7); // Default to 1 week from now
          return tomorrow.toISOString().split('T')[0];
        })(),
        startTime: '14:00',
        endTime: '18:00',
        slotDuration: 15,
        maxViewersPerSlot: 1
      }
    ],
    
    // Communication settings
    emailNotifications: true,
    autoResponseEnabled: true,
    responseTime: '2-4 hours',
    
    // Knowledge documents
    knowledgeDocuments: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        activeStep,
        onStartImport: handleStartImport
      });
    }
  }, [embedded, isValidUrl, isCreatingJob, currentJob, activeStep, onFormStateChange]);

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
          timeout: 30000
        }
      );


      if (response.data.success) {
        if (response.data.import_job) {
          setCurrentJob(response.data.import_job);
        } else if (response.data.property) {
          // Immediate import
          handleJobComplete(response.data.property.id);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Failed to create import job');
      }
    } catch (error) {
      console.error('[PropertyImporter] Error creating import job:', error);
      let errorMessage = 'Failed to start import';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleJobComplete = async (propertyId, jobData) => {
    setImportedPropertyId(propertyId);

    // Add a small delay to ensure the property is saved in the backend
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to fetch property details with retry logic
    let importedProperty = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!importedProperty && retryCount < maxRetries) {
      try {
        // Fetch all properties to get the newly imported one
        const propertiesResult = await dispatch(fetchProperties(true)).unwrap();

        // Log first few properties to see structure
        if (propertiesResult?.length > 0) {
        }

        // Find the imported property by ID
        importedProperty = propertiesResult?.find(p => {
          const pId = String(p.id);
          const targetId = String(propertyId);
          return pId === targetId;
        });

        if (!importedProperty && retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`[PropertyImporter] Error fetching properties (attempt ${retryCount + 1}):`, error);
      }
      retryCount++;
    }

    try {
      if (importedProperty) {

        // Map the property data to our expected format
        const mappedDetails = {
          id: importedProperty.id,
          title: importedProperty.title || importedProperty.name || 'Imported Property',
          description: importedProperty.description || '',
          // Construct address from available fields if not directly provided
          address: importedProperty.address || importedProperty.street ||
                   (importedProperty.title ? importedProperty.title.split(' - ')[0] : '') || '',
          city: importedProperty.city || '',
          // Fix: Use zip_code field which is what the API returns
          zip: importedProperty.zip_code || importedProperty.zip || importedProperty.postal_code || '',
          // Ensure price is properly mapped - price_chf is the standard field
          price_chf: importedProperty.price_chf || importedProperty.price || importedProperty.rent || 0,
          price: importedProperty.price || importedProperty.price_chf || 0,
          // Fix: bedrooms is the actual field, not rooms
          rooms: importedProperty.bedrooms || importedProperty.rooms || '',
          // Fix: Use square_meters field which is what the API returns
          size_m2: importedProperty.square_meters || importedProperty.size_m2 || importedProperty.size || importedProperty.area || '',
          // Use primary_image_urls which is the actual field from the API - ensure it's an array
          images: importedProperty.primary_image_urls || importedProperty.images || importedProperty.image_urls || [],
          features: importedProperty.features || importedProperty.amenities || [],
          source_url: importedProperty.external_url || importedProperty.source_url || importedProperty.listing_url || url || '',
          managed_email: importedProperty.managed_email || `listing-${importedProperty.id}@listings.homeai.ch`,
          status: importedProperty.status || 'draft',
          // Don't spread all properties to avoid overwriting mapped fields
          external_url: importedProperty.external_url,
          primary_image_urls: importedProperty.primary_image_urls,
          // Keep original fields for reference
          square_meters: importedProperty.square_meters,
          bedrooms: importedProperty.bedrooms,
          zip_code: importedProperty.zip_code
        };

        setPropertyDetails(mappedDetails);
      } else {
        // Try tenant selection config as fallback
        try {
          const configResponse = await tenantSelectionAPI.getConfig(propertyId);
          if (configResponse.data && configResponse.data.property) {
            setPropertyDetails(configResponse.data.property);
          } else {
            throw new Error('No property data in config');
          }
        } catch (configError) {
          setPropertyDetails({
            id: propertyId,
            title: jobData?.title || 'Imported Property',
            description: jobData?.description || 'Property successfully imported.',
            address: jobData?.address || '',
            price_chf: jobData?.price_chf || jobData?.price || jobData?.rent || '',
            rooms: jobData?.rooms || jobData?.bedrooms || '',
            size_m2: jobData?.size_m2 || jobData?.size || '',
            images: jobData?.primary_image_urls || jobData?.images || [],
            source_url: jobData?.external_url || url || jobData?.source_url || '',
            managed_email: `listing-${propertyId}@listings.homeai.ch`,
            ...jobData
          });
        }
      }
    } catch (error) {
      console.error('[PropertyImporter] Failed to fetch property details:', error);
      // Set minimal property details even if fetch fails
      setPropertyDetails({
        id: propertyId,
        title: jobData?.title || 'Imported Property #' + propertyId,
        description: jobData?.description || 'Property successfully imported. Details are being processed.',
        address: jobData?.address || '',
        price_chf: jobData?.price_chf || jobData?.price || '',
        rooms: jobData?.rooms || jobData?.bedrooms || '',
        size_m2: jobData?.size_m2 || jobData?.size || '',
        images: jobData?.primary_image_urls || jobData?.images || [],
        source_url: jobData?.external_url || url || '',
        managed_email: `listing-${propertyId}@listings.homeai.ch`,
        ...jobData
      });
    }

    setActiveStep(1); // Move to property details step
  };

  const handleJobError = (errorMessage) => {
    console.error('[PropertyImporter] Import job failed:', errorMessage);
    setError(errorMessage);
  };

  const handleAddViewingSlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newSlot = {
      date: tomorrow.toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '18:00',
      slotDuration: 15,
      maxViewersPerSlot: 1
    };
    
    setTenantSelectionData({
      ...tenantSelectionData,
      viewingSlots: [...tenantSelectionData.viewingSlots, newSlot]
    });
  };

  const handleRemoveViewingSlot = (index) => {
    const newSlots = tenantSelectionData.viewingSlots.filter((_, i) => i !== index);
    setTenantSelectionData({
      ...tenantSelectionData,
      viewingSlots: newSlots
    });
  };

  const handleUpdateViewingSlot = (index, field, value) => {
    const newSlots = [...tenantSelectionData.viewingSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setTenantSelectionData({
      ...tenantSelectionData,
      viewingSlots: newSlots
    });
  };

  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDocs = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));
    
    setTenantSelectionData({
      ...tenantSelectionData,
      knowledgeDocuments: [...tenantSelectionData.knowledgeDocuments, ...newDocs]
    });
  };

  const handleRemoveDocument = (index) => {
    const newDocs = tenantSelectionData.knowledgeDocuments.filter((_, i) => i !== index);
    setTenantSelectionData({
      ...tenantSelectionData,
      knowledgeDocuments: newDocs
    });
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0: // Import step
        return importedPropertyId !== null;
      case 1: // Property details step
        return true; // Just viewing, always valid
      case 2: // Tenant selection setup
        return tenantSelectionData.aiInstructions.length > 0;
      case 3: // Viewing schedule
        return tenantSelectionData.viewingSlots.length > 0; // At least one viewing slot required
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 2) {
        // Submit tenant selection setup
        handleSubmitSetup();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } else {
      // Show specific validation messages
      if (activeStep === 3 && tenantSelectionData.viewingSlots.length === 0) {
        toast.warning(t('Please add at least one viewing slot'));
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmitSetup = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare viewing schedule data if slots are defined
      let viewingScheduleData = null;
      if (tenantSelectionData.viewingSlots.length > 0) {
        viewingScheduleData = {
          slots: tenantSelectionData.viewingSlots.map(slot => ({
            date: slot.date,
            start_time: slot.startTime,
            end_time: slot.endTime,
            duration_minutes: slot.slotDuration,
            max_attendees: slot.maxViewersPerSlot
          })),
          total_slots: tenantSelectionData.viewingSlots.length,
          max_total_invites: 50,
          allocation_method: 'FIRST_COME'
        };
      }

      // Prepare the setup data according to backend schema
      const setupData = {
        property_id: importedPropertyId,
        max_viewing_invites: 20,
        hard_criteria: {
          affordability: {
            min_income_ratio: 3,
            max_rent_ratio: 0.33
          },
          occupancy: {
            max_persons: tenantSelectionData.maxOccupants
          },
          house_rules: {
            pets_allowed: tenantSelectionData.petsAllowed,
            smoking_allowed: tenantSelectionData.smokingAllowed
          },
          required_documents: ['ID', 'Income Proof', 'References']
        },
        soft_criteria: {
          employment_stability: {
            weight: 0.3,
            min_duration_months: 6
          },
          application_quality: {
            weight: 0.2,
            completeness_threshold: 0.8
          }
        },
        viewing_schedule: viewingScheduleData, // Include viewing schedule in setup
        ai_instructions: tenantSelectionData.aiInstructions,
        ai_response_settings: {
          auto_respond: tenantSelectionData.autoResponseEnabled,
          response_time: tenantSelectionData.responseTime,
          email_notifications: tenantSelectionData.emailNotifications
        }
      };

      // Create tenant selection config (property_id is included in setupData)
      const response = await tenantSelectionAPI.setupTenantSelection(setupData);
      
      if (response.data) {
        // Upload knowledge documents if any
        if (tenantSelectionData.knowledgeDocuments.length > 0) {
          for (const doc of tenantSelectionData.knowledgeDocuments) {
            const formData = new FormData();
            formData.append('file', doc.file);
            formData.append('document_name', doc.name);
            
            try {
              await axios.post(
                `${getApiUrl()}/api/tenant-selection/config/${importedPropertyId}/knowledge-documents`,
                formData,
                {
                  headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'multipart/form-data'
                  }
                }
              );
            } catch (uploadError) {
              console.error('Failed to upload document:', doc.name, uploadError);
            }
          }
        }

        // Viewing schedule is now created as part of the setup call above
        // No need for separate API call

        // Move to complete step (now step 4)
        setActiveStep(4);
        toast.success(t('Property imported and tenant selection configured successfully!'));
        
        // Fetch the complete property data to pass to parent
        try {
          const propertyResponse = await axios.get(
            `${getApiUrl()}/property/${importedPropertyId}`,
            {
              headers: {
                Authorization: `Bearer ${authService.getToken()}`
              }
            }
          );
          
          // Notify parent after a delay with full property data
          setTimeout(() => {
            onPropertyImported?.(propertyResponse.data);
            onClose?.();
          }, 2000);
        } catch (fetchError) {
          console.error('Failed to fetch property details:', fetchError);
          // Fall back to passing minimal data
          setTimeout(() => {
            onPropertyImported?.({
              id: importedPropertyId,
              imported: true,
              setupComplete: true
            });
            onClose?.();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to setup tenant selection:', error);
      setError(error.response?.data?.detail || 'Failed to setup tenant selection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderImportStep = () => {
    if (currentJob && !importedPropertyId) {
      return (
        <ImportJobProgress
          jobId={currentJob.id}
          onComplete={handleJobComplete}
          onError={handleJobError}
          onCancel={() => setCurrentJob(null)}
        />
      );
    }

    return (
      <Box>
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              {t('Supported Platforms')}:
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

        <TextField
          fullWidth
          label={t('Property Listing URL')}
          placeholder="https://www.homegate.ch/mieten/123456"
          value={url}
          onChange={handleUrlChange}
          error={!!(url && !isValidUrl)}
          helperText={
            url && !isValidUrl 
              ? t('Please enter a valid URL from a supported platform')
              : t('Paste the complete URL from the property listing page')
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
                  {t('Paste')}
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleStartImport}
          disabled={!isValidUrl || isCreatingJob}
          startIcon={<ImportIcon />}
        >
          {isCreatingJob ? t('Starting Import...') : t('Import Property')}
        </Button>
      </Box>
    );
  };

  const renderPropertyDetails = () => {
    if (!propertyDetails) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('Property Details Review')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('Please review the imported property details and images')}
        </Typography>

        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* Property Images */}
            {propertyDetails.images && propertyDetails.images.length > 0 ? (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('Property Images')}
                </Typography>
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1,
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 4,
                  }
                }}>
                  {propertyDetails.images.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        minWidth: 200,
                        height: 150,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <img
                        src={typeof image === 'string' ? image : (image.url || image.src || '')}
                        alt={`Property ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    textAlign: 'center',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('No images available for this property')}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Property Title and Address */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('Title')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {propertyDetails.title || t('No title available')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('Address')}
              </Typography>
              <Typography variant="body1">
                {propertyDetails.address || propertyDetails.street || t('No address available')}
                {propertyDetails.zip && propertyDetails.city && (
                  <>, {propertyDetails.zip} {propertyDetails.city}</>
                )}
              </Typography>
            </Grid>

            {/* Property Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('Rent')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                CHF {Number(propertyDetails.price_chf || propertyDetails.price || propertyDetails.rent || 0).toLocaleString('de-CH')} / {t('month')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('Rooms')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {propertyDetails.rooms || propertyDetails.bedrooms || t('Not specified')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                {t('Size')}
              </Typography>
              <Typography variant="body1">
                {propertyDetails.size_m2 || propertyDetails.area ?
                  `${propertyDetails.size_m2 || propertyDetails.area} m²` :
                  t('Not specified')}
              </Typography>
            </Grid>

            {/* Description */}
            {propertyDetails.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('Description')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    maxHeight: 200,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {propertyDetails.description}
                </Typography>
              </Grid>
            )}

            {/* Additional Features */}
            {propertyDetails.features && propertyDetails.features.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('Features')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {propertyDetails.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Source URL */}
            {propertyDetails.source_url && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('Source')}
                </Typography>
                <Typography
                  variant="body2"
                  component="a"
                  href={propertyDetails.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {t('View original listing')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Info Alert */}
        <Alert severity="info" icon={<CheckCircleIcon />}>
          {t('The property has been successfully imported. Click "Next" to proceed with setting up tenant selection.')}
        </Alert>
      </Box>
    );
  };

  const renderTenantSelectionSetup = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Tenant Selection Criteria')}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={tenantSelectionData.petsAllowed}
                onChange={(e) => setTenantSelectionData({
                  ...tenantSelectionData,
                  petsAllowed: e.target.checked
                })}
              />
            }
            label={t('Pets Allowed')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={tenantSelectionData.smokingAllowed}
                onChange={(e) => setTenantSelectionData({
                  ...tenantSelectionData,
                  smokingAllowed: e.target.checked
                })}
              />
            }
            label={t('Smoking Allowed')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label={t('Max Occupants')}
            value={tenantSelectionData.maxOccupants}
            onChange={(e) => setTenantSelectionData({
              ...tenantSelectionData,
              maxOccupants: parseInt(e.target.value)
            })}
            inputProps={{ min: 1, max: 10 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('Affordability Criteria')}
            value={tenantSelectionData.affordabilityCriteria}
            onChange={(e) => setTenantSelectionData({
              ...tenantSelectionData,
              affordabilityCriteria: e.target.value
            })}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            {t('AI Instructions')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('AI System Prompt')}
            value={tenantSelectionData.aiInstructions}
            onChange={(e) => setTenantSelectionData({
              ...tenantSelectionData,
              aiInstructions: e.target.value
            })}
            helperText={t('Define how AI should behave and what type of tenants to prioritize')}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            {t('Knowledge Documents')}
          </Typography>
          <input
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            id="knowledge-document-upload"
            multiple
            type="file"
            onChange={handleDocumentUpload}
          />
          <label htmlFor="knowledge-document-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadFileIcon />}
            >
              {t('Upload Documents')}
            </Button>
          </label>
          
          {tenantSelectionData.knowledgeDocuments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {tenantSelectionData.knowledgeDocuments.map((doc, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 1, p: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">{doc.name}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveDocument(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            {t('Communication Settings')}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={tenantSelectionData.autoResponseEnabled}
                onChange={(e) => setTenantSelectionData({
                  ...tenantSelectionData,
                  autoResponseEnabled: e.target.checked
                })}
              />
            }
            label={t('Enable AI Auto-responses')}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderViewingSchedule = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Viewing Schedule')}
      </Typography>
      
      {tenantSelectionData.viewingSlots.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('At least one viewing slot is required. Click "Add Time Slot" below.')}
        </Alert>
      )}
      
      {tenantSelectionData.viewingSlots.map((slot, index) => (
        <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('Time Slot')} {index + 1}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label={t('Date')}
                value={slot.date}
                onChange={(e) => handleUpdateViewingSlot(index, 'date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                  min: new Date().toISOString().split('T')[0]
                }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                type="time"
                label={t('Start Time')}
                value={slot.startTime}
                onChange={(e) => handleUpdateViewingSlot(index, 'startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                type="time"
                label={t('End Time')}
                value={slot.endTime}
                onChange={(e) => handleUpdateViewingSlot(index, 'endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                type="number"
                label={t('Duration (min)')}
                value={slot.slotDuration}
                onChange={(e) => handleUpdateViewingSlot(index, 'slotDuration', parseInt(e.target.value))}
                inputProps={{ min: 5, max: 120, step: 5 }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                type="number"
                label={t('Max Viewers')}
                value={slot.maxViewersPerSlot}
                onChange={(e) => handleUpdateViewingSlot(index, 'maxViewersPerSlot', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton
                color="error"
                onClick={() => handleRemoveViewingSlot(index)}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Card>
      ))}
      
      <Button
        variant="outlined"
        onClick={handleAddViewingSlot}
        startIcon={<AddIcon />}
      >
        {t('Add Time Slot')}
      </Button>
    </Box>
  );

  const renderEmailSetup = () => {
    const managedEmail = importedPropertyId ? `listing-${importedPropertyId}@listings.homeai.ch` : '';
    
    const handleCopyEmail = () => {
      navigator.clipboard.writeText(managedEmail);
      toast.success('Email address copied to clipboard!');
    };
    
    const getProviderInstructions = (provider) => {
      const instructions = {
        gmail: {
          name: 'Gmail',
          steps: [
            'Open Gmail settings (gear icon → See all settings)',
            'Go to "Forwarding and POP/IMAP" tab',
            'Click "Add a forwarding address"',
            `Enter: ${managedEmail}`,
            'Click "Next" → "Proceed" → "OK"',
            'Select "Forward a copy of incoming mail to" and choose the address',
            'Choose what to do with Gmail\'s copy (recommend: "Keep Gmail\'s copy in Inbox")',
            'Save changes at the bottom of the page'
          ]
        },
        outlook: {
          name: 'Outlook/Hotmail',
          steps: [
            'Go to Settings (gear icon) → View all Outlook settings',
            'Select "Mail" → "Forwarding"',
            'Enable forwarding',
            `Enter forwarding address: ${managedEmail}`,
            'Choose "Keep a copy of forwarded messages"',
            'Save your changes'
          ]
        },
        yahoo: {
          name: 'Yahoo Mail',
          steps: [
            'Click Settings (gear icon) → More Settings',
            'Select "Mailboxes" → Your email account',
            'In "Forwarding" section, enter the forwarding address',
            `Add: ${managedEmail}`,
            'Click "Verify"',
            'Save your settings'
          ]
        },
        apple: {
          name: 'iCloud Mail',
          steps: [
            'Sign in to iCloud.com',
            'Open Mail and click the gear icon',
            'Choose "Preferences" → "General"',
            'Select "Forward my email to:"',
            `Enter: ${managedEmail}`,
            'Choose "Delete messages after forwarding" or keep a copy',
            'Click "Done"'
          ]
        },
        other: {
          name: 'Other Email Providers',
          steps: [
            'Log in to your email account',
            'Navigate to Settings or Preferences',
            'Look for "Forwarding", "Mail Forwarding", or "Email Forwarding"',
            `Add forwarding address: ${managedEmail}`,
            'Verify the forwarding address if required',
            'Enable forwarding and save your settings'
          ]
        }
      };
      
      return instructions[provider] || instructions.other;
    };
    
    const currentInstructions = getProviderInstructions(emailSetupData.emailProvider || 'other');
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('Email Forwarding Setup')}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('Configure your email to forward tenant applications to our system for automatic processing.')}
          </Typography>
        </Alert>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            {t('Your Managed Email Address')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              value={managedEmail}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Copy to clipboard">
                      <IconButton onClick={handleCopyEmail} edge="end">
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t('Use this email address when listing your property on portals like Homegate.ch, Flatfox.ch, or ImmoScout24.ch')}
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            {t('Setup Email Forwarding')}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('Select Your Email Provider')}</InputLabel>
            <Select
              value={emailSetupData.emailProvider || ''}
              onChange={(e) => setEmailSetupData(prev => ({ ...prev, emailProvider: e.target.value }))}
              label={t('Select Your Email Provider')}
            >
              <MenuItem value="gmail">Gmail</MenuItem>
              <MenuItem value="outlook">Outlook/Hotmail</MenuItem>
              <MenuItem value="yahoo">Yahoo Mail</MenuItem>
              <MenuItem value="apple">iCloud Mail</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          
          {emailSetupData.emailProvider && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                {t('Instructions for')} {currentInstructions.name}:
              </Typography>
              <List dense>
                {currentInstructions.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body2">
                          {step}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{t('Important:')}</strong> {t('After setting up forwarding, all emails sent to your listing email will be automatically forwarded to our system for processing.')}
                </Typography>
              </Alert>
            </Box>
          )}
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            {t('Confirmation')}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={emailSetupData.forwardingConfirmed || false}
                onChange={(e) => setEmailSetupData(prev => ({ ...prev, forwardingConfirmed: e.target.checked }))}
              />
            }
            label={t('I have set up email forwarding as instructed')}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {t('Please confirm that you have configured email forwarding in your email account.')}
          </Typography>
        </Paper>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>{t('What happens next:')}</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={t('Update your property listings')}
                secondary={t('Use the managed email address as the contact email on all listing portals')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={t('Automatic processing')}
                secondary={t('All tenant applications will be automatically processed and appear in your Messages')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={t('AI-powered screening')}
                secondary={t('Applications will be scored and ranked based on your criteria')}
              />
            </ListItem>
          </List>
        </Alert>
      </Box>
    );
  };

  const renderComplete = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {t('Setup Complete!')}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t('Your property has been imported and tenant selection is configured.')}
      </Typography>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderImportStep();
      case 1:
        return renderPropertyDetails();
      case 2:
        return renderTenantSelectionSetup();
      case 3:
        return renderViewingSchedule();
      case 4:
        return renderEmailSetup();
      case 5:
        return renderComplete();
      default:
        return null;
    }
  };

  const content = (
    <>
      {!embedded && (
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ImportIcon color="primary" />
            {t('Import Property & Setup Tenant Selection')}
          </Box>
        </DialogTitle>
      )}
      <DialogContent>
        <Box sx={{ mt: embedded ? 0 : 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent()}
        </Box>
      </DialogContent>
      {/* Navigation buttons with better layout */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: 2, 
        px: 3,
        pb: 3,
        pt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 2,
        bgcolor: 'background.paper'
      }}>
        {/* Left side - Cancel button */}
        <Button 
          onClick={activeStep > 0 ? handleBack : onClose} 
          disabled={isSubmitting}
          size="large"
          variant="outlined"
          color="inherit"
        >
          {activeStep > 0 ? t('Back') : t('Cancel')}
        </Button>
        
        {/* Right side - Continue/Complete button */}
        <Box>
          {activeStep < 5 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !importedPropertyId) ||
                (activeStep === 4 && !emailSetupData.forwardingConfirmed) || // Email setup is step 4
                isSubmitting
              }
              size="large"
              sx={{ minWidth: 120 }}
            >
              {activeStep === 4 ?
                (isSubmitting ? t('Completing...') : t('Complete')) :
                t('Continue')
              }
            </Button>
          )}
          {activeStep === 5 && (
            <Button
              variant="contained"
              onClick={onClose}
              size="large"
              color="success"
              sx={{ minWidth: 120 }}
            >
              {t('Done')}
            </Button>
          )}
        </Box>
      </Box>
    </>
  );

  return embedded ? (
    content
  ) : (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      {content}
    </Dialog>
  );
};

export default PropertyImporterWithSetup;