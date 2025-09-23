import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  Link as LinkIcon,
  Home as HomeIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { importPropertyFromURL } from '../../../../store/slices/tenantSelectionSlice';

const SUPPORTED_PORTALS = [
  { value: 'auto', label: 'Auto-detect', icon: '🔍' },
  { value: 'homegate', label: 'Homegate.ch', icon: '🏠' },
  { value: 'flatfox', label: 'Flatfox.ch', icon: '🦊' },
  { value: 'immoscout24', label: 'ImmoScout24.ch', icon: '🔍' }
];

const PropertyImporter = ({ onImportComplete, onNext }) => {
  const dispatch = useDispatch();
  const { importedProperty, loading, error } = useSelector((state) => state.tenantSelection);
  
  const [url, setUrl] = useState('');
  const [portal, setPortal] = useState('auto');
  const [validationError, setValidationError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Enter URL', 'Preview Property', 'Configure Email'];

  // Auto-detect portal from URL
  useEffect(() => {
    if (url) {
      if (url.includes('homegate.ch')) {
        setPortal('homegate');
      } else if (url.includes('flatfox.ch')) {
        setPortal('flatfox');
      } else if (url.includes('immoscout24.ch')) {
        setPortal('immoscout24');
      }
    }
  }, [url]);

  const validateUrl = (inputUrl) => {
    if (!inputUrl) {
      setValidationError('Please enter a URL');
      return false;
    }
    
    try {
      const urlObj = new URL(inputUrl);
      const supportedDomains = ['homegate.ch', 'flatfox.ch', 'immoscout24.ch'];
      const isSupported = supportedDomains.some(domain => urlObj.hostname.includes(domain));
      
      if (!isSupported && portal === 'auto') {
        setValidationError('URL must be from Homegate, Flatfox, or ImmoScout24');
        return false;
      }
      
      setValidationError('');
      return true;
    } catch {
      setValidationError('Please enter a valid URL');
      return false;
    }
  };

  const handleImport = async () => {
    if (!validateUrl(url)) return;
    
    setIsImporting(true);
    try {
      const result = await dispatch(importPropertyFromURL({ url, portal })).unwrap();
      if (result) {
        setActiveStep(1);
      }
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (importedProperty) {
      setActiveStep(2);
    }
  };

  const handleCopyEmail = () => {
    if (importedProperty?.managedEmail) {
      navigator.clipboard.writeText(importedProperty.managedEmail);
    }
  };

  const handleComplete = () => {
    if (onImportComplete) {
      onImportComplete(importedProperty);
    }
    if (onNext) {
      onNext();
    }
  };

  const renderUrlInput = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Property from Listing
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Enter the URL of your property listing from Homegate, Flatfox, or ImmoScout24
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Property URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={!!validationError}
            helperText={validationError}
            placeholder="https://www.homegate.ch/rent/..."
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Portal</InputLabel>
            <Select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              label="Portal"
            >
              {SUPPORTED_PORTALS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{p.icon}</span>
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleImport}
            disabled={!url || isImporting}
            sx={{ height: '56px' }}
          >
            {isImporting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Importing...
              </>
            ) : (
              <>
                <HomeIcon sx={{ mr: 1 }} />
                Import Property
              </>
            )}
          </Button>
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Supported Portals:</strong>
        </Typography>
        <Box sx={{ mt: 1 }}>
          {SUPPORTED_PORTALS.slice(1).map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              size="small"
              sx={{ mr: 1, mt: 0.5 }}
              icon={<span>{p.icon}</span>}
            />
          ))}
        </Box>
      </Alert>
    </Box>
  );

  const renderPropertyPreview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Property Preview
      </Typography>
      
      {importedProperty ? (
        <Card sx={{ mt: 2 }}>
          {importedProperty.images?.[0] && (
            <CardMedia
              component="img"
              height="200"
              image={importedProperty.images[0]}
              alt={importedProperty.title}
            />
          )}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {importedProperty.title || importedProperty.address}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {importedProperty.address}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Rent
                </Typography>
                <Typography variant="body1">
                  CHF {importedProperty.price_chf?.toLocaleString() || 0}/month
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Rooms
                </Typography>
                <Typography variant="body1">
                  {importedProperty.bedrooms || 0} rooms
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Size
                </Typography>
                <Typography variant="body1">
                  {importedProperty.square_meters || 0} m²
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Available From
                </Typography>
                <Typography variant="body1">
                  {importedProperty.available_from 
                    ? new Date(importedProperty.available_from).toLocaleDateString()
                    : 'Immediately'}
                </Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                startIcon={<RefreshIcon />}
              >
                Import Different
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmImport}
                startIcon={<CheckIcon />}
              >
                Confirm & Continue
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <CircularProgress />
      )}
    </Box>
  );

  const renderEmailConfig = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Managed Email Address
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Applications will be sent to this unique email address and processed automatically
      </Typography>
      
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Your property's managed email:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'white',
              p: 2,
              borderRadius: 1,
              flex: 1
            }}
          >
            {importedProperty?.managedEmail || `listing-${importedProperty?.id}@listings.homeai.ch`}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleCopyEmail}
            startIcon={<CopyIcon />}
          >
            Copy
          </Button>
        </Box>
        
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Email address generated!</strong> Update your property listings on all portals
            with this email address to start receiving applications.
          </Typography>
        </Alert>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Next steps:</strong>
          <ol>
            <li>Copy this email address</li>
            <li>Update your listings on Homegate, Flatfox, and ImmoScout24</li>
            <li>Configure your tenant selection criteria</li>
            <li>Set up viewing slots</li>
          </ol>
        </Typography>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleComplete}
          size="large"
          startIcon={<CheckIcon />}
        >
          Complete Setup
        </Button>
      </Box>
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {activeStep === 0 && renderUrlInput()}
      {activeStep === 1 && renderPropertyPreview()}
      {activeStep === 2 && renderEmailConfig()}
    </Paper>
  );
};

export default PropertyImporter;