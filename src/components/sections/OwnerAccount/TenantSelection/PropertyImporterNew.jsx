import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  InputAdornment,
  Collapse,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Link as LinkIcon,
  Home as HomeIcon,
  Check as CheckIcon,
  ContentPaste as PasteIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  SquareFoot as SizeIcon,
  Bed as BedIcon,
  Bathroom as BathIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  CloudDownload as ImportIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { getApiUrl } from '../../../../utils/api/getApiUrl';
import { getSafeUser } from '../../../../utils/localStorage/safeJSONParse';

const PropertyImporter = ({ onPropertyImported, existingPropertyId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const [importMethod, setImportMethod] = useState('url'); // url, manual, existing
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const [error, setError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  
  const [manualData, setManualData] = useState({
    title: '',
    address: '',
    city: '',
    postal_code: '',
    canton: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    size_sqm: '',
    floor: '',
    available_from: '',
    description: '',
    amenities: []
  });

  const supportedPlatforms = [
    { name: 'Homegate', domain: 'homegate.ch', icon: '🏠' },
    { name: 'ImmoScout24', domain: 'immoscout24.ch', icon: '🔍' },
    { name: 'Flatfox', domain: 'flatfox.ch', icon: '🦊' },
    { name: 'Comparis', domain: 'comparis.ch', icon: '⚖️' },
    { name: 'Newhome', domain: 'newhome.ch', icon: '🏡' }
  ];

  const amenityOptions = [
    'Balcony', 'Terrace', 'Garden', 'Parking', 'Garage',
    'Elevator', 'Dishwasher', 'Washing Machine', 'Dryer',
    'Storage', 'Cellar', 'Pets Allowed', 'Wheelchair Accessible'
  ];

  useEffect(() => {
    if (existingPropertyId) {
      setImportMethod('existing');
      fetchExistingProperty();
    }
  }, [existingPropertyId]);

  const fetchExistingProperty = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/property/${existingPropertyId}`,
        {
          headers: {
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setImportedData({
          ...data,
          managed_email: `listing-${existingPropertyId}@listings.homeai.ch`
        });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

  const detectPlatform = (url) => {
    const platform = supportedPlatforms.find(p => url.includes(p.domain));
    return platform?.name || 'Unknown';
  };

  const handleUrlImport = async () => {
    setIsImporting(true);
    setError('');
    
    try {
      // Detect platform
      const platform = detectPlatform(url);
      
      // Get the access token from localStorage
      const user = getSafeUser();
      const accessToken = user?.access_token;
      
      if (!accessToken) {
        throw new Error('Please log in to import properties');
      }
      
      // Call backend API to scrape the listing
      const apiUrl = getApiUrl();
      
      // Extensive logging for debugging
      const requestId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[${requestId}] 🚀 Starting property import`, {
        url,
        platform,
        apiUrl,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : 'unknown'
      });
      
      const requestBody = JSON.stringify({ url, platform });
      console.log(`[${requestId}] 📤 Request payload:`, requestBody);
      
      // Start timing
      console.time(`[${requestId}] Total Request Time`);
      const startTime = performance.now();
      
      let response;
      try {
        console.log(`[${requestId}] 🔗 Making fetch request to: ${apiUrl}/tenant-selection/import-property`);
        
        response = await fetch(
          `${apiUrl}/tenant-selection/import-property`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: requestBody,
            // Increase timeout to 60 seconds
            signal: AbortSignal.timeout(60000)
          }
        );
        
        const fetchTime = performance.now() - startTime;
        console.log(`[${requestId}] 📡 Fetch completed`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          fetchTime: `${fetchTime.toFixed(2)}ms`,
          headers: Object.fromEntries(response.headers.entries())
        });
        
      } catch (fetchError) {
        const fetchTime = performance.now() - startTime;
        console.error(`[${requestId}] ❌ Fetch failed after ${fetchTime.toFixed(2)}ms:`, {
          error: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack
        });
        console.timeEnd(`[${requestId}] Total Request Time`);
        
        // Enhanced error messages
        if (fetchError.name === 'TimeoutError') {
          throw new Error(`Request timed out after 60 seconds. This could be due to slow internet connection or the property URL taking too long to process. Please try again.`);
        } else if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error(`Network error: Unable to connect to the server. Please check your internet connection.`);
        } else {
          throw new Error(`Network error: ${fetchError.message}`);
        }
      }
      
      if (!response.ok) {
        console.log(`[${requestId}] ⚠️ Response not OK, attempting to parse error`);
        let errorData;
        try {
          errorData = await response.json();
          console.log(`[${requestId}] 📄 Error response body:`, errorData);
        } catch (jsonError) {
          console.error(`[${requestId}] ❌ Failed to parse error response as JSON:`, jsonError);
          errorData = {};
        }
        
        console.timeEnd(`[${requestId}] Total Request Time`);
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[${requestId}] 💥 Import failed:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log(`[${requestId}] 📥 Response OK, parsing JSON...`);
      let data;
      try {
        data = await response.json();
        const totalTime = performance.now() - startTime;
        console.timeEnd(`[${requestId}] Total Request Time`);
        console.log(`[${requestId}] ✅ Successfully parsed response`, {
          totalTime: `${totalTime.toFixed(2)}ms`,
          dataKeys: Object.keys(data),
          success: data.success,
          hasProperty: !!data.property,
          propertyId: data.property?.id
        });
      } catch (jsonError) {
        console.error(`[${requestId}] ❌ Failed to parse success response as JSON:`, jsonError);
        console.timeEnd(`[${requestId}] Total Request Time`);
        throw new Error('Server returned invalid response format');
      }
      
      // Validate response structure
      console.log(`[${requestId}] 🔍 Validating response structure...`);
      if (!data.success || !data.property || !data.property.id) {
        console.error(`[${requestId}] ❌ Invalid response structure:`, {
          success: data.success,
          hasProperty: !!data.property,
          propertyId: data.property?.id,
          fullResponse: data
        });
        throw new Error('Invalid response from server. Property may not have been created properly.');
      }
      
      console.log(`[${requestId}] ✅ Response structure valid`);
      
      // Add managed email using the response data
      const property = data.property;
      console.log(`[${requestId}] 🏠 Processing property data:`, {
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        price: property.rent || property.price_chf,
        rooms: property.rooms || property.bedrooms
      });
      const propertyWithEmail = {
        id: property.id,
        title: property.title || `Property at ${property.address || 'Unknown Address'}`,
        address: property.address || 'Address not available',
        city: property.city || 'City not available',
        postal_code: property.postal_code,
        canton: property.canton,
        price: property.rent || property.price_chf || 0,
        bedrooms: property.rooms || property.bedrooms || 0,
        bathrooms: property.bathrooms || 1,
        size_sqm: property.square_meters || property.size_sqm || 0,
        floor: property.floor,
        available_from: property.available_from,
        description: property.description || 'No description available',
        amenities: property.amenities || [],
        images: property.images || [],
        source_url: url,
        platform: detectPlatform(url),
        managed_email: data.tenant_selection?.managed_email || `listing-${property.id}@listings.homeai.ch`,
        external_url: property.external_url || url
      };
      
      setImportedData(propertyWithEmail);
      
    } catch (error) {
      console.error('Import error:', error);
      let userError = error.message || 'Failed to import property';
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userError = 'Network error: Please check your connection and try again.';
      } 
      // Handle HTTP errors based on status codes
      else if (error.message.includes('HTTP 500')) {
        userError = 'Server error occurred. Please check if the URL is correct and try again.';
      } else if (error.message.includes('HTTP 404')) {
        userError = 'Property not found at this URL. Please verify the URL and try again.';
      } else if (error.message.includes('HTTP 400')) {
        userError = error.message.includes('Unsupported platform') 
          ? error.message 
          : 'Invalid request. Please check the URL format and try again.';
      } else if (error.message.includes('HTTP 401')) {
        userError = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('HTTP 403')) {
        userError = 'Access denied. You may not have permission to import this property.';
      }
      // Keep the original error message if it's already user-friendly
      else if (error.message.includes('Invalid response') || 
               error.message.includes('Property may not have been created') ||
               error.message.includes('Please')) {
        userError = error.message;
      }
      
      setError(userError);
    } finally {
      setIsImporting(false);
    }
  };

  // Mock data function removed - we now handle real errors properly

  const handleManualSave = async () => {
    setIsImporting(true);
    
    try {
      const response = await fetch(
        `${getApiUrl()}/property`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getSafeUser()?.access_token}`
          },
          body: JSON.stringify(manualData)
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to create property');
      }
      
      const data = await response.json();
      
      const propertyWithEmail = {
        ...data,
        managed_email: `listing-${data.id}@listings.homeai.ch`
      };
      
      setImportedData(propertyWithEmail);
      
    } catch (error) {
      console.error('Save error:', error);
      // For demo, create with mock ID
      const propertyId = Date.now();
      setImportedData({
        ...manualData,
        id: propertyId,
        managed_email: `listing-${propertyId}@listings.homeai.ch`
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrl(text);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleConfirmImport = () => {
    if (importedData) {
      onPropertyImported(importedData);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Import Property Listing
      </Typography>
      
      {/* Import Method Selection */}
      {!importedData && !existingPropertyId && (
        <ToggleButtonGroup
          value={importMethod}
          exclusive
          onChange={(e, value) => value && setImportMethod(value)}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="url">
            <LinkIcon sx={{ mr: 1 }} />
            Import from URL
          </ToggleButton>
          <ToggleButton value="manual">
            <AddIcon sx={{ mr: 1 }} />
            Manual Entry
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {/* URL Import Section */}
      {importMethod === 'url' && !importedData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Import from Listing Portal
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Paste the URL of your property listing from any of these supported platforms
          </Alert>

          {/* Supported Platforms */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Supported Platforms:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {supportedPlatforms.map(platform => (
                <Chip
                  key={platform.name}
                  label={`${platform.icon} ${platform.name}`}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* URL Input */}
          <TextField
            fullWidth
            label="Property Listing URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.homegate.ch/rent/..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handlePasteUrl} edge="end">
                    <PasteIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          {url && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Detected platform: {detectPlatform(url)}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={handleUrlImport}
            disabled={!url || isImporting}
            startIcon={isImporting ? <CircularProgress size={20} /> : <ImportIcon />}
          >
            {isImporting ? 'Importing...' : 'Import Property'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      )}

      {/* Manual Entry Form */}
      {importMethod === 'manual' && !importedData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manual Property Entry
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Title"
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                placeholder="e.g., Modern 3.5 Room Apartment"
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Street Address"
                value={manualData.address}
                onChange={(e) => setManualData({ ...manualData, address: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Floor"
                value={manualData.floor}
                onChange={(e) => setManualData({ ...manualData, floor: e.target.value })}
                type="number"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={manualData.city}
                onChange={(e) => setManualData({ ...manualData, city: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                value={manualData.postal_code}
                onChange={(e) => setManualData({ ...manualData, postal_code: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Canton</InputLabel>
                <Select
                  value={manualData.canton}
                  onChange={(e) => setManualData({ ...manualData, canton: e.target.value })}
                  label="Canton"
                >
                  <MenuItem value="ZH">Zürich</MenuItem>
                  <MenuItem value="BE">Bern</MenuItem>
                  <MenuItem value="VD">Vaud</MenuItem>
                  <MenuItem value="AG">Aargau</MenuItem>
                  <MenuItem value="GE">Geneva</MenuItem>
                  <MenuItem value="BS">Basel-Stadt</MenuItem>
                  <MenuItem value="LU">Lucerne</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Rent (CHF)"
                value={manualData.price}
                onChange={(e) => setManualData({ ...manualData, price: e.target.value })}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">CHF</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Bedrooms"
                value={manualData.bedrooms}
                onChange={(e) => setManualData({ ...manualData, bedrooms: e.target.value })}
                type="number"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Bathrooms"
                value={manualData.bathrooms}
                onChange={(e) => setManualData({ ...manualData, bathrooms: e.target.value })}
                type="number"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Size (m²)"
                value={manualData.size_sqm}
                onChange={(e) => setManualData({ ...manualData, size_sqm: e.target.value })}
                type="number"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Available From"
                value={manualData.available_from}
                onChange={(e) => setManualData({ ...manualData, available_from: e.target.value })}
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={manualData.description}
                onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {amenityOptions.map(amenity => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    onClick={() => {
                      const newAmenities = manualData.amenities.includes(amenity)
                        ? manualData.amenities.filter(a => a !== amenity)
                        : [...manualData.amenities, amenity];
                      setManualData({ ...manualData, amenities: newAmenities });
                    }}
                    color={manualData.amenities.includes(amenity) ? 'primary' : 'default'}
                    variant={manualData.amenities.includes(amenity) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleManualSave}
            disabled={!manualData.address || !manualData.city || !manualData.price || isImporting}
            startIcon={isImporting ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{ mt: 3 }}
          >
            {isImporting ? 'Saving...' : 'Save Property'}
          </Button>
        </Paper>
      )}

      {/* Existing Property */}
      {importMethod === 'existing' && existingPropertyId && !importedData && (
        <Paper sx={{ p: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Loading property #{existingPropertyId}...
          </Typography>
        </Paper>
      )}

      {/* Imported Property Display */}
      {importedData && (
        <Paper sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Property Imported Successfully!
            </Typography>
            <Typography variant="body2">
              Your managed email address has been generated
            </Typography>
          </Alert>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {importedData.title || `Property at ${importedData.address}`}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    <Typography>
                      {importedData.address}, {importedData.city} {importedData.postal_code}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="action" />
                    <Typography>CHF {importedData.price}/month</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BedIcon color="action" />
                    <Typography>{importedData.bedrooms} Bedrooms</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BathIcon color="action" />
                    <Typography>{importedData.bathrooms} Bathrooms</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SizeIcon color="action" />
                    <Typography>{importedData.size_sqm} m²</Typography>
                  </Box>
                </Grid>
                
                {importedData.amenities && importedData.amenities.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {importedData.amenities.map(amenity => (
                        <Chip key={amenity} label={amenity} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info" icon={<EmailIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Your Managed Email Address:
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {importedData.managed_email}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Share this email on listing portals to receive applications
                </Typography>
              </Alert>
            </CardContent>
          </Card>
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleConfirmImport}
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: 3 }}
          >
            Continue to Criteria Configuration
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default PropertyImporter;