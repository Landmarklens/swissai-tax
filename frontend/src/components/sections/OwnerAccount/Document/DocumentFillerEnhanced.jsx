import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DOMPurify from 'dompurify';
import { createDocument, updateDocument } from '../../../../store/slices/documentsSlice';
import authService from '../../../../services/authService';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Badge,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  Avatar,
  Fab,
  Zoom,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import DrawIcon from '@mui/icons-material/Draw';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import SignaturePad from './SignaturePad';
import templateService from '../../../../services/templateService';
import emailService from '../../../../services/emailService';
import { validateField, formatCurrency, formatPhone, formatDate, getFieldType, validateAllFields } from '../../../../utils/validation';

// Styled Components
const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  maxHeight: 'calc(100vh - 120px)',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}));

const SidePanel = styled(Paper)(({ theme }) => ({
  width: '380px',
  backgroundColor: '#ffffff',
  borderRadius: '12px 0 0 12px',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #e0e0e0'
}));

const DocumentViewer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  overflowY: 'auto',
  overflowX: 'hidden',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  justifyContent: 'center'
}));

const DocumentPaper = styled(Paper)(({ theme }) => ({
  maxWidth: '850px',
  width: '100%',
  minHeight: '1100px',
  padding: '60px',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '60px',
    right: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)',
    borderRadius: '3px'
  }
}));

const FieldSection = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'completed'
})(({ theme, completed }) => ({
  marginBottom: theme.spacing(2),
  border: completed ? '2px solid #4caf50' : '1px solid #e0e0e0',
  backgroundColor: completed ? '#f1f8e9' : '#ffffff',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: '#e0e0e0',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)'
  }
}));

const FloatingHelp = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
  }
}));

const DocumentFillerEnhanced = ({ template, onSave, onClose, tenantApplications = [], documentId = null }) => {
  const dispatch = useDispatch();
  const properties = useSelector(state => state.properties?.properties?.data) || [];
  const user = useSelector(state => state.user?.user);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || null);
  const [expandedSections, setExpandedSections] = useState({ 
    'Party Information': true,
    'Property Details': true,
    'Lease Terms': true,
    'Signatures': true 
  });
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');
  const [completedSections, setCompletedSections] = useState(new Set());
  const [sendToTenantDialog, setSendToTenantDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [sentTenantInfo, setSentTenantInfo] = useState(null);
  const documentRef = useRef(null);

  // Define essential fields at component level (minimal set)
  const essentialFieldsList = [
    'landlord_name', 'tenant_name', 'business_name',
    'lease_holder', 'roommate_name',
    'property_address',
    'date', 'lease_start_date', 'lease_end_date', 'move_in_date',
    'monthly_rent', 'security_deposit', 'payment_due_day', 'rent_due_day',
    'lease_term', 'lease_term_months', 'lease_term_years',
    'permitted_use', 'cam_charges',
    'landlord_signature', 'tenant_signature',
    'landlord_sign_date', 'tenant_sign_date'
  ];

  // Extract essential fields from template content
  const extractEssentialFields = () => {
    if (!template?.templateData?.content) {
      return {};
    }
    
    const content = template.templateData.content;
    // Also check the HTML template for signature fields
    const fullContent = content + (template?.templateData?.html || '');
    const fieldMatches = fullContent.match(/\{\{(\w+)\}\}/g) || [];
    const extractedFields = fieldMatches.map(match => match.replace(/\{\{|\}\}/g, ''));
    
    // Define template-specific required fields
    const templateRequiredFields = {
      'lease-standard': ['landlord_name', 'tenant_name', 'property_address', 'monthly_rent', 'security_deposit', 'lease_start_date', 'lease_end_date'],
      'lease-commercial': ['landlord_name', 'business_name', 'property_address', 'monthly_rent', 'lease_term', 'permitted_use'],
      'lease-month-to-month': ['landlord_name', 'tenant_name', 'property_address', 'monthly_rent', 'date'],
      'lease-roommate': ['lease_holder', 'roommate_name', 'property_address', 'monthly_rent', 'security_deposit', 'move_in_date']
    };
    
    // Get required fields for current template
    const templateId = template?.id || '';
    const requiredFields = templateRequiredFields[templateId] || [];
    
    // Always include signature fields
    const signatureFields = ['landlord_signature', 'tenant_signature', 'landlord_sign_date', 'tenant_sign_date'];
    
    // Combine all required fields
    const allRequiredFields = [...requiredFields, ...signatureFields];
    
    // Ensure all required fields are included
    allRequiredFields.forEach(field => {
      if (!extractedFields.includes(field)) {
        extractedFields.push(field);
      }
    });
    
    // Filter to only include essential fields that actually exist in the template
    const templateEssentialFields = extractedFields.filter(field => 
      essentialFieldsList.includes(field)
    );
    
    // Organize into categories dynamically
    const categories = {
      'Party Information': [],
      'Property Details': [],
      'Lease Terms': [],
      'Signatures': []
    };
    
    templateEssentialFields.forEach(field => {
      if (field.includes('landlord_name') || field.includes('tenant_name') || field.includes('business_name') || 
          field.includes('lease_holder') || field.includes('roommate_name')) {
        categories['Party Information'].push(field);
      } else if (field.includes('property') || field.includes('address')) {
        categories['Property Details'].push(field);
      } else if (field.includes('permitted_use')) {
        categories['Property Details'].push(field);
      } else if (field.includes('signature') || field.includes('sign_date')) {
        categories['Signatures'].push(field);
      } else if (field.includes('rent') || field.includes('deposit') || field.includes('lease') || 
                 field.includes('date') || field.includes('term') || field.includes('payment') || 
                 field.includes('cam_charges') || field.includes('move_in')) {
        categories['Lease Terms'].push(field);
      }
    });
    
    // Remove empty categories except Signatures - always keep it
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0 && key !== 'Signatures') {
        delete categories[key];
      }
    });
    
    // Ensure Signatures section always exists with at least landlord signature
    if (!categories['Signatures'] || categories['Signatures'].length === 0) {
      categories['Signatures'] = ['landlord_signature', 'landlord_sign_date'];
    }
    
    console.log('Extracted categories:', categories);
    return categories;
  };

  // Get field categories dynamically based on template
  const fieldCategories = extractEssentialFields();

  useEffect(() => {
    if (template?.content) {
      setDocumentHtml(template.content);
      updateDocumentWithValues({});
    }
  }, [template]);

  const updateDocumentWithValues = (values) => {
    console.log('updateDocumentWithValues called with:', values);
    if (!template?.templateData) {
      console.log('No template data available');
      return;
    }
    
    console.log('Generating HTML with template:', template.templateData);
    const html = templateService.generateHtmlFromTemplate(template.templateData, values);
    console.log('Generated HTML contains signature:', html.includes('signature'));
    setDocumentHtml(html);
    
    // Check section completion - use dynamic field categories
    const newCompletedSections = new Set();
    const categories = extractEssentialFields();
    Object.entries(categories).forEach(([section, fields]) => {
      if (fields.length > 0) {
        // For signatures section, check if landlord signature exists
        if (section === 'Signatures') {
          const hasLandlordSignature = values['landlord_signature'] && values['landlord_signature'] !== '';
          if (hasLandlordSignature) {
            newCompletedSections.add(section);
          }
        } else {
          // For other sections, check if all fields are filled
          const filledFields = fields.filter(f => {
            // Skip tenant signature fields for completion check
            if (f.includes('tenant_signature') || f.includes('tenant_sign_date')) {
              return true; // Consider tenant fields as "filled" for completion purposes
            }
            return values[f] && values[f] !== '';
          });
          if (filledFields.length === fields.length) {
            newCompletedSections.add(section);
          }
        }
      }
    });
    setCompletedSections(newCompletedSections);
  };

  const handleFieldChange = (fieldKey, value) => {
    console.log('handleFieldChange called:', fieldKey, value);
    
    // Format value based on field type
    const fieldType = getFieldType(fieldKey);
    let formattedValue = value;
    
    if (fieldType === 'currency' && value) {
      formattedValue = formatCurrency(value);
    } else if (fieldType === 'phone' && value) {
      formattedValue = formatPhone(value);
    } else if (fieldType === 'date' && value) {
      formattedValue = formatDate(value);
    }
    
    // Validate the field
    const errors = validateField(fieldKey, formattedValue, essentialFieldsList.includes(fieldKey));
    
    if (errors.length > 0) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: errors[0] }));
    } else {
      // Clear error if validation passes
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
    
    const newValues = { ...fieldValues, [fieldKey]: formattedValue };
    setFieldValues(newValues);
    console.log('New field values:', newValues);
    updateDocumentWithValues(newValues);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getProgress = () => {
    // Count total essential fields from all categories
    const totalFields = Object.values(fieldCategories).flat().length;
    if (totalFields === 0) return 0;
    
    const filledFields = Object.keys(fieldValues).filter(key => fieldValues[key] !== '').length;
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  };

  const handleSave = async () => {
    // Get fields from the template
    const templateFields = extractEssentialFields();
    const existingFields = Object.keys(templateFields).reduce((acc, category) => {
      return [...acc, ...templateFields[category]];
    }, []);
    
    // Validate only the fields that exist in the current template
    const fieldsToValidate = existingFields.map(field => ({
      name: field,
      required: essentialFieldsList.includes(field)
    }));
    
    const validation = validateAllFields(fieldsToValidate, fieldValues);
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      alert('Please fill in all required fields correctly before saving.');
      return;
    }
    
    setIsSaving(true);
    try {
      const documentData = {
        property_id: selectedPropertyId || properties[0]?.id || 1, // Use selected property or first property
        document_type: template.type || 'lease', // Use template type or default to 'lease'
        name: template.name || 'Document', // Use template name
        template_id: template.id,
        template_name: template.name,
        field_values: fieldValues,
        status: 'draft', // Save as draft
        document_html: documentHtml,
        created_at: new Date().toISOString(),
        legal_name: fieldValues.landlord_name || user?.name || null,
        renter_full_name: fieldValues.tenant_name || null,
        signature: fieldValues.landlord_signature || null,
        tenant_name: fieldValues.tenant_name || null
      };

      if (documentId) {
        // Update existing document
        await dispatch(updateDocument({ 
          documentId, 
          body: documentData 
        })).unwrap();
        console.log('Document updated as draft');
      } else {
        // Create new document
        const result = await dispatch(createDocument(documentData)).unwrap();
        console.log('Document saved as draft:', result);
      }
      
      if (onSave) {
        onSave({ ...documentData, id: documentId });
      }
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    // Create a new window with only the document content
    const printWindow = window.open('', '_blank');
    const documentContent = documentRef.current?.innerHTML || documentHtml;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${template?.name || 'Document'}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 20px;
              color: #000;
            }
            @media print {
              body { margin: 0; }
            }
            .signature-section { 
              page-break-inside: avoid;
              margin-top: 60px;
            }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${documentContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const renderFieldInput = (fieldKey, field) => {
    const value = fieldValues[fieldKey] || '';
    const error = fieldErrors[fieldKey];
    
    // Create field definition if it doesn't exist
    const fieldDef = field || {
      label: fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: fieldKey.includes('date') ? 'date' : 
            fieldKey.includes('signature') ? 'signature' :
            fieldKey.includes('rent') || fieldKey.includes('deposit') || fieldKey.includes('cam_charges') ? 'currency' :
            fieldKey.includes('lease_term_months') || fieldKey.includes('lease_term_years') || fieldKey.includes('payment_due_day') ? 'number' :
            'text',
      required: true
    };

    const commonProps = {
      fullWidth: true,
      size: 'small',
      value: value,
      onChange: (e) => handleFieldChange(fieldKey, e.target.value),
      error: !!error,
      helperText: error,
      sx: { backgroundColor: 'white' }
    };

    switch (fieldDef.type) {
      case 'number':
      case 'currency':
        return (
          <TextField
            {...commonProps}
            type="text"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            inputProps={{
              pattern: '[0-9]*',
              inputMode: 'decimal'
            }}
          />
        );

      case 'date':
        // Make sign date fields read-only if they're for signatures
        const isSignDate = fieldKey.includes('sign_date');
        const isLandlordSignDate = fieldKey.includes('landlord_sign_date');
        const isTenantSignDate = fieldKey.includes('tenant_sign_date');
        
        if (isTenantSignDate) {
          return (
            <TextField
              {...commonProps}
              type="date"
              disabled
              InputLabelProps={{ shrink: true }}
              placeholder="Will be set when tenant signs"
              sx={{ backgroundColor: '#f5f5f5' }}
            />
          );
        }
        
        if (isLandlordSignDate) {
          return (
            <TextField
              {...commonProps}
              type="date"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true
              }}
              helperText={value ? "Auto-filled when signed" : "Will be set when you sign"}
            />
          );
        }
        
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'signature':
        // Only allow landlord to sign their own signature
        const isLandlordSignature = fieldKey.includes('landlord');
        const isTenantSignature = fieldKey.includes('tenant');
        
        if (isTenantSignature) {
          return (
            <Box>
              <Button
                fullWidth
                variant="outlined"
                disabled
                sx={{ 
                  height: '50px',
                  backgroundColor: '#f5f5f5',
                  border: '2px dashed #ccc'
                }}
              >
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="caption">Tenant Signature</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Will be added by tenant
                  </Typography>
                </Stack>
              </Button>
            </Box>
          );
        }
        
        return (
          <Box>
            {value && value.type === 'type' ? (
              <Box sx={{ 
                p: 2, 
                border: '2px solid #4caf50',
                borderRadius: 1,
                backgroundColor: '#e8f5e9',
                textAlign: 'center'
              }}>
                <Typography 
                  style={{ 
                    fontFamily: value.font || 'Dancing Script', 
                    fontSize: `${value.fontSize || 48}px` 
                  }}
                >
                  {value.text}
                </Typography>
              </Box>
            ) : value && value.type === 'draw' ? (
              <Box sx={{ 
                border: '2px solid #4caf50',
                borderRadius: 1,
                backgroundColor: '#e8f5e9',
                p: 1
              }}>
                <img src={value.data} alt="Signature" style={{ width: '100%', height: 'auto' }} />
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<DrawIcon />}
                onClick={() => {
                  setCurrentSignatureField(fieldKey);
                  setSignatureDialogOpen(true);
                }}
                sx={{ 
                  height: '50px',
                  border: '2px solid #2196f3',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="body2" fontWeight="600">
                    Click Here to Sign
                  </Typography>
                  <Typography variant="caption" color="primary">
                    Add your signature
                  </Typography>
                </Stack>
              </Button>
            )}
          </Box>
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <MainContainer>
      {/* Side Panel with Fields */}
      <SidePanel elevation={0}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Fill Document Details
          </Typography>
          
          {/* Property Selector */}
          {properties.length > 0 && (
            <FormControl fullWidth size="small" sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Select Property</InputLabel>
              <Select
                value={selectedPropertyId || ''}
                label="Select Property"
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.address || property.name || `Property ${property.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="600" color="primary">
                {Math.round(getProgress())}%
              </Typography>
            </Box>
            <ProgressBar variant="determinate" value={getProgress()} />
          </Box>
        </Box>

        {/* Field Sections */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {Object.entries(fieldCategories).map(([section, fields]) => {
            // Show all fields from the extracted essential fields
            const sectionFields = fields;
            if (sectionFields.length === 0) return null;
            
            const isCompleted = completedSections.has(section);
            const isExpanded = expandedSections[section] !== false;

            return (
              <FieldSection key={section} completed={isCompleted}>
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection(section)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isCompleted ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <RadioButtonUncheckedIcon color="action" />
                      )}
                      <Typography variant="subtitle1" fontWeight="600">
                        {section}
                      </Typography>
                      {section === 'Signatures' && !isCompleted && (
                        <Chip 
                          label="Action Required" 
                          size="small" 
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <IconButton size="small">
                      {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {sectionFields.map(fieldKey => {
                        const field = template?.fields?.[fieldKey];
                        const fieldLabel = field?.label || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        const isRequired = field?.required !== false; // Default to required
                        return (
                          <Box key={fieldKey}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {fieldLabel}
                              {isRequired && <span style={{ color: '#f44336' }}> *</span>}
                            </Typography>
                            {renderFieldInput(fieldKey, field)}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </CardContent>
              </FieldSection>
            );
          })}
        </Box>

      </SidePanel>

      {/* Document Viewer */}
      <DocumentViewer>
        <DocumentPaper ref={documentRef}>
          {/* Help Tooltip */}
          <Tooltip title="Click on any highlighted field to edit it" placement="top">
            <IconButton
              sx={{ position: 'absolute', top: 10, right: 10 }}
              color="primary"
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          {/* Document Content */}
          <Box 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentHtml, {
              ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                            'section', 'br', 'strong', 'em', 'u', 'img', 'table', 
                            'tr', 'td', 'th', 'tbody', 'thead'],
              ALLOWED_ATTR: ['style', 'class', 'id', 'data-field', 'src', 'alt', 
                            'width', 'height', 'onmouseover', 'onmouseout', 'onclick'],
              ALLOWED_STYLES: {
                '*': {
                  'color': [/.*/],
                  'background-color': [/.*/],
                  'font-size': [/.*/],
                  'font-family': [/.*/],
                  'font-weight': [/.*/],
                  'text-align': [/.*/],
                  'border': [/.*/],
                  'padding': [/.*/],
                  'margin': [/.*/],
                  'display': [/.*/],
                  'width': [/.*/],
                  'height': [/.*/],
                  'max-width': [/.*/],
                  'max-height': [/.*/],
                  'line-height': [/.*/]
                }
              }
            }) }}
            onClick={(e) => {
              // Handle field clicks in the document
              if (e.target.classList.contains('field-placeholder')) {
                const fieldName = e.target.getAttribute('data-field');
                // Find and expand the section containing this field
                Object.entries(fieldCategories).forEach(([section, fields]) => {
                  if (fields.includes(fieldName)) {
                    setExpandedSections(prev => ({ ...prev, [section]: true }));
                    // Scroll to the field in the sidebar
                    setTimeout(() => {
                      const element = document.querySelector(`[data-field-input="${fieldName}"]`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }
                });
              }
            }}
          />
        </DocumentPaper>
      </DocumentViewer>

      {/* Right Side Action Panel */}
      <Paper 
        elevation={0}
        sx={{ 
          width: '200px',
          backgroundColor: '#ffffff',
          borderRadius: '0 12px 12px 0',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e0e0e0',
          p: 2
        }}
      >
        <Stack spacing={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={() => {
              // Get fields from the template
              const templateFields = extractEssentialFields();
              const existingFields = Object.keys(templateFields).reduce((acc, category) => {
                return [...acc, ...templateFields[category]];
              }, []);
              
              // Exclude tenant-specific fields from validation when sending to tenant
              // These will be filled by the tenant after receiving the document
              const tenantFields = [
                'tenant_signature', 
                'tenant_sign_date',
                'tenant_name',
                'tenant_email',
                'tenant_phone',
                'roommate_name'  // In case of roommate agreement
              ];
              const fieldsToValidateBeforeSending = existingFields.filter(field => 
                !tenantFields.includes(field)
              );
              
              // Validate only the landlord's fields (tenant will fill their fields later)
              const fieldsToValidate = fieldsToValidateBeforeSending.map(field => ({
                name: field,
                required: essentialFieldsList.includes(field)
              }));
              
              const validation = validateAllFields(fieldsToValidate, fieldValues);
              
              if (!validation.isValid) {
                setFieldErrors(validation.errors);
                alert('Please fill in all required fields correctly before sending to tenant.');
                return;
              }
              
              setSendToTenantDialog(true);
            }}
            disabled={tenantApplications.length === 0 || !fieldValues.landlord_signature?.data}
            sx={{
              background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)'
              }
            }}
          >
            Send to Tenant for Signature
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Document
          </Button>
          
          <Divider sx={{ my: 2 }} />
          
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={onClose}
          >
            Cancel
          </Button>
        </Stack>
      </Paper>

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <SignaturePad
          onSave={(signature) => {
            console.log('Signature saved:', signature);
            console.log('Current signature field:', currentSignatureField);
            if (currentSignatureField) {
              // Update both signature and date at once to preserve values
              const today = new Date().toISOString().split('T')[0];
              const updates = {
                [currentSignatureField]: signature
              };
              
              if (currentSignatureField.includes('landlord')) {
                console.log('Setting landlord sign date:', today);
                updates['landlord_sign_date'] = today;
              } else if (currentSignatureField.includes('tenant')) {
                console.log('Setting tenant sign date:', today);
                updates['tenant_sign_date'] = today;
              }
              
              // Update all values at once
              const newValues = { ...fieldValues, ...updates };
              console.log('Updating field values with:', newValues);
              setFieldValues(newValues);
              updateDocumentWithValues(newValues);
              
              // Clear errors if any
              if (fieldErrors[currentSignatureField]) {
                setFieldErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[currentSignatureField];
                  return newErrors;
                });
              }
            }
            setSignatureDialogOpen(false);
          }}
          onCancel={() => {
            console.log('Signature dialog cancelled');
            setSignatureDialogOpen(false);
          }}
        />
      </Dialog>

      {/* Floating Help Button */}
      <FloatingHelp onClick={() => setShowHelp(!showHelp)}>
        <AutoAwesomeIcon />
      </FloatingHelp>

      {/* Help Dialog */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)}>
        <DialogTitle>How to Use</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="info" icon={<InfoIcon />}>
              Fill in the fields on the left panel. Your changes will appear in real-time in the document.
            </Alert>
            <Typography variant="body2">
              • <strong>Orange fields</strong> are empty and need to be filled
            </Typography>
            <Typography variant="body2">
              • <strong>Green fields</strong> have been completed
            </Typography>
            <Typography variant="body2">
              • Click any field in the document to jump to it in the form
            </Typography>
            <Typography variant="body2">
              • Required fields are marked with a red asterisk (*)
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Got it!</Button>
        </DialogActions>
      </Dialog>

      {/* Send to Tenant Dialog */}
      <Dialog 
        open={sendToTenantDialog} 
        onClose={() => setSendToTenantDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Send Document for Signature
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setSendToTenantDialog(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="info" icon={<InfoIcon />}>
              Select a tenant from your property applications to send this document for their signature.
            </Alert>
            
            <Autocomplete
              options={tenantApplications}
              getOptionLabel={(option) => `${option.name} - ${option.property || 'Property'}`}
              value={selectedTenant}
              onChange={(event, newValue) => setSelectedTenant(newValue)}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Stack>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email} • Applied: {option.applicationDate || 'Recently'}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Tenant" 
                  placeholder="Choose a tenant..."
                  helperText="Only approved tenant applications are shown"
                />
              )}
            />

            {selectedTenant && (
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Document will be sent to:
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedTenant.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTenant.email}
                </Typography>
              </Paper>
            )}

            <Alert severity="warning" icon={<WarningAmberIcon />}>
              The tenant will receive an email with a link to review and sign this document. 
              You will be notified once they complete their signature.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendToTenantDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            startIcon={<SendIcon />}
            onClick={async () => {
              // Handle sending document to tenant
              if (selectedTenant) {
                setIsSaving(true);
                try {
                  const documentData = {
                    property_id: selectedPropertyId || properties[0]?.id || 1, // Use selected property or first property
                    document_type: template.type || 'lease', // Use template type or default to 'lease'
                    name: template.name || 'Document', // Use template name
                    template_id: template.id,
                    template_name: template.name,
                    field_values: fieldValues,
                    status: 'pending_tenant_signature', // Update status
                    document_html: documentHtml,
                    tenant_id: selectedTenant.id,
                    tenant_email: selectedTenant.email,
                    sent_to_tenant_at: new Date().toISOString(),
                    legal_name: fieldValues.landlord_name || user?.name || null,
                    renter_full_name: fieldValues.tenant_name || selectedTenant.name || null,
                    signature: fieldValues.landlord_signature || null,
                    tenant_name: fieldValues.tenant_name || selectedTenant.name || null
                  };

                  // Save or update document first
                  let savedDocumentId = documentId;
                  if (documentId) {
                    await dispatch(updateDocument({ 
                      documentId, 
                      body: documentData 
                    })).unwrap();
                  } else {
                    const result = await dispatch(createDocument(documentData)).unwrap();
                    // The backend returns document_id, not id
                    savedDocumentId = result.document_id || result.id || result.documentId;
                    console.log('Created document with ID:', savedDocumentId);
                  }
                  
                  // Call backend API to send document to tenant
                  const sendToTenantData = {
                    tenant_email: selectedTenant.email,
                    tenant_name: selectedTenant.name,
                    field_values: fieldValues
                  };
                  
                  // Get the correct auth token using authService
                  const authToken = authService.getToken();
                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                  
                  console.log('Sending document to tenant:', {
                    documentId: savedDocumentId,
                    url: `${apiUrl}/api/documents/${savedDocumentId}/send-to-tenant`,
                    hasToken: !!authToken,
                    tokenPrefix: authToken ? authToken.substring(0, 10) : 'none'
                  });
                  
                  // Only send to backend if we have a numeric document ID (from database)
                  if (typeof savedDocumentId === 'number' || !isNaN(parseInt(savedDocumentId))) {
                    const response = await fetch(`${apiUrl}/api/documents/${savedDocumentId}/send-to-tenant`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                      },
                      body: JSON.stringify(sendToTenantData)
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.detail || `Failed to send document: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    console.log('Document sent to tenant successfully:', result);
                  } else {
                    // If document ID is a string (localStorage), just mark as sent locally
                    console.log('Document saved locally and marked as sent to tenant');
                  }
                  
                  // Store tenant info for success dialog
                  setSentTenantInfo(selectedTenant);
                  setSendToTenantDialog(false);
                  setSuccessDialog(true);
                  
                  // Close everything after showing success
                  setTimeout(() => {
                    setSuccessDialog(false);
                    if (onSave) {
                      onSave(documentData);
                    }
                    if (onClose) {
                      onClose();
                    }
                  }, 3000);
                } catch (error) {
                  console.error('Error sending to tenant:', error);
                } finally {
                  setIsSaving(false);
                }
              }
            }}
            disabled={!selectedTenant || isSaving}
            sx={{
              background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)'
              }
            }}
          >
            Send for Signature
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog 
        open={successDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 5, color: 'white' }}>
          <CheckCircleIcon sx={{ fontSize: 80, mb: 3, color: '#4caf50' }} />
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'white' }}>
            Document Sent Successfully!
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, color: 'rgba(255,255,255,0.9)' }}>
            {sentTenantInfo?.name} will receive an email with instructions to sign the document.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            You will be notified once the document is signed.
          </Typography>
        </DialogContent>
      </Dialog>
    </MainContainer>
  );
};

export default DocumentFillerEnhanced;