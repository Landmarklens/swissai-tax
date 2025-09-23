import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { View } from '../../../../assets/svg/View';
import { Edit } from '../../../../assets/svg/Edit';
import { Delete } from '../../../../assets/svg/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupIcon from '@mui/icons-material/Group';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BuildIcon from '@mui/icons-material/Build';
import PropertyDetailsModal from './AddProperty';
import DeleteConfirmationModal from './DeleteProperty';
import PropertyImporter from '../../../PropertyImporterWithSetup';
import EmailForwardingModal from '../../../EmailForwardingModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteProperty,
  fetchProperties,
  selectProperties,
  createProperty,
  updateProperty,
  addPropertyImage,
  updatePropertyStatus
} from '../../../../store/slices/propertiesSlice';
import { createTenantConfig, createViewingSlots } from '../../../../store/slices/tenantSelectionSlice';
import { numberFormatter } from '../../../../utils';
import { getApiUrl } from '../../../../utils/api/getApiUrl';
import { getSafeUser } from '../../../../utils/localStorage/safeJSONParse';
import ImageIcon from '@mui/icons-material/Image';
import { getCurrencySymbol } from '../../../../constants/currencyMapping';
import { useTranslation } from 'react-i18next';
import { tenantSelectionAPI } from '../../../../api/tenantSelectionApi';
import { toast } from 'react-toastify';

// Swiss Cantons
const SWISS_CANTONS = [
  { code: 'AG', name: 'Aargau' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'BE', name: 'Bern' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'GE', name: 'Geneva' },
  { code: 'GL', name: 'Glarus' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Lucerne' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Ticino' },
  { code: 'UR', name: 'Uri' },
  { code: 'VS', name: 'Valais' },
  { code: 'VD', name: 'Vaud' },
  { code: 'ZG', name: 'Zug' },
  { code: 'ZH', name: 'Zurich' }
];

const ImagePlaceholder = () => (
  <Box
    sx={{
      width: '200px',
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#E0E7FD'
    }}
  >
    <ImageIcon sx={{ fontSize: 60, color: '#8DA4EF' }} />{' '}
  </Box>
);

const PropertyCard = ({ property, setDeletePropertyModals, setPropertyDetailsModal, setEditPropertyModal, navigate, tenantConfig, onStatusChange, isUpdatingStatus }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [localUpdating, setLocalUpdating] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  // Extensive logging for debugging label update issue
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`[PropertyCard ${property.id}] Render #${renderCount + 1}:`, {
      status: property.status,
      label: getStatusLabel(),
      primary_image_urls: property.primary_image_urls,
      images_length: property.primary_image_urls?.length,
      updated_at: property.updated_at,
      timestamp: new Date().toISOString()
    });
  }, [property.status, property.updated_at]);

  const getStatusLabel = () => {
    const label = (() => {
      if (!property.status) return t('Available');
      switch(property.status.toLowerCase()) {
        case 'selection_in_progress': return t('Active');
        case 'ad_active': return t('Active');
        case 'active': return t('Active');
        case 'available': return t('Non-active');
        case 'non_active': return t('Non-active');
        case 'inactive': return t('Non-active');
        case 'pending_viewing': return t('Pending Viewing');
        case 'rented': return t('Rented/Sold');
        case 'maintenance': return t('Maintenance');
        default: return t(property.status.charAt(0).toUpperCase() + property.status.slice(1).replace(/_/g, ' '));
      }
    })();
    console.log(`[PropertyCard ${property.id}] getStatusLabel:`, {
      input_status: property.status,
      output_label: label
    });
    return label;
  };

  // Determine if property is for sale or rent
  // Check deal_type first, then fall back to checking the external URL
  // Support multiple languages: English (buy), German (kaufen), French (acheter), Italian (comprare)
  const isForSale = property.deal_type === 'buy' ||
                    property.deal_type === 'sale' ||
                    (property.external_url && (
                      property.external_url.includes('/buy/') ||      // English
                      property.external_url.includes('/kaufen/') ||   // German
                      property.external_url.includes('/acheter/') ||  // French  
                      property.external_url.includes('/comprare/') || // Italian
                      property.external_url.includes('/vendre/') ||   // French (sell)
                      property.external_url.includes('/vendere/') ||  // Italian (sell)
                      property.external_url.includes('/verkaufen/')   // German (sell)
                    ));
  
  const propertyEmail = property.managed_email || `listing-${property.id}@listings.homeai.ch`;
  
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(propertyEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    setStatusMenuAnchor(null);
    setLocalUpdating(true);
    if (onStatusChange) {
      try {
        await onStatusChange(property.id, newStatus);
      } finally {
        setLocalUpdating(false);
      }
    }
  };
  
  const getStatusColor = () => {
    if (!property.status) return 'default';
    switch(property.status.toLowerCase()) {
      case 'selection_in_progress': return 'success';
      case 'ad_active': return 'success';
      case 'active': return 'success';
      case 'available': return 'default';
      case 'draft': return 'warning';
      case 'non_active': return 'default';
      case 'inactive': return 'default';
      case 'pending_viewing': return 'info';
      case 'rented': return 'secondary';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Card
        sx={{
          display: 'flex',
          maxWidth: 600,
          my: 2,
          position: 'relative',
          border: '1px solid #c1d0ff',
          boxShadow: 'unset'
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ position: 'relative', width: 200, height: 200 }}>
            {property.primary_image_urls && property.primary_image_urls.length > 0 ? (
              <CardMedia
                component="img"
                sx={{ width: 200, height: 200, objectFit: 'cover' }}
                image={property.primary_image_urls[0]}
                alt={property.title}
              />
            ) : (
              <ImagePlaceholder />
            )}
            <Chip
              label={getStatusLabel()}
              color={getStatusColor()}
              size="small"
              sx={{ position: 'absolute', top: 10, left: 10 }}
              icon={(() => {
                const status = property.status?.toLowerCase();
                if (status === 'selection_in_progress' || status === 'ad_active' || status === 'active') {
                  return <CheckCircleIcon />;
                } else if (status === 'rented') {
                  return <HomeIcon />;
                } else if (status === 'maintenance') {
                  return <BuildIcon />;
                } else {
                  return <PendingIcon />;
                }
              })()}
            />
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 0.5,
            mt: 1,
            mb: 1,
            width: 200
          }}>
            <Chip
              label={isForSale ? t('To Sell') : t('To Rent')}
              color={isForSale ? 'error' : 'info'}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            {property.external_url && (
              <Typography 
                component="a"
                href={property.external_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption" 
                sx={{ 
                  color: 'primary.main',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.dark'
                  }
                }}
                title={`View on ${property.external_url}`}
              >
                {(() => {
                  try {
                    return new URL(property.external_url).hostname;
                  } catch {
                    return property.external_url;
                  }
                })()}
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            marginLeft: '5px'
          }}
        >
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              {property.title || t('Untitled Property')}
            </Typography>
            <Typography variant="h6" component="div" gutterBottom color="primary">
              {numberFormatter(property.price_chf || property.price || 0)}
              {getCurrencySymbol(property.currency || 'CHF')}{' '}
              <Typography variant="caption">{t('per month')}</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {property.address}, {property.city}, {property.country}
            </Typography>
            <Box sx={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Email Address Display */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {propertyEmail}
                </Typography>
                <Tooltip title={copied ? t('Copied!') : t('Copy email')}>
                  <IconButton size="small" onClick={handleCopyEmail}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Property Status */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  size="small"
                  icon={(() => {
                    const status = property.status?.toLowerCase();
                    if (status === 'selection_in_progress' || status === 'ad_active' || status === 'active') {
                      return <CheckCircleIcon sx={{ fontSize: 16 }} />;
                    } else if (status === 'rented') {
                      return <HomeIcon sx={{ fontSize: 16 }} />;
                    } else if (status === 'maintenance') {
                      return <BuildIcon sx={{ fontSize: 16 }} />;
                    } else if (status === 'available') {
                      return <PendingIcon sx={{ fontSize: 16 }} />;
                    } else {
                      return null;
                    }
                  })()}
                  label={localUpdating || isUpdatingStatus == property.id ? t('Updating...') : getStatusLabel()}
                  color={getStatusColor()}
                  onClick={(e) => !localUpdating && isUpdatingStatus != property.id && setStatusMenuAnchor(e.currentTarget)}
                  onDelete={(e) => {
                    e.stopPropagation();
                    !localUpdating && isUpdatingStatus != property.id && setStatusMenuAnchor(e.currentTarget);
                  }}
                  deleteIcon={localUpdating || isUpdatingStatus == property.id ? <CircularProgress size={14} /> : <ArrowDropDownIcon />}
                  disabled={localUpdating || isUpdatingStatus == property.id}
                  sx={{
                    width: 'fit-content',
                    cursor: localUpdating || isUpdatingStatus == property.id ? 'wait' : 'pointer',
                    opacity: localUpdating || isUpdatingStatus == property.id ? 0.6 : 1,
                    '& .MuiChip-deleteIcon': {
                      fontSize: '20px',
                      '&:hover': {
                        color: 'inherit'
                      }
                    },
                    '&:hover': {
                      boxShadow: localUpdating || isUpdatingStatus ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }}
                />
                <Menu
                  anchorEl={statusMenuAnchor}
                  open={Boolean(statusMenuAnchor)}
                  onClose={() => setStatusMenuAnchor(null)}
                >
                  <MenuItem onClick={() => handleStatusChange('selection_in_progress')}>
                    <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#65BA74' }} />
                    {t('Active (Tenant Selection)')}
                  </MenuItem>
                  <MenuItem onClick={() => handleStatusChange('available')}>
                    <PendingIcon sx={{ mr: 1, fontSize: 16, color: '#AA99EC' }} />
                    {t('Non-active')}
                  </MenuItem>
                  <MenuItem onClick={() => handleStatusChange('rented')}>
                    <HomeIcon sx={{ mr: 1, fontSize: 16, color: '#3E63DD' }} />
                    {t('Rented/Sold')}
                  </MenuItem>
                  <MenuItem onClick={() => handleStatusChange('maintenance')}>
                    <BuildIcon sx={{ mr: 1, fontSize: 16, color: '#FFA500' }} />
                    {t('Maintenance')}
                  </MenuItem>
                </Menu>
              </Box>

              {/* Tenant Selection Status - Only show if active */}
              {tenantConfig && tenantConfig.isActive && (
                <Chip
                  size="small"
                  icon={<GroupIcon />}
                  label={t('Tenant Selection Active')}
                  color="success"
                  sx={{ width: 'fit-content', cursor: 'default' }}
                />
              )}
            </Box>
          </CardContent>
          <CardActions
            sx={{
              padding: 'unset',
              marginLeft: '10px',
              marginTop: '10px',
              lineHeight: 'unset!important',
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 0.5,
              alignItems: 'center',
              overflowX: 'auto',
              minHeight: '40px'
            }}
          >
            <Tooltip title={t('View')}>
              <IconButton
                onClick={() => setPropertyDetailsModal(property)}
                size="small"
                color="primary"
              >
                <View />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('Edit')}>
              <IconButton
                onClick={() => setEditPropertyModal(property)}
                size="small"
                color="primary"
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('View Applications')}>
              <IconButton
                onClick={() => navigate(`/owner-account?section=tenant-applications&property=${property.id}`)}
                size="small"
                color="primary"
              >
                <GroupIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('View Analytics')}>
              <IconButton
                onClick={() => navigate(`/owner-account?section=analytics&property=${property.id}`)}
                size="small"
                color="primary"
              >
                <AutoAwesomeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('Delete Property')}>
              <IconButton
                onClick={() => setDeletePropertyModals(property)}
                size="small"
                color="error"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Box>
      </Card>
    </Box>
  );
};

// Property Creation Modal Component
const PropertyCreationModal = ({ open, onClose, onImport }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const handleOptionSelect = (option) => {
    onClose();
    switch(option) {
      case 'import':
        onImport();
        break;
      case 'manual':
        // Navigate to a dedicated manual entry form page
        navigate('/owner-account?section=listing&action=manual-entry');
        break;
      default:
        break;
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('Add New Property')}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                height: '100%',
                '&:hover': { boxShadow: 3 } 
              }}
              onClick={() => handleOptionSelect('import')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <CloudDownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('Import from Portal')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Import your existing listing from Homegate, ImmoScout24, or other portals')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                height: '100%',
                '&:hover': { boxShadow: 3 } 
              }}
              onClick={() => handleOptionSelect('manual')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('Manual Entry')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('Fill out property details manually with our form')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

// AI Auto-Response Explanation Modal
const AIAutoResponseModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('How AI Auto-Responses Work')}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          🤖 {t('What is AI Auto-Response?')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('AI Auto-Response means our artificial intelligence will automatically read and reply to tenant emails without you having to manually respond to each one.')}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          📧 {t('How It Works:')}
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" paragraph>
            <strong>{t('Tenant emails you')}:</strong> {t('A potential renter sends an email to your property\'s unique HomeAI email address')}
          </Typography>
          <Typography component="li" paragraph>
            <strong>{t('AI reads the email')}:</strong> {t('Our AI analyzes the email content and understands what the person is asking')}
          </Typography>
          <Typography component="li" paragraph>
            <strong>{t('AI responds instantly')}:</strong> {t('Using your custom instructions and knowledge documents, AI sends a professional reply within minutes')}
          </Typography>
          <Typography component="li" paragraph>
            <strong>{t('You stay informed')}:</strong> {t('You receive notifications about all conversations and can step in anytime')}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          ✅ {t('AI Can Handle:')}
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li">{t('Questions about rent, deposit, availability')}</Typography>
          <Typography component="li">{t('Requests for viewing appointments')}</Typography>
          <Typography component="li">{t('Information about pets, parking, utilities')}</Typography>
          <Typography component="li">{t('Document requirements and application process')}</Typography>
          <Typography component="li">{t('Scheduling and confirming viewings')}</Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          🎯 {t('Benefits for You:')}
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li">{t('Save hours of time - no more manual email responses')}</Typography>
          <Typography component="li">{t('Never miss an inquiry - AI responds 24/7')}</Typography>
          <Typography component="li">{t('Consistent professional communication')}</Typography>
          <Typography component="li">{t('Pre-qualify tenants automatically based on your criteria')}</Typography>
          <Typography component="li">{t('Focus on serious applicants only')}</Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>{t('Note:')}</strong> {t('You can disable auto-responses anytime and all conversations are logged for your review. The AI follows your instructions and never makes final decisions about tenant selection.')}
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('Got It!')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Manual Property Entry Modal Component
const ManualPropertyModal = ({ open, onClose, onSubmit, property, isEditing }) => {
  const { t } = useTranslation();
  const [aiHelpModal, setAiHelpModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_meters: '',
    lot_size: '',
    year_built: '',
    address: '',
    city: '',
    state: 'ZH', // Default to Zurich
    zip_code: '',
    deal_type: 'rent', // Default to rent (rent or buy)
    // Property images
    images: [],
    // AI Tenant Selection (mandatory core feature)
    tenantSelection: {
      // Basic criteria
      petsAllowed: false,
      smokingAllowed: false,
      affordabilityCriteria: '3x monthly rent',
      customCriteria: [],
      
      // AI system prompt for handling tenant requests
      aiInstructions: `You are a professional property rental assistant. Your goal is to attract and select responsible, organized tenants who provide complete documentation promptly.

TENANT SELECTION PRIORITIES:
- Prioritize applicants who respond quickly with complete information
- Favor tenants who ask thoughtful, specific questions about the property
- Give preference to those who provide all documents within 24-48 hours
- Look for signs of organization and attention to detail in communications

COMMUNICATION STYLE:
- Be professional, friendly, and responsive
- Emphasize the importance of timely document submission
- Create urgency by mentioning high demand for the property
- Set clear expectations and deadlines

REQUIRED DOCUMENTS (must be submitted within 48 hours):
- Valid photo ID or passport
- Last 3 months salary slips
- Current employment contract
- Last 3 months bank statements
- Previous landlord reference letter
- Copy of current rental agreement (if applicable)

SCREENING CRITERIA:
- Income must be minimum 3x monthly rent (gross)
- Stable employment for at least 6 months
- Clean financial history
- Positive rental references
- [PETS_POLICY] - specify your pet policy
- No smoking inside the property

RESPONSE TEMPLATES:
For complete applications: "Thank you for your prompt and complete application. Based on your documentation, I'm pleased to offer you a viewing slot."

For incomplete applications: "I notice some documents are missing. To ensure fair consideration, please provide ALL required documents within 24 hours. Due to high demand, incomplete applications cannot be processed."

For delayed responses: "Thank you for your interest. However, we're looking for tenants who can respond promptly to requests. If you can provide all documents within 24 hours, we can still consider your application."

Always emphasize that organized, responsive tenants are preferred as they tend to be better long-term renters.`,
      
      // Viewing slots configuration with specific dates
      viewingSlots: [
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
          startTime: '17:00',
          endTime: '19:00',
          slotDuration: 15, // minutes
          maxViewersPerSlot: 1
        },
        {
          date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days from now
          startTime: '17:00',
          endTime: '18:00',
          slotDuration: 15, // minutes
          maxViewersPerSlot: 1
        }
      ],
      
      // Document uploads for AI knowledge base
      knowledgeDocuments: [],
      
      // Email and communication
      emailNotifications: true,
      autoResponseEnabled: true
    }
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEditing && property && open) {
      // Map state code from state name
      const stateCode = SWISS_CANTONS.find(c => c.name === property.state)?.code || 'ZH';

      // First set basic property data
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price_chf?.toString() || property.price?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        square_meters: property.square_meters?.toString() || '',
        lot_size: property.lot_size?.toString() || '',
        year_built: property.year_built?.toString() || '',
        address: property.address || '',
        city: property.city || '',
        state: stateCode,
        zip_code: property.zip_code || '',
        deal_type: property.deal_type || 'rent',
        images: [], // Images handled separately
        tenantSelection: {
          petsAllowed: false,
          smokingAllowed: false,
          affordabilityCriteria: '3x monthly rent',
          customCriteria: [],
          aiInstructions: `You are a professional property rental assistant...`, // Default AI instructions
          viewingSlots: [
            {
              date: '',
              startTime: '14:00',
              endTime: '18:00',
              slotDuration: 15,
              maxViewersPerSlot: 1
            }
          ],
          knowledgeDocuments: [],
          emailNotifications: true,
          autoResponseEnabled: true
        }
      });

      // Fetch existing viewing slots for this property
      console.log('[ManualPropertyModal] Fetching viewing slots for property:', property.id);
      const user = getSafeUser();
      fetch(`/api/tenant-selection/${property.id}/viewing-slots`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          console.log('[ManualPropertyModal] Fetched viewing slots:', data);
          // Handle both array response and object with slots property
          const slotsArray = Array.isArray(data) ? data : (data?.slots || []);

          if (slotsArray && slotsArray.length > 0) {
            // Convert backend format to frontend format
            const formattedSlots = slotsArray.map(slot => {
              // Parse the slot_datetime or use date/time fields
              let date = '';
              let startTime = '';
              let endTime = '';

              if (slot.slot_datetime) {
                // If using ISO datetime format
                const dateObj = new Date(slot.slot_datetime);
                date = dateObj.toISOString().split('T')[0];
                startTime = dateObj.toTimeString().slice(0, 5);
                // Calculate end time based on duration if not provided
                if (slot.duration_minutes) {
                  const endDate = new Date(dateObj.getTime() + slot.duration_minutes * 60000);
                  endTime = endDate.toTimeString().slice(0, 5);
                } else {
                  endTime = slot.endTime || '18:00';
                }
              } else if (slot.date && slot.time) {
                // If using separate date/time fields
                date = slot.date;
                startTime = slot.time;
                endTime = slot.endTime || '18:00';
              }

              return {
                date: date,
                startTime: startTime,
                endTime: endTime,
                slotDuration: slot.slotDuration || slot.duration_minutes || 15,
                maxViewersPerSlot: slot.maxViewersPerSlot || slot.max_viewers || 1
              };
            });

            console.log('[ManualPropertyModal] Formatted slots:', formattedSlots);

            // Update form data with fetched slots
            setFormData(prevData => ({
              ...prevData,
              tenantSelection: {
                ...prevData.tenantSelection,
                viewingSlots: formattedSlots
              }
            }));
          }
        })
        .catch(error => {
          console.error('[ManualPropertyModal] Error fetching viewing slots:', error);
        });
    } else if (!isEditing) {
      // Reset form for new property creation
      setFormData({
        title: '',
        description: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        square_meters: '',
        lot_size: '',
        year_built: '',
        address: '',
        city: '',
        state: 'ZH',
        zip_code: '',
        deal_type: 'rent',
        images: [],
        tenantSelection: {
          petsAllowed: false,
          smokingAllowed: false,
          affordabilityCriteria: '3x monthly rent',
          customCriteria: [],
          aiInstructions: `You are a professional property rental assistant...`, // Default AI instructions
          viewingSlots: [
            {
              date: '',
              startTime: '14:00',
              endTime: '18:00',
              slotDuration: 15,
              maxViewersPerSlot: 1
            }
          ],
          knowledgeDocuments: [],
          emailNotifications: true,
          autoResponseEnabled: true
        }
      });
    }
  }, [isEditing, property, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? t('Edit Property') : t('Add Property Manually')}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('Property Title')}
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="e.g., Modern 3.5 Room Apartment"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('Description')}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Describe your property..."
              />
            </Grid>
            
            {/* Property Images Upload */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                {t('Property Images')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('Upload images of your property. The first image will be the primary image.')}
              </Typography>
              
              <input
                accept="image/*"
                id="property-images-upload"
                multiple
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const imageFiles = files.map(file => ({
                    file,
                    preview: URL.createObjectURL(file),
                    name: file.name
                  }));
                  setFormData({
                    ...formData,
                    images: [...formData.images, ...imageFiles]
                  });
                }}
              />
              <label htmlFor="property-images-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  sx={{ mb: 2 }}
                >
                  {t('Upload Images')}
                </Button>
              </label>
              
              {formData.images.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {formData.images.map((image, index) => (
                    <Grid item xs={4} sm={3} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <img
                          src={image.preview}
                          alt={`Property ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            URL.revokeObjectURL(image.preview);
                            setFormData({ ...formData, images: newImages });
                          }}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {index === 0 && (
                          <Chip
                            label={t('Primary')}
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>{t('Listing Type')}</InputLabel>
                <Select
                  value={formData.deal_type}
                  onChange={handleChange('deal_type')}
                  label={t('Listing Type')}
                >
                  <MenuItem value="rent">{t('To Rent')}</MenuItem>
                  <MenuItem value="buy">{t('To Sell')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                type="number"
                label={formData.deal_type === 'rent' ? t('Monthly Rent (CHF)') : t('Sale Price (CHF)')}
                value={formData.price}
                onChange={handleChange('price')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                type="number"
                label={t('Bedrooms')}
                value={formData.bedrooms}
                onChange={handleChange('bedrooms')}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                type="number"
                label={t('Bathrooms')}
                value={formData.bathrooms}
                onChange={handleChange('bathrooms')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label={t('Square Meters')}
                value={formData.square_meters}
                onChange={handleChange('square_meters')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label={t('Lot Size (m²)')}
                value={formData.lot_size}
                onChange={handleChange('lot_size')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label={t('Year Built')}
                value={formData.year_built}
                onChange={handleChange('year_built')}
                placeholder="e.g., 2010"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                label={t('Address')}
                value={formData.address}
                onChange={handleChange('address')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                label={t('City')}
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('Canton')}</InputLabel>
                <Select
                  value={formData.state}
                  onChange={handleChange('state')}
                  label={t('Canton')}
                >
                  {SWISS_CANTONS.map((canton) => (
                    <MenuItem key={canton.code} value={canton.code}>
                      {canton.name} ({canton.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('ZIP Code')}
                value={formData.zip_code}
                onChange={handleChange('zip_code')}
              />
            </Grid>
          </Grid>

          {/* AI Tenant Selection Configuration - Core Feature */}
          <Accordion defaultExpanded sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{t('AI Tenant Selection')}</Typography>
              <Chip label={t('Core Feature')} color="primary" size="small" sx={{ ml: 2 }} />
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('Configure AI-powered tenant screening, viewing management, and automated communication')}
              </Typography>
              
              <Grid container spacing={3}>
                {/* Tenant Criteria */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('Tenant Criteria')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.tenantSelection.petsAllowed}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantSelection: { ...formData.tenantSelection, petsAllowed: e.target.checked }
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
                        checked={formData.tenantSelection.smokingAllowed}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantSelection: { ...formData.tenantSelection, smokingAllowed: e.target.checked }
                        })}
                      />
                    }
                    label={t('Smoking Allowed')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label={t('Affordability Criteria')}
                    value={formData.tenantSelection.affordabilityCriteria}
                    onChange={(e) => setFormData({
                      ...formData,
                      tenantSelection: { ...formData.tenantSelection, affordabilityCriteria: e.target.value }
                    })}
                    placeholder="e.g., 3x monthly rent, stable income, employment verification"
                    helperText={t('Define income and financial requirements (REQUIRED)')}
                  />
                </Grid>

                {/* AI Instructions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    {t('AI System Prompt & Tenant Selection Criteria')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('Define how AI should behave and what type of tenants to prioritize (organized, timely document submission)')}
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label={t('AI Instructions')}
                    value={formData.tenantSelection.aiInstructions}
                    onChange={(e) => setFormData({
                      ...formData,
                      tenantSelection: { ...formData.tenantSelection, aiInstructions: e.target.value }
                    })}
                    placeholder={t('System prompt example: You are a rental assistant. Prioritize organized tenants who submit documents quickly. Be professional and emphasize timely responses...')}
                    helperText={t('System prompt defining AI behavior, tenant priorities, and response templates. Focus on attracting organized, responsive tenants (REQUIRED)')}
                  />
                </Grid>

                {/* Knowledge Base Documents */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    {t('AI Knowledge Base Documents')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('Upload documents that AI can use to answer tenant questions (rental agreements, house rules, parking info, etc.)')}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <input
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    id="knowledge-document-upload"
                    multiple
                    type="file"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const newDocs = files.map(file => ({
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        uploaded: false
                      }));
                      setFormData({
                        ...formData,
                        tenantSelection: {
                          ...formData.tenantSelection,
                          knowledgeDocuments: [...formData.tenantSelection.knowledgeDocuments, ...newDocs]
                        }
                      });
                    }}
                  />
                  <label htmlFor="knowledge-document-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFileIcon />}
                      sx={{ mb: 2 }}
                    >
                      {t('Upload Knowledge Documents')}
                    </Button>
                  </label>
                  
                  {formData.tenantSelection.knowledgeDocuments.length > 0 && (
                    <Box>
                      {formData.tenantSelection.knowledgeDocuments.map((doc, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 1, p: 2 }}>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {doc.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Chip 
                                label={doc.uploaded ? t('Uploaded') : t('Ready to upload')} 
                                color={doc.uploaded ? 'success' : 'warning'}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newDocs = formData.tenantSelection.knowledgeDocuments.filter((_, i) => i !== index);
                                  setFormData({
                                    ...formData,
                                    tenantSelection: { ...formData.tenantSelection, knowledgeDocuments: newDocs }
                                  });
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Viewing Time Slots Configuration */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    {t('Viewing Time Slots')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('Define specific dates and time ranges when you are available for viewings (e.g., February 21, 2025 5:00-7:00 PM)')}
                    <Typography component="span" color="error" sx={{ ml: 1 }}>*</Typography>
                  </Typography>
                  {formData.tenantSelection.viewingSlots.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {t('At least one viewing slot is required. Click "Add Time Slot" below.')}
                    </Alert>
                  )}
                </Grid>

                {formData.tenantSelection.viewingSlots.map((slot, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
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
                            onChange={(e) => {
                              const newSlots = [...formData.tenantSelection.viewingSlots];
                              newSlots[index].date = e.target.value;
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ 
                              min: new Date().toISOString().split('T')[0] // No past dates
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2.5}>
                          <TextField
                            fullWidth
                            type="time"
                            label={t('Start Time')}
                            placeholder="14:00"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSlots = [...formData.tenantSelection.viewingSlots];
                              newSlots[index].startTime = e.target.value;
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2.5}>
                          <TextField
                            fullWidth
                            type="time"
                            label={t('End Time')}
                            placeholder="16:00"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSlots = [...formData.tenantSelection.viewingSlots];
                              newSlots[index].endTime = e.target.value;
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            type="number"
                            label={t('Slot Duration (min)')}
                            placeholder="15"
                            value={slot.slotDuration}
                            onChange={(e) => {
                              const newSlots = [...formData.tenantSelection.viewingSlots];
                              newSlots[index].slotDuration = parseInt(e.target.value);
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                            inputProps={{ min: 5, max: 120, step: 5 }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            type="number"
                            label={t('Max Viewers')}
                            value={slot.maxViewersPerSlot}
                            onChange={(e) => {
                              const newSlots = [...formData.tenantSelection.viewingSlots];
                              newSlots[index].maxViewersPerSlot = parseInt(e.target.value);
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                            inputProps={{ min: 1, max: 10 }}
                            placeholder="1"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              const newSlots = formData.tenantSelection.viewingSlots.filter((_, i) => i !== index);
                              setFormData({
                                ...formData,
                                tenantSelection: { ...formData.tenantSelection, viewingSlots: newSlots }
                              });
                            }}
                            sx={{ mt: 1 }}
                          >
                            {t('Remove')}
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const newSlot = {
                        date: tomorrow.toISOString().split('T')[0],
                        startTime: '18:00',
                        endTime: '20:00',
                        slotDuration: 15,
                        maxViewersPerSlot: 1
                      };
                      setFormData({
                        ...formData,
                        tenantSelection: {
                          ...formData.tenantSelection,
                          viewingSlots: [...formData.tenantSelection.viewingSlots, newSlot]
                        }
                      });
                    }}
                    startIcon={<AddIcon />}
                  >
                    {t('Add Time Slot')}
                  </Button>
                </Grid>

                {/* Communication Settings */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    {t('Communication Settings')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.tenantSelection.emailNotifications}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantSelection: { ...formData.tenantSelection, emailNotifications: e.target.checked }
                        })}
                      />
                    }
                    label={t('Email Notifications')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.tenantSelection.autoResponseEnabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            tenantSelection: { ...formData.tenantSelection, autoResponseEnabled: e.target.checked }
                          })}
                        />
                      }
                      label={t('AI Auto-responses')}
                    />
                    <Tooltip title={t('Learn how AI auto-responses work')}>
                      <IconButton 
                        size="small" 
                        onClick={() => setAiHelpModal(true)}
                      >
                        <HelpOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {t('AI Tenant Selection Process')}: 
                  {t(' Renters email → AI screens → Viewing slot assigned → Documents submitted → AI creates anonymized cards → You select tenant → Automated notifications sent')}
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" size="large">
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="contained" size="large">
            {isEditing ? t('Update Property') : t('Continue')}
          </Button>
        </DialogActions>
      </form>
      
      <AIAutoResponseModal 
        open={aiHelpModal} 
        onClose={() => setAiHelpModal(false)} 
      />
    </Dialog>
  );
};

// Email Forwarding Modal is now imported from a separate component

const ListingManagement = () => {
  const { t } = useTranslation();
  const [propertyDetailsModal, setPropertyDetailsModal] = useState(null);
  const [deletePropertyModals, setDeletePropertyModals] = useState(null);
  const [createPropertyModal, setCreatePropertyModal] = useState(false);
  const [manualPropertyModal, setManualPropertyModal] = useState(false);
  const [editPropertyModal, setEditPropertyModal] = useState(null);
  const [emailForwardingModal, setEmailForwardingModal] = useState(null); // Contains property data when shown
  const [showImporter, setShowImporter] = useState(false);
  const [importerFormState, setImporterFormState] = useState(null);
  const [tenantConfigs, setTenantConfigs] = useState({});
  const [updatingPropertyId, setUpdatingPropertyId] = useState(null);
  const navigate = useNavigate();
  const fetchedPropertiesRef = useRef(new Set());
  const location = useLocation();
  const dispatch = useDispatch();
  const { properties } = useSelector(selectProperties);
  
  // Get tenant selection data
  const tenantSelection = useSelector(state => state.tenantSelection);

  useEffect(() => {
    dispatch(fetchProperties());
    
    // Check URL parameters for action=create or action=manual-entry
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'create') {
      setCreatePropertyModal(true);
      // Remove the action parameter from URL after opening modal
      searchParams.delete('action');
      // Preserve existing parameters or default to section=listing
      if (!searchParams.has('section')) {
        searchParams.set('section', 'listing');
      }
      const newSearch = searchParams.toString();
      navigate(`/owner-account?${newSearch}`, { replace: true });
    } else if (searchParams.get('action') === 'manual-entry') {
      setManualPropertyModal(true);
      // Remove the action parameter from URL after opening modal
      searchParams.delete('action');
      // Preserve existing parameters or default to section=listing
      if (!searchParams.has('section')) {
        searchParams.set('section', 'listing');
      }
      const newSearch = searchParams.toString();
      navigate(`/owner-account?${newSearch}`, { replace: true });
    }
  }, [dispatch, location.search, navigate]);
  
  // Fetch tenant selection config for a specific property when needed
  const fetchTenantConfig = async (propertyId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/tenant-selection/config/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${getSafeUser()?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTenantConfigs(prev => ({
          ...prev,
          [propertyId]: data
        }));
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching config for property ${propertyId}:`, error);
      return null;
    }
  };

  const handleDeleteProperty = async () => {
    if (!deletePropertyModals?.id) {
      console.error('No property ID to delete');
      return;
    }
    
    try {
      await dispatch(deleteProperty(deletePropertyModals.id)).unwrap();
      setDeletePropertyModals(null);
      dispatch(fetchProperties());
      toast.success(t('Property deleted successfully'));
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error(t('Failed to delete property'));
    }
  };
  
  const handleConfigureTenantSelection = (propertyId) => {
    navigate(`/owner-account?section=tenant-applications&config=${propertyId}`);
  };

  const handlePropertyStatusChange = async (propertyId, newStatus) => {
    console.log('\n========== STATUS UPDATE START ==========');
    console.log(`[handlePropertyStatusChange] Property ${propertyId} -> ${newStatus}`);
    console.log('[handlePropertyStatusChange] Current properties:', properties.data?.find(p => p.id === propertyId));

    setUpdatingPropertyId(propertyId);
    try {
      const result = await dispatch(updatePropertyStatus({ propertyId, status: newStatus }));
      console.log('[handlePropertyStatusChange] Dispatch result:', result);
      console.log('[handlePropertyStatusChange] Result type:', result.type);
      console.log('[handlePropertyStatusChange] Payload:', JSON.stringify(result.payload, null, 2));

      if (updatePropertyStatus.fulfilled.match(result)) {
        // Success
        const statusLabels = {
          'selection_in_progress': t('Active'),
          'available': t('Non-active'),
          'rented': t('Rented/Sold'),
          'maintenance': t('Maintenance'),
          'active': t('Active'),
          'inactive': t('Non-active')
        };
        toast.success(t('Property status updated to {{status}}', { status: statusLabels[newStatus] || newStatus }));
        // Don't refetch - let Redux handle the state update
        // The backend returns the updated property with images, and Redux updates the state

        // Log the updated state after a delay
        setTimeout(() => {
          const updatedProp = properties.data?.find(p => p.id === propertyId);
          console.log('[handlePropertyStatusChange] After update - Property from props:', updatedProp);
          console.log('[handlePropertyStatusChange] After update - Status:', updatedProp?.status);
          console.log('[handlePropertyStatusChange] After update - Images:', updatedProp?.primary_image_urls);
          console.log('========== STATUS UPDATE END ==========\n');
        }, 100);
      } else {
        // Error
        const errorMessage = result.payload?.detail || result.payload?.message || t('Failed to update property status');
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update property status:', error);
      toast.error(t('An unexpected error occurred while updating property status'));
      console.log('========== STATUS UPDATE ERROR ==========\n');
    } finally {
      setUpdatingPropertyId(null);
    }
  };

  const uploadKnowledgeDocuments = async (propertyId, documents) => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.homeai.ch';
    
    for (const doc of documents) {
      try {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('document_name', doc.name);
        formData.append('property_id', propertyId.toString());
        
        const user = getSafeUser();
        const token = user?.access_token;
        
        if (!token) {
          console.error(`[DocumentUpload] No access token available for ${doc.name}`);
          continue;
        }
        
        const response = await fetch(`${API_URL}/api/tenant-selection/config/${propertyId}/knowledge-documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          // Mark document as uploaded
          doc.uploaded = true;
        } else {
          console.error(`[DocumentUpload] Failed to upload: ${doc.name}`, response.statusText);
        }
      } catch (error) {
        console.error(`[DocumentUpload] Error uploading ${doc.name}:`, error);
      }
    }
  };

  const handleManualPropertyCreate = async (propertyData) => {
    try {
      const result = await dispatch(createProperty({
        title: propertyData.title,
        description: propertyData.description,
        price_chf: parseFloat(propertyData.price),
        currency: 'CHF',
        bedrooms: parseInt(propertyData.bedrooms) || 1,
        bathrooms: parseInt(propertyData.bathrooms) || 1,
        square_meters: parseInt(propertyData.square_meters) || 50,
        lot_size: parseFloat(propertyData.lot_size) || 0,
        year_built: parseInt(propertyData.year_built) || new Date().getFullYear(),
        country: 'Switzerland',
        state: SWISS_CANTONS.find(c => c.code === propertyData.state)?.name || 'Zurich',
        city: propertyData.city,
        address: propertyData.address,
        zip_code: propertyData.zip_code || '8000',
        deal_type: propertyData.deal_type || 'rent',
        latitude: 47.3769, // Default Zurich coordinates
        longitude: 8.5417
      }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        const createdProperty = result.payload;
        
        // Create AI tenant selection configuration (mandatory core feature)
        // Prepare viewing schedule data
        const viewingScheduleData = propertyData.tenantSelection.viewingSlots.length > 0 ? {
          slots: propertyData.tenantSelection.viewingSlots.map(slot => ({
            date: slot.date,
            start_time: slot.startTime,
            end_time: slot.endTime,
            slot_duration_minutes: slot.slotDuration,
            max_viewers_per_slot: slot.maxViewersPerSlot
          }))
        } : null;

        const tenantConfigData = {
          property_id: createdProperty.id,
          max_viewing_invites: 20,
          hard_criteria: {
            affordability: {
              min_income_ratio: 3,
              max_rent_ratio: 0.33
            },
            occupancy: {
              max_persons: 4  // Default max occupants
            },
            house_rules: {
              pets_allowed: propertyData.tenantSelection.petsAllowed,
              smoking_allowed: propertyData.tenantSelection.smokingAllowed
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
          viewing_schedule: viewingScheduleData,
          ai_instructions: propertyData.tenantSelection.aiInstructions,
          ai_response_settings: {
            auto_respond: propertyData.tenantSelection.autoResponseEnabled,
            response_time: propertyData.tenantSelection.responseTime || 'within_24h',
            email_notifications: propertyData.tenantSelection.emailNotifications
          }
        };
        
        try {
          await dispatch(createTenantConfig(tenantConfigData));
          
          // Upload knowledge documents if any
          if (propertyData.tenantSelection.knowledgeDocuments.length > 0) {
            await uploadKnowledgeDocuments(createdProperty.id, propertyData.tenantSelection.knowledgeDocuments);
          }
        } catch (error) {
          console.warn('[PropertyCreation] Failed to create tenant selection config:', error);
          // Don't fail the whole operation if tenant config fails
        }
        
        // Upload property images if any
        if (propertyData.images && propertyData.images.length > 0) {
          try {
            for (let i = 0; i < propertyData.images.length; i++) {
              const imageData = propertyData.images[i];
              const formData = new FormData();
              formData.append('file', imageData.file);
              
              await dispatch(addPropertyImage({
                propertyId: createdProperty.id,
                is_primary: i === 0, // First image is primary
                file: formData
              }));
            }
          } catch (error) {
            console.warn('[PropertyCreation] Failed to upload some images:', error);
            // Don't fail the whole operation if image upload fails
          }
        }
        
        setManualPropertyModal(false);
        // Show email forwarding modal with the created property
        setEmailForwardingModal(createdProperty);
        dispatch(fetchProperties());
      }
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const handleManualPropertyUpdate = async (propertyData) => {
    console.log('[handleManualPropertyUpdate] Starting update with data:', propertyData);
    console.log('[handleManualPropertyUpdate] Viewing slots:', propertyData.tenantSelection?.viewingSlots);

    try {
      // First, update the property basic information
      const propertyUpdateResult = await dispatch(updateProperty({
        id: editPropertyModal.id,
        body: {
          title: propertyData.title,
          description: propertyData.description,
          price_chf: parseFloat(propertyData.price),
          currency: 'CHF',
          bedrooms: parseInt(propertyData.bedrooms) || 1,
          bathrooms: parseInt(propertyData.bathrooms) || 1,
          square_meters: parseInt(propertyData.square_meters) || 50,
          lot_size: parseFloat(propertyData.lot_size) || 0,
          year_built: parseInt(propertyData.year_built) || new Date().getFullYear(),
          country: 'Switzerland',
          state: SWISS_CANTONS.find(c => c.code === propertyData.state)?.name || 'Zurich',
          city: propertyData.city,
          address: propertyData.address,
          zip_code: propertyData.zip_code || '8000',
          deal_type: propertyData.deal_type || 'rent'
        }
      }));

      console.log('[handleManualPropertyUpdate] Property update result:', propertyUpdateResult);

      // If property update succeeded and we have tenant selection data with viewing slots
      if (propertyUpdateResult.meta.requestStatus === 'fulfilled' &&
          propertyData.tenantSelection &&
          propertyData.tenantSelection.viewingSlots &&
          propertyData.tenantSelection.viewingSlots.length > 0) {

        console.log('[handleManualPropertyUpdate] Updating viewing slots for property:', editPropertyModal.id);

        // Format viewing slots for the backend
        const formattedSlots = propertyData.tenantSelection.viewingSlots
          .filter(slot => slot.date && slot.startTime && slot.endTime)
          .map(slot => ({
            date: slot.date,
            time: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration || 15,
            maxViewersPerSlot: slot.maxViewersPerSlot || 1
          }));

        console.log('[handleManualPropertyUpdate] Formatted slots to send:', formattedSlots);

        if (formattedSlots.length > 0) {
          // Call the bulk create endpoint to update viewing slots
          const slotsResult = await dispatch(createViewingSlots({
            propertyId: editPropertyModal.id,
            slots: formattedSlots
          }));

          console.log('[handleManualPropertyUpdate] Viewing slots update result:', slotsResult);
        }
      }

      if (propertyUpdateResult.meta.requestStatus === 'fulfilled') {
        setEditPropertyModal(null);
        // Refresh properties list
        dispatch(fetchProperties());
        console.log('[handleManualPropertyUpdate] Update completed successfully');
      } else {
        console.error('[PropertyUpdate] Failed to update property:', propertyUpdateResult.error);
      }
    } catch (error) {
      console.error('[handleManualPropertyUpdate] Error updating property:', error);
    }
  };
  
  // Calculate statistics with extensive logging

  // Debug draft properties calculation
  const draftProperties = properties.data?.filter(p => {
    const status = p.status?.toLowerCase();
    const isDraft = status === 'draft' || status === 'non_active' || status === 'inactive' || !p.status;
    return isDraft;
  }) || [];

  // Debug tenant selection calculation
  const tenantSelectionConfigs = Object.entries(tenantConfigs).filter(([propId, config]) => {
    // A property has tenant selection if it has a valid config (not the default isActive: false)
    // Check if config exists and has an id (which means it's configured in the database)
    const isActive = config && config.id && config.id !== 'isActive' && config.isActive !== false;
    return isActive;
  });

  // Check if there's a mismatch with actual tenant selected properties
  const propertiesWithTenantSelected = properties.data?.filter(p => {
    const hasSelectedTenant = p.selected_tenant_id || p.tenant_decision === 'accepted';
    return hasSelectedTenant;
  }) || [];

  // Get leads data from Redux store to check for selected tenants
  const leadsData = tenantSelection?.leads || {};

  // Check if any leads have been selected/accepted across all properties
  const selectedLeadsCount = React.useMemo(() => {

    if (!leadsData.ids || !leadsData.entities) {
      return 0;
    }

    // Count unique properties that have at least one lead with decision='accepted' or status='selected'
    const propertiesWithSelection = new Set();

    leadsData.ids.forEach(leadId => {
      const lead = leadsData.entities[leadId];

      // Check if the lead is selected based on lead_status field
      if (lead && (lead.lead_status === 'selected' || lead.lead_status === 'SELECTED' ||
                   lead.decision === 'accepted' || lead.status === 'selected')) {
        propertiesWithSelection.add(lead.property_id);
      }
    });


    return propertiesWithSelection.size;
  }, [leadsData]);

  const stats = {
    total: properties.data?.length || 0,
    active: properties.data?.filter(p => {
      const status = p.status?.toLowerCase();
      return status === 'selection_in_progress' || status === 'active' || status === 'ad_active';
    })?.length || 0,
    draft: draftProperties.length,
    // Count properties where a tenant has been selected
    // Check both property status and leads data
    tenantSelected: properties.data?.filter(p =>
      p.status?.toLowerCase() === 'rented' ||
      p.status?.toLowerCase() === 'tenant_selected' ||
      p.selected_tenant_id ||
      p.tenant_decision === 'accepted'
    )?.length || selectedLeadsCount
  };


  return (
    <Box sx={{}}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: '500' }} variant="h4" component="h1">
          {t('Listing Management')}
        </Typography>
        <Button
          sx={{ width: '150px', height: '37px', boxShadow: 'none' }}
          variant="contained"
          color="primary"
          onClick={() => setCreatePropertyModal(true)}
          startIcon={<AddIcon />}
        >
          {t('Add property')}
        </Button>
      </Box>
      {/* Statistics Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <HomeIcon sx={{ fontSize: 30, color: '#3E63DD' }} />
            <Typography variant="h6">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Total Properties')}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 30, color: '#65BA74' }} />
            <Typography variant="h6">{stats.active}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Active Listings')}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <PendingIcon sx={{ fontSize: 30, color: '#AA99EC' }} />
            <Typography variant="h6">{stats.draft}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Draft Properties')}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <GroupIcon sx={{ fontSize: 30, color: 'info.main' }} />
            <Typography variant="h6">{stats.tenantSelected}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Tenant Selected')}
            </Typography>
          </Card>
        </Grid>
      </Grid>
      
      {/* Property Cards */}
      <Box sx={{ display: 'flex', width: '100%', gap: '12px', flexWrap: 'wrap' }}>
        {properties.isLoading ? (
          <Box sx={{ width: '100%', textAlign: 'center', py: 5 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>{t('Loading properties...')}</Typography>
          </Box>
        ) : properties.error ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {t('Failed to load properties. Please try again.')}
          </Alert>
        ) : properties.data && properties.data.length > 0 ? (
          <>
            {properties.data.map((property) => {
              // Use status and a timestamp to force re-render when status changes
              const key = `${property.id}-${property.status}`;
              console.log(`[ListingManagement] Rendering PropertyCard with key: ${key}, status: ${property.status}`);
              return (
                <Box key={key}>
                  <PropertyCard
                    property={property}
                    setDeletePropertyModals={setDeletePropertyModals}
                    setPropertyDetailsModal={setPropertyDetailsModal}
                    setEditPropertyModal={setEditPropertyModal}
                    navigate={navigate}
                    tenantConfig={tenantConfigs[property.id]}
                    onStatusChange={handlePropertyStatusChange}
                    isUpdatingStatus={updatingPropertyId}
                  />
                </Box>
              );
            })}
          </>
        ) : (
          <Card sx={{ width: '100%', p: 4, textAlign: 'center' }}>
            <HomeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('No properties yet')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('Start by adding your first property to get tenant applications')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreatePropertyModal(true)}
            >
              {t('Add Your First Property')}
            </Button>
          </Card>
        )}
      </Box>

      {/* Tenant Questions Section */}

      <PropertyDetailsModal
        open={!!propertyDetailsModal}
        property={propertyDetailsModal}
        handleClose={() => setPropertyDetailsModal(null)}
        onEdit={(property) => {
          setPropertyDetailsModal(null);
          setEditPropertyModal(property);
        }}
      />
      <DeleteConfirmationModal
        open={!!deletePropertyModals}
        handleDelete={handleDeleteProperty}
        handleClose={() => setDeletePropertyModals(null)}
      />
      <PropertyCreationModal
        open={createPropertyModal}
        onClose={() => setCreatePropertyModal(false)}
        onImport={() => setShowImporter(true)}
      />
      
      <ManualPropertyModal
        open={manualPropertyModal}
        onClose={() => setManualPropertyModal(false)}
        onSubmit={handleManualPropertyCreate}
      />
      
      <ManualPropertyModal
        open={!!editPropertyModal}
        property={editPropertyModal}
        onClose={() => setEditPropertyModal(null)}
        onSubmit={handleManualPropertyUpdate}
        isEditing={true}
      />

      {/* Email Forwarding Instructions Modal */}
      <EmailForwardingModal
        property={emailForwardingModal}
        open={!!emailForwardingModal}
        onClose={() => setEmailForwardingModal(null)}
      />
      
      {/* Property Import Modal */}
      <Dialog
        open={showImporter}
        onClose={() => setShowImporter(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('Import Property')}
          <IconButton
            aria-label="close"
            onClick={() => setShowImporter(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PropertyImporter
            embedded={true}
            onPropertyImported={(property) => {
              setShowImporter(false);
              // No need to show email forwarding modal - it's integrated in the import flow
              // Refresh properties list since setup is now complete
              dispatch(fetchProperties());
              toast.success(t('Property imported and configured successfully!'));
            }}
            onClose={() => setShowImporter(false)}
            onFormStateChange={setImporterFormState}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ListingManagement;
