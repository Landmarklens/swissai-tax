import React, { useState, useEffect, useRef } from 'react';
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
  Badge,
  Stack,
  LinearProgress,
  Zoom,
  Fade,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  SpeedDial,
  SpeedDialAction
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DrawIcon from '@mui/icons-material/Draw';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ShareIcon from '@mui/icons-material/Share';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import { getTemplateById } from './templates/documentTemplates';
import SignaturePad from './SignaturePad';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
  50% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.8); }
  100% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
`;

// Styled Components
const DocumentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.grey[100],
  position: 'relative',
  overflow: 'hidden'
}));

const DocumentViewer = styled(Paper)(({ theme, zoom }) => ({
  width: '816px', // US Letter width at 96 DPI
  minHeight: '1056px', // US Letter height at 96 DPI
  margin: '40px auto',
  padding: '60px',
  backgroundColor: 'white',
  boxShadow: theme.shadows[5],
  transform: `scale(${zoom / 100})`,
  transformOrigin: 'top center',
  transition: 'transform 0.3s ease',
  cursor: 'default',
  position: 'relative',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.6,
  '& h1': {
    fontSize: '18pt',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '24px'
  },
  '& h2': {
    fontSize: '14pt',
    fontWeight: 'bold',
    marginTop: '20px',
    marginBottom: '12px'
  },
  '& h3': {
    fontSize: '12pt',
    fontWeight: 'bold',
    marginTop: '16px',
    marginBottom: '8px',
    textDecoration: 'underline'
  },
  '& p': {
    marginBottom: '12px',
    textAlign: 'justify'
  }
}));

const FieldPlaceholder = styled('span', {
  shouldForwardProp: (prop) => prop !== 'filled' && prop !== 'error' && prop !== 'active' && prop !== 'required'
})(({ theme, filled, error, active, required }) => ({
  display: 'inline-block',
  padding: '2px 8px',
  margin: '0 2px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  minWidth: filled ? 'auto' : '120px',
  
  backgroundColor: filled 
    ? theme.palette.success.light + '20'
    : error 
    ? theme.palette.error.light + '20'
    : active
    ? theme.palette.primary.light + '30'
    : theme.palette.action.hover,
    
  border: `2px ${filled ? 'solid' : 'dashed'} ${
    filled 
      ? theme.palette.success.main
      : error
      ? theme.palette.error.main
      : active
      ? theme.palette.primary.main
      : theme.palette.primary.light
  }`,
  
  color: filled
    ? theme.palette.text.primary
    : theme.palette.text.secondary,
    
  fontWeight: filled ? 500 : 400,
  
  '&:hover': {
    backgroundColor: active 
      ? theme.palette.primary.light + '40'
      : theme.palette.primary.light + '20',
    borderColor: theme.palette.primary.main,
    animation: `${pulse} 0.5s ease`,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2]
  },
  
  '&::before': required && !filled ? {
    content: '"*"',
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    color: theme.palette.error.main,
    fontWeight: 'bold',
    fontSize: '14px'
  } : {},
  
  ...(active && {
    animation: `${glow} 2s infinite`,
    zIndex: 10
  })
}));

const SignatureBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'signed'
})(({ theme, signed }) => ({
  border: `2px ${signed ? 'solid' : 'dashed'} ${signed ? theme.palette.success.main : theme.palette.grey[400]}`,
  borderRadius: '8px',
  padding: '16px',
  minHeight: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backgroundColor: signed ? theme.palette.success.light + '10' : theme.palette.grey[50],
  transition: 'all 0.3s ease',
  marginTop: '8px',
  marginBottom: '8px',
  
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2]
  }
}));

const Sidebar = styled(Box)(({ theme }) => ({
  width: '320px',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.shadows[3]
}));

const FieldListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'completed' && prop !== 'active'
})(({ theme, completed, active }) => ({
  borderRadius: '8px',
  marginBottom: '8px',
  transition: 'all 0.3s ease',
  backgroundColor: active 
    ? theme.palette.primary.light + '20'
    : completed 
    ? theme.palette.success.light + '10'
    : 'transparent',
  border: `1px solid ${
    active 
      ? theme.palette.primary.main
      : completed
      ? theme.palette.success.main
      : 'transparent'
  }`,
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(4px)'
  }
}));

const ProgressHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const FloatingToolbar = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: theme.spacing(1),
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  zIndex: 1000,
  borderRadius: '24px',
  boxShadow: theme.shadows[4]
}));

const DocumentFillerRealtime = ({ templateId, templateData, onComplete, onCancel }) => {
  const [template, setTemplate] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [errors, setErrors] = useState({});
  const [zoom, setZoom] = useState(100);
  const [showFieldList, setShowFieldList] = useState(true);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState(null);
  const [documentHtml, setDocumentHtml] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  const documentRef = useRef(null);
  const viewerRef = useRef(null);

  // Load template
  useEffect(() => {
    // First check if template data is passed directly
    if (templateData) {
      // Use the passed template data
      const loadedTemplate = {
        ...templateData,
        template: templateData.content || templateData.template || ''
      };
      setTemplate(loadedTemplate);
      
      // Initialize field values
      const initialValues = {};
      if (loadedTemplate.fields) {
        Object.entries(loadedTemplate.fields).forEach(([key, field]) => {
          initialValues[key] = field.default || '';
        });
      }
      setFieldValues(initialValues);
      
      // Generate initial HTML with placeholders
      generateDocumentHtml(loadedTemplate, initialValues);
    } else if (templateId) {
      // Fallback to loading by ID
      const loadedTemplate = getTemplateById(templateId);
      if (loadedTemplate) {
        setTemplate(loadedTemplate);
        
        // Initialize field values
        const initialValues = {};
        Object.entries(loadedTemplate.fields).forEach(([key, field]) => {
          initialValues[key] = field.default || '';
        });
        setFieldValues(initialValues);
        
        // Generate initial HTML with placeholders
        generateDocumentHtml(loadedTemplate, initialValues);
      }
    }
  }, [templateId, templateData]);

  // Generate document HTML with clickable fields
  const generateDocumentHtml = (template, values) => {
    if (!template) return;
    
    let html = template.template;
    
    // Replace field placeholders with interactive elements
    Object.entries(template.fields).forEach(([fieldKey, field]) => {
      const value = values[fieldKey];
      const isFilled = value && value !== '';
      const hasError = errors[fieldKey];
      const isActive = activeField === fieldKey;
      
      // Create replacement HTML based on field type
      let replacement = '';
      
      if (field.type === 'signature') {
        replacement = `
          <div class="signature-field" data-field="${fieldKey}" style="margin: 16px 0;">
            <p style="margin-bottom: 8px;">${field.label}:</p>
            ${isFilled ? 
              `<div class="signature-box signed">
                ${value.type === 'draw' ? 
                  `<img src="${value.data}" style="max-height: 60px;" />` :
                  `<span style="font-family: ${value.font}; font-size: ${value.fontSize}px;">${value.text}</span>`
                }
              </div>` :
              `<div class="signature-box unsigned">
                <span style="color: #999;">Click to add signature</span>
              </div>`
            }
          </div>
        `;
      } else {
        const displayValue = isFilled ? 
          (field.type === 'currency' ? `$${value}` : 
           field.type === 'multiselect' && Array.isArray(value) ? value.join(', ') :
           value) : 
          `[${field.label}]`;
          
        replacement = `<span 
          class="field-placeholder ${isFilled ? 'filled' : ''} ${hasError ? 'error' : ''} ${isActive ? 'active' : ''}"
          data-field="${fieldKey}"
          data-required="${field.required}"
          style="
            display: inline-block;
            padding: 2px 8px;
            margin: 0 2px;
            border-radius: 4px;
            cursor: pointer;
            background-color: ${isFilled ? '#c8e6c9' : hasError ? '#ffcdd2' : isActive ? '#bbdefb' : '#f5f5f5'};
            border: 2px ${isFilled ? 'solid' : 'dashed'} ${isFilled ? '#4caf50' : hasError ? '#f44336' : isActive ? '#2196f3' : '#999'};
            color: ${isFilled ? '#000' : '#666'};
            font-weight: ${isFilled ? '500' : '400'};
            min-width: ${isFilled ? 'auto' : '120px'};
          "
        >${displayValue}</span>`;
      }
      
      const regex = new RegExp(`{{${fieldKey}}}`, 'g');
      html = html.replace(regex, replacement);
    });
    
    setDocumentHtml(html);
  };

  // Update document when field values change
  useEffect(() => {
    if (template) {
      generateDocumentHtml(template, fieldValues);
    }
  }, [fieldValues, errors, activeField, template]);

  // Handle field click in document
  useEffect(() => {
    if (!documentRef.current) return;
    
    const handleFieldClick = (e) => {
      const fieldElement = e.target.closest('[data-field]');
      if (fieldElement) {
        const fieldKey = fieldElement.dataset.field;
        setActiveField(fieldKey);
        
        // Scroll sidebar to show active field
        const fieldListItem = document.getElementById(`field-${fieldKey}`);
        if (fieldListItem) {
          fieldListItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    
    const handleSignatureClick = (e) => {
      const signatureBox = e.target.closest('.signature-box');
      if (signatureBox) {
        const fieldElement = signatureBox.closest('[data-field]');
        if (fieldElement) {
          const fieldKey = fieldElement.dataset.field;
          setCurrentSignatureField(fieldKey);
          setSignatureDialogOpen(true);
        }
      }
    };
    
    documentRef.current.addEventListener('click', handleFieldClick);
    documentRef.current.addEventListener('click', handleSignatureClick);
    
    return () => {
      if (documentRef.current) {
        documentRef.current.removeEventListener('click', handleFieldClick);
        documentRef.current.removeEventListener('click', handleSignatureClick);
      }
    };
  }, [documentRef.current]);

  // Handle field value change
  const handleFieldChange = (key, value) => {
    // Save to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...fieldValues });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length);
    
    // Update field value
    setFieldValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    
    // Auto-advance to next field
    const fields = Object.keys(template.fields);
    const currentIndex = fields.indexOf(key);
    if (currentIndex < fields.length - 1 && value) {
      const nextField = fields[currentIndex + 1];
      if (!fieldValues[nextField]) {
        setActiveField(nextField);
      }
    }
  };

  // Validate field
  const validateField = (key, value, field) => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }
    
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return 'Invalid phone number';
      }
    }
    
    return null;
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    let hasErrors = false;
    
    Object.entries(template.fields).forEach(([key, field]) => {
      const error = validateField(key, fieldValues[key], field);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });
    
    setErrors(newErrors);
    setShowValidation(true);
    return !hasErrors;
  };

  // Handle signature save
  const handleSignatureSave = (signatureData) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, signatureData);
    }
    setSignatureDialogOpen(false);
    setCurrentSignatureField(null);
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!template) return 0;
    const totalFields = Object.keys(template.fields).length;
    const filledFields = Object.values(fieldValues).filter(v => v && v !== '').length;
    return (filledFields / totalFields) * 100;
  };

  // Get field icon
  const getFieldIcon = (field) => {
    if (field.type === 'signature') return <DrawIcon />;
    if (field.type === 'currency') return <AttachMoneyIcon />;
    if (field.type === 'date') return <CalendarTodayIcon />;
    if (field.type === 'email') return <PersonIcon />;
    if (field.type === 'tel') return <PersonIcon />;
    if (field.type === 'select' || field.type === 'multiselect') return <CheckBoxIcon />;
    if (field.label.toLowerCase().includes('address')) return <HomeIcon />;
    return <TextFieldsIcon />;
  };

  // Render field input in sidebar
  const renderFieldInput = (fieldKey, field) => {
    const value = fieldValues[fieldKey] || '';
    const error = showValidation ? errors[fieldKey] : null;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
            placeholder={field.label}
            type={field.type === 'email' ? 'email' : 'text'}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
            type="number"
            inputProps={{ min: field.min, max: field.max }}
          />
        );
      
      case 'currency':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth size="small" error={!!error}>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select {field.label}</em>
              </MenuItem>
              {field.options?.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );
      
      case 'multiselect':
        return (
          <FormControl fullWidth size="small" error={!!error}>
            <FormGroup>
              {field.options?.map(option => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      size="small"
                      checked={Array.isArray(value) ? value.includes(option) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleFieldChange(fieldKey, [...currentValues, option]);
                        } else {
                          handleFieldChange(fieldKey, currentValues.filter(v => v !== option));
                        }
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
            multiline
            rows={3}
          />
        );
      
      case 'signature':
        return (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DrawIcon />}
            onClick={() => {
              setCurrentSignatureField(fieldKey);
              setSignatureDialogOpen(true);
            }}
            color={value ? 'success' : 'primary'}
          >
            {value ? 'Change Signature' : 'Add Signature'}
          </Button>
        );
      
      default:
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            error={!!error}
            helperText={error}
          />
        );
    }
  };

  // Handle undo/redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFieldValues(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFieldValues(history[historyIndex + 1]);
    }
  };

  // Handle complete
  const handleComplete = () => {
    if (validateAll()) {
      if (onComplete) {
        onComplete({
          templateId,
          fieldValues,
          html: documentHtml
        });
      }
    }
  };

  if (!template) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DocumentContainer>
      {/* Floating Toolbar */}
      <FloatingToolbar elevation={3}>
        <IconButton size="small" onClick={() => setShowFieldList(!showFieldList)}>
          {showFieldList ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
        
        <Divider orientation="vertical" flexItem />
        
        <IconButton size="small" onClick={handleUndo} disabled={historyIndex <= 0}>
          <UndoIcon />
        </IconButton>
        <IconButton size="small" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
          <RedoIcon />
        </IconButton>
        
        <Divider orientation="vertical" flexItem />
        
        <ToggleButtonGroup
          value={zoom}
          exclusive
          onChange={(e, newZoom) => newZoom && setZoom(newZoom)}
          size="small"
        >
          <ToggleButton value={75}>
            <ZoomOutIcon />
          </ToggleButton>
          <ToggleButton value={100}>100%</ToggleButton>
          <ToggleButton value={125}>
            <ZoomInIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Divider orientation="vertical" flexItem />
        
        <IconButton size="small" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
        
        <IconButton size="small">
          <PrintIcon />
        </IconButton>
        
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleComplete}
        >
          Complete & Send
        </Button>
      </FloatingToolbar>

      {/* Main Document Viewer */}
      <Box 
        ref={viewerRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          pt: 10
        }}
      >
        <DocumentViewer 
          ref={documentRef}
          zoom={zoom}
          elevation={3}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: documentHtml }}
            style={{ width: '100%' }}
          />
        </DocumentViewer>
      </Box>

      {/* Sidebar with Fields */}
      <Zoom in={showFieldList}>
        <Sidebar>
          {/* Progress Header */}
          <ProgressHeader>
            <Typography variant="h6" gutterBottom>
              {template.name}
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Progress</Typography>
                <Typography variant="caption">{Math.round(calculateProgress())}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={calculateProgress()} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {Object.values(fieldValues).filter(v => v && v !== '').length} of {Object.keys(template.fields).length} fields completed
            </Typography>
          </ProgressHeader>

          {/* Active Field Editor */}
          {activeField && (
            <Box sx={{ p: 2, bgcolor: 'primary.light', bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" gutterBottom>
                {template.fields[activeField].label}
                {template.fields[activeField].required && (
                  <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                )}
              </Typography>
              {renderFieldInput(activeField, template.fields[activeField])}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    const fields = Object.keys(template.fields);
                    const currentIndex = fields.indexOf(activeField);
                    if (currentIndex > 0) {
                      setActiveField(fields[currentIndex - 1]);
                    }
                  }}
                  startIcon={<NavigateBeforeIcon />}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const fields = Object.keys(template.fields);
                    const currentIndex = fields.indexOf(activeField);
                    if (currentIndex < fields.length - 1) {
                      setActiveField(fields[currentIndex + 1]);
                    }
                  }}
                  endIcon={<NavigateNextIcon />}
                  variant="contained"
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Field List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            <List dense>
              {Object.entries(template.fields).map(([fieldKey, field]) => {
                const isFilled = fieldValues[fieldKey] && fieldValues[fieldKey] !== '';
                const hasError = showValidation && errors[fieldKey];
                const isActive = activeField === fieldKey;
                
                return (
                  <FieldListItem
                    key={fieldKey}
                    id={`field-${fieldKey}`}
                    button
                    onClick={() => setActiveField(fieldKey)}
                    completed={isFilled}
                    active={isActive}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {isFilled ? (
                        <CheckCircleIcon color="success" />
                      ) : hasError ? (
                        <ErrorIcon color="error" />
                      ) : (
                        getFieldIcon(field)
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={field.label}
                      secondary={
                        isFilled ? (
                          field.type === 'signature' ? 'Signed' :
                          field.type === 'currency' ? `$${fieldValues[fieldKey]}` :
                          Array.isArray(fieldValues[fieldKey]) ? fieldValues[fieldKey].join(', ') :
                          fieldValues[fieldKey]
                        ) : (
                          field.required ? 'Required' : 'Optional'
                        )
                      }
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                        color: hasError ? 'error' : 'textPrimary'
                      }}
                    />
                    {field.required && !isFilled && (
                      <Badge badgeContent="*" color="error" />
                    )}
                  </FieldListItem>
                );
              })}
            </List>
          </Box>

          {/* Actions */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {showValidation && Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Please fill all required fields
              </Alert>
            )}
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowValidation(true)}
                startIcon={<CheckCircleIcon />}
              >
                Validate Document
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleComplete}
                startIcon={<SendIcon />}
                disabled={calculateProgress() < 100}
              >
                Complete & Send
              </Button>
            </Stack>
          </Box>
        </Sidebar>
      </Zoom>

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setSignatureDialogOpen(false)}
        />
      </Dialog>
    </DocumentContainer>
  );
};

export default DocumentFillerRealtime;