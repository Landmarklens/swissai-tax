import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Toolbar,
  AppBar,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Drawer,
  Fab,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DrawIcon from '@mui/icons-material/Draw';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Styled components
const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 200px)',
  backgroundColor: theme.palette.grey[100],
}));

const EditorSidebar = styled(Box)(({ theme }) => ({
  width: 280,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const EditorCanvas = styled(Paper)(({ theme }) => ({
  flex: 1,
  margin: theme.spacing(3),
  padding: theme.spacing(4),
  minHeight: '842px', // A4 height in pixels at 96 DPI
  maxWidth: '595px', // A4 width in pixels at 96 DPI
  backgroundColor: 'white',
  boxShadow: theme.shadows[3],
  position: 'relative',
  overflow: 'auto',
}));

const FieldPlaceholder = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.action.hover,
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(0.5),
  minWidth: 120,
  cursor: 'pointer',
  margin: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    borderStyle: 'solid',
  },
}));

const SignatureField = styled(Box)(({ theme }) => ({
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  minHeight: 100,
  backgroundColor: theme.palette.grey[50],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const DocumentEditor = ({ document, template, onSave, onSend }) => {
  const [editorContent, setEditorContent] = useState('');
  const [fields, setFields] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [savedVersions, setSavedVersions] = useState([]);
  const canvasRef = useRef(null);

  // Predefined field templates
  const fieldTemplates = {
    tenant: {
      name: 'Tenant Name',
      email: 'Tenant Email',
      phone: 'Tenant Phone',
      current_address: 'Current Address',
      move_in_date: 'Move-in Date',
    },
    property: {
      address: 'Property Address',
      unit: 'Unit Number',
      type: 'Property Type',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
    },
    lease: {
      start_date: 'Lease Start Date',
      end_date: 'Lease End Date',
      rent_amount: 'Monthly Rent',
      security_deposit: 'Security Deposit',
      payment_due: 'Payment Due Date',
      late_fee: 'Late Fee',
    },
    signatures: {
      tenant_signature: 'Tenant Signature',
      landlord_signature: 'Landlord Signature',
      date_signed: 'Date Signed',
    }
  };

  // Load template content
  useEffect(() => {
    if (template) {
      // Load template content with placeholders
      const templateContent = generateTemplateContent(template);
      setEditorContent(templateContent);
    }
  }, [template]);

  const generateTemplateContent = (template) => {
    // Generate document content based on template type
    switch (template?.type) {
      case 'lease':
        return `
          <h1>RESIDENTIAL LEASE AGREEMENT</h1>
          
          <p>This Lease Agreement ("Agreement") is entered into on [lease_start_date] between:</p>
          
          <h3>LANDLORD:</h3>
          <p>[landlord_name]<br/>
          [landlord_address]<br/>
          [landlord_phone]<br/>
          [landlord_email]</p>
          
          <h3>TENANT(S):</h3>
          <p>[tenant_name]<br/>
          [tenant_address]<br/>
          [tenant_phone]<br/>
          [tenant_email]</p>
          
          <h3>PROPERTY:</h3>
          <p>The Landlord agrees to rent to the Tenant the property located at:<br/>
          [property_address]<br/>
          Unit: [property_unit]<br/>
          City: [property_city], State: [property_state] ZIP: [property_zip]</p>
          
          <h3>TERM:</h3>
          <p>The lease term will begin on [lease_start_date] and end on [lease_end_date].</p>
          
          <h3>RENT:</h3>
          <p>Monthly rent: $[rent_amount]<br/>
          Due on the [payment_due_day] of each month<br/>
          Late fee: $[late_fee] if paid after the [grace_period]th day</p>
          
          <h3>SECURITY DEPOSIT:</h3>
          <p>Security deposit amount: $[security_deposit]<br/>
          To be paid upon signing this agreement.</p>
          
          <h3>SIGNATURES:</h3>
          <div style="margin-top: 50px;">
            <p>Landlord Signature: [landlord_signature] Date: [landlord_sign_date]</p>
            <p>Tenant Signature: [tenant_signature] Date: [tenant_sign_date]</p>
          </div>
        `;
      
      case 'termination':
        return `
          <h1>NOTICE OF LEASE TERMINATION</h1>
          
          <p>Date: [current_date]</p>
          
          <p>To: [landlord_name]<br/>
          [landlord_address]</p>
          
          <p>Dear [landlord_name],</p>
          
          <p>This letter serves as my [notice_period]-day notice that I will be terminating my lease 
          at [property_address] on [termination_date].</p>
          
          <p>Reason for termination: [termination_reason]</p>
          
          <p>Forwarding address:<br/>
          [forwarding_address]</p>
          
          <p>Please send my security deposit to the forwarding address above.</p>
          
          <p>Sincerely,<br/>
          [tenant_signature]<br/>
          [tenant_name]</p>
        `;
      
      default:
        return '<h1>New Document</h1><p>Start typing your document content here...</p>';
    }
  };

  const insertField = (fieldType, fieldName) => {
    const fieldTag = `[${fieldName}]`;
    const newField = {
      id: Date.now(),
      type: fieldType,
      name: fieldName,
      value: '',
      required: true,
    };
    
    setFields(prev => ({
      ...prev,
      [fieldName]: newField
    }));
    
    // Insert field placeholder into content
    if (canvasRef.current) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const fieldElement = document.createElement('span');
      fieldElement.className = 'field-placeholder';
      fieldElement.dataset.field = fieldName;
      fieldElement.contentEditable = false;
      fieldElement.textContent = fieldTag;
      range.insertNode(fieldElement);
    }
  };

  const handleFieldClick = (fieldName) => {
    setSelectedField(fields[fieldName]);
  };

  const updateFieldValue = (fieldName, value) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: value
      }
    }));
    
    // Update all instances of this field in the document
    const fieldElements = document.querySelectorAll(`[data-field="${fieldName}"]`);
    fieldElements.forEach(element => {
      element.textContent = value || `[${fieldName}]`;
    });
  };

  const handleSave = () => {
    const version = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: editorContent,
      fields: fields,
    };
    
    setSavedVersions(prev => [...prev, version]);
    
    if (onSave) {
      onSave({
        content: editorContent,
        fields: fields,
      });
    }
  };

  const handleSend = () => {
    setSendDialogOpen(true);
  };

  const confirmSend = (recipientEmail, message) => {
    if (onSend) {
      onSend({
        content: editorContent,
        fields: fields,
        recipient: recipientEmail,
        message: message,
      });
    }
    setSendDialogOpen(false);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Editor
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={zoom}
              exclusive
              onChange={(e, newZoom) => setZoom(newZoom)}
              size="small"
            >
              <ToggleButton value={75}>
                <ZoomOutIcon />
              </ToggleButton>
              <ToggleButton value={100}>
                100%
              </ToggleButton>
              <ToggleButton value={125}>
                <ZoomInIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Divider orientation="vertical" flexItem />
            
            <Tooltip title="Undo">
              <IconButton size="small">
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton size="small">
                <RedoIcon />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem />
            
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              startIcon={<PrintIcon />}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSend}
            >
              Send
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <EditorContainer>
        {/* Sidebar with fields */}
        <EditorSidebar>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Document Fields
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to insert fields into your document
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {Object.entries(fieldTemplates).map(([category, fields]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                  {category.replace('_', ' ')}
                </Typography>
                <List dense>
                  {Object.entries(fields).map(([fieldKey, fieldLabel]) => (
                    <ListItem
                      key={fieldKey}
                      button
                      onClick={() => insertField(category, fieldKey)}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {category === 'tenant' && <PersonIcon fontSize="small" />}
                        {category === 'property' && <HomeIcon fontSize="small" />}
                        {category === 'lease' && <EventIcon fontSize="small" />}
                        {category === 'signatures' && <DrawIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={fieldLabel}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
          
          <Divider />
          
          {/* Field Properties */}
          {selectedField && (
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Field Properties
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Field Value"
                value={selectedField.value}
                onChange={(e) => updateFieldValue(selectedField.name, e.target.value)}
                sx={{ mb: 1 }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Required</InputLabel>
                <Select value={selectedField.required ? 'yes' : 'no'}>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </EditorSidebar>

        {/* Document Canvas */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto' }}>
          <EditorCanvas
            ref={canvasRef}
            sx={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              contentEditable
              dangerouslySetInnerHTML={{ __html: editorContent }}
              onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
              style={{
                minHeight: '100%',
                outline: 'none',
                fontFamily: 'Times New Roman, serif',
                fontSize: '12pt',
                lineHeight: 1.5,
              }}
              onClick={(e) => {
                if (e.target.dataset.field) {
                  handleFieldClick(e.target.dataset.field);
                }
              }}
            />
            
            {/* Signature Areas */}
            {template?.type === 'lease' && (
              <Box sx={{ mt: 8 }}>
                <Grid container spacing={4}>
                  <Grid item xs={6}>
                    <SignatureField onClick={() => setSignatureDialogOpen(true)}>
                      <Stack alignItems="center" spacing={1}>
                        <DrawIcon color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Landlord Signature
                        </Typography>
                      </Stack>
                    </SignatureField>
                  </Grid>
                  <Grid item xs={6}>
                    <SignatureField onClick={() => setSignatureDialogOpen(true)}>
                      <Stack alignItems="center" spacing={1}>
                        <DrawIcon color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Tenant Signature
                        </Typography>
                      </Stack>
                    </SignatureField>
                  </Grid>
                </Grid>
              </Box>
            )}
          </EditorCanvas>
        </Box>

        {/* Right Panel - Document Info */}
        <Box sx={{ width: 280, bgcolor: 'background.paper', borderLeft: 1, borderColor: 'divider', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document Info
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText
                primary="Type"
                secondary={template?.type || 'Custom'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Created"
                secondary={new Date().toLocaleDateString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Status"
                secondary={
                  <Chip label="Draft" size="small" color="default" />
                }
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Required Fields
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            {Object.values(fields).filter(f => f.required).map(field => (
              <Chip
                key={field.name}
                label={field.name}
                size="small"
                color={field.value ? 'success' : 'default'}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Version History
          </Typography>
          
          <List dense>
            {savedVersions.slice(-3).reverse().map((version) => (
              <ListItem key={version.id}>
                <ListItemIcon>
                  <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Version ${version.id}`}
                  secondary={new Date(version.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </EditorContainer>

      {/* Send Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Document for Signature</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            The recipient will receive an email with a link to review and sign the document
          </Alert>
          <TextField
            fullWidth
            label="Recipient Email"
            type="email"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={3}
            placeholder="Add a message for the recipient..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => confirmSend()}
          >
            Send for Signature
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Signature</DialogTitle>
        <DialogContent>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Draw your signature here
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button fullWidth variant="outlined">Type</Button>
            <Button fullWidth variant="outlined">Draw</Button>
            <Button fullWidth variant="outlined">Upload</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Apply Signature</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentEditor;