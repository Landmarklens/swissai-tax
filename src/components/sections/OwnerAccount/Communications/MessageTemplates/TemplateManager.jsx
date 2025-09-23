import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import TemplateEditor from './TemplateEditor';

const predefinedTemplates = [
  {
    id: 'viewing_invitation',
    name: 'Viewing Invitation',
    category: 'viewing',
    subject: 'Invitation to Property Viewing - {{property_address}}',
    content: `Dear {{applicant_name}},

Thank you for your interest in our property at {{property_address}}.

We are pleased to invite you to a viewing on:
Date: {{viewing_date}}
Time: {{viewing_time}}
Location: {{viewing_location}}

Please confirm your attendance by replying to this email.

Best regards,
{{landlord_name}}`,
    variables: ['applicant_name', 'property_address', 'viewing_date', 'viewing_time', 'viewing_location', 'landlord_name']
  },
  {
    id: 'application_received',
    name: 'Application Received',
    category: 'confirmation',
    subject: 'Application Received - {{property_address}}',
    content: `Dear {{applicant_name}},

Thank you for your application for the property at {{property_address}}.

We have received your application and will review it carefully. You can expect to hear from us within {{response_time}}.

If we need any additional information, we will contact you at this email address.

Best regards,
{{landlord_name}}`,
    variables: ['applicant_name', 'property_address', 'response_time', 'landlord_name']
  },
  {
    id: 'document_request',
    name: 'Document Request',
    category: 'request',
    subject: 'Additional Documents Required - {{property_address}}',
    content: `Dear {{applicant_name}},

Thank you for your application for {{property_address}}.

To proceed with your application, we require the following additional documents:
{{required_documents}}

Please send these documents as soon as possible to expedite the review process.

Best regards,
{{landlord_name}}`,
    variables: ['applicant_name', 'property_address', 'required_documents', 'landlord_name']
  },
  {
    id: 'application_accepted',
    name: 'Application Accepted',
    category: 'decision',
    subject: 'Congratulations! Your Application Has Been Accepted',
    content: `Dear {{applicant_name}},

We are delighted to inform you that your application for {{property_address}} has been accepted!

Next steps:
1. Lease agreement will be sent to you within {{contract_timeline}}
2. Move-in date: {{move_in_date}}
3. Security deposit: CHF {{security_deposit}}

Please contact us if you have any questions.

Best regards,
{{landlord_name}}`,
    variables: ['applicant_name', 'property_address', 'contract_timeline', 'move_in_date', 'security_deposit', 'landlord_name']
  },
  {
    id: 'application_rejected',
    name: 'Application Update',
    category: 'decision',
    subject: 'Update on Your Application - {{property_address}}',
    content: `Dear {{applicant_name}},

Thank you for your interest in our property at {{property_address}}.

After careful consideration, we have decided to proceed with another applicant whose profile more closely matches our requirements.

We appreciate your interest and wish you the best in your property search.

Best regards,
{{landlord_name}}`,
    variables: ['applicant_name', 'property_address', 'landlord_name']
  }
];

const TemplateManager = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [templates, setTemplates] = useState(predefinedTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    { value: 'all', label: t('All Templates'), color: 'default' },
    { value: 'viewing', label: t('Viewing'), color: 'primary' },
    { value: 'confirmation', label: t('Confirmation'), color: 'info' },
    { value: 'request', label: t('Request'), color: 'warning' },
    { value: 'decision', label: t('Decision'), color: 'success' }
  ];

  const filteredTemplates = templates.filter(template => 
    filterCategory === 'all' || template.category === filterCategory
  );

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEditorOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleDeleteTemplate = (template) => {
    setSelectedTemplate(template);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
    setDeleteDialog(false);
    setSelectedTemplate(null);
  };

  const handleDuplicateTemplate = (template) => {
    const duplicated = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copy)`
    };
    setTemplates([...templates, duplicated]);
  };

  const handleSaveTemplate = (template) => {
    if (selectedTemplate) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id ? { ...template, id: selectedTemplate.id } : t
      ));
    } else {
      // Add new template
      setTemplates([...templates, { ...template, id: `custom_${Date.now()}` }]);
    }
    setEditorOpen(false);
    setSelectedTemplate(null);
  };

  const handleMenuClick = (event, template) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('Message Templates')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          {t('Create Template')}
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          {t('Use templates to send consistent messages to applicants. Templates support variables that will be automatically replaced with actual values.')}
        </Typography>
      </Alert>

      {/* Category Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        {categories.map(category => (
          <Chip
            key={category.value}
            label={category.label}
            color={filterCategory === category.value ? category.color : 'default'}
            variant={filterCategory === category.value ? 'filled' : 'outlined'}
            onClick={() => setFilterCategory(category.value)}
          />
        ))}
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {filteredTemplates.map((template) => {
          const categoryInfo = getCategoryInfo(template.category);
          return (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Chip
                        label={categoryInfo.label}
                        color={categoryInfo.color}
                        size="small"
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, template)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('Subject')}: {template.subject}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {template.content}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {template.variables.slice(0, 3).map(variable => (
                      <Chip
                        key={variable}
                        label={`{{${variable}}}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                    {template.variables.length > 3 && (
                      <Chip
                        label={`+${template.variables.length - 3} more`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditTemplate(template)}
                    fullWidth
                  >
                    {t('Edit')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EmailIcon />}
                    variant="outlined"
                    fullWidth
                  >
                    {t('Use')}
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('No templates found')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filterCategory === 'all' 
              ? t('Create your first template to get started')
              : t('No templates in this category')}
          </Typography>
          {filterCategory === 'all' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
            >
              {t('Create Template')}
            </Button>
          )}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEditTemplate(selectedTemplate);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 2 }} />
          {t('Edit')}
        </MenuItem>
        <MenuItem onClick={() => {
          handleDuplicateTemplate(selectedTemplate);
          handleMenuClose();
        }}>
          <CopyIcon sx={{ mr: 2 }} />
          {t('Duplicate')}
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteTemplate(selectedTemplate);
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 2 }} />
          {t('Delete')}
        </MenuItem>
      </Menu>

      {/* Template Editor Dialog */}
      {editorOpen && (
        <TemplateEditor
          open={editorOpen}
          template={selectedTemplate}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>{t('Delete Template')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('Are you sure you want to delete "{{name}}"?', { name: selectedTemplate?.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>{t('Cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManager;