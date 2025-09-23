import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  AttachFile as FileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DocumentsModal = ({ open, onClose, application, propertyId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (open && application) {
      // Extract documents from application data
      const docs = application.dossier_data?.documents_provided ||
                   application.documents ||
                   [];
      setDocuments(docs);
    }
  }, [open, application]);

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon color="primary" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleDownload = async (document) => {
    try {
      // Use the URL directly
      const url = document.url || document.file_url;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleView = async (document) => {
    try {
      // Use the URL directly
      const url = document.url || document.file_url;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to view document:', error);
    }
  };

  // Determine if this is a selected candidate
  const isSelectedCandidate = application?.lead_status === 'selected' ||
                              application?.lead_status === 'qualified';

  // Get display name - show real name for selected candidates
  const getDisplayName = () => {
    if (isSelectedCandidate) {
      // Try different possible fields for real name
      if (application?.contact_details?.first_name || application?.contact_details?.last_name) {
        const firstName = application.contact_details.first_name || '';
        const lastName = application.contact_details.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
      }
      if (application?.real_name) {
        return application.real_name;
      }
      if (application?.dossier_data?.applicant_name) {
        return application.dossier_data.applicant_name;
      }
      if (application?.ai_extracted_data?.name) {
        return application.ai_extracted_data.name;
      }
      if (application?.name) {
        return application.name;
      }
    }
    return application?.anonymized_id || `Applicant #${application?.id}`;
  };

  // Get contact information for selected candidates
  const getContactInfo = () => {
    if (!isSelectedCandidate || !application?.contact_details) {
      return null;
    }
    return application.contact_details;
  };

  const contactInfo = getContactInfo();
  const displayName = getDisplayName();

  // Document categories
  const documentCategories = {
    identity: [],
    income: [],
    references: [],
    other: []
  };

  // Categorize documents
  documents.forEach(doc => {
    const name = (doc.name || doc.file_name || '').toLowerCase();
    if (name.includes('id') || name.includes('passport') || name.includes('identity')) {
      documentCategories.identity.push(doc);
    } else if (name.includes('salary') || name.includes('income') || name.includes('pay')) {
      documentCategories.income.push(doc);
    } else if (name.includes('reference') || name.includes('recommendation')) {
      documentCategories.references.push(doc);
    } else {
      documentCategories.other.push(doc);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
              {t('Submitted Documents')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Applicant Information Section */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {displayName}
              </Typography>
              {isSelectedCandidate && (
                <Box>
                  <Chip
                    label={application.lead_status === 'selected' ? 'Selected Tenant' : 'Qualified'}
                    color="success"
                    size="small"
                    icon={<CheckIcon />}
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}

              {/* Show contact details for selected candidates */}
              {contactInfo && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {contactInfo.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {contactInfo.email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {contactInfo.phone && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {contactInfo.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {(contactInfo.address || contactInfo.city) && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AddressIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {[contactInfo.address, contactInfo.city, contactInfo.zip]
                            .filter(Boolean)
                            .join(', ')}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </Grid>
            <Grid item>
              <Stack spacing={1}>
                <Chip
                  label={`${documents.length} Documents`}
                  color="primary"
                  variant="outlined"
                />
                {application?.soft_score && (
                  <Chip
                    label={`Score: ${application.soft_score}%`}
                    color={application.soft_score >= 70 ? 'success' : 'default'}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Documents Section */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Alert severity="info">
            {t('No documents have been submitted yet')}
          </Alert>
        ) : (
          <Box>
            {/* Identity Documents */}
            {documentCategories.identity.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Identity Documents
                </Typography>
                <List>
                  {documentCategories.identity.map((doc, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getFileIcon(doc.name || doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name || doc.file_name || 'Document'}
                          secondary={
                            <>
                              <span style={{ display: 'block' }}>
                                {formatFileSize(doc.size || doc.file_size)}
                              </span>
                              {doc.uploaded_at && (
                                <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleView(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < documentCategories.identity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {/* Income Documents */}
            {documentCategories.income.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Income Documents
                </Typography>
                <List>
                  {documentCategories.income.map((doc, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getFileIcon(doc.name || doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name || doc.file_name || 'Document'}
                          secondary={
                            <>
                              <span style={{ display: 'block' }}>
                                {formatFileSize(doc.size || doc.file_size)}
                              </span>
                              {doc.uploaded_at && (
                                <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleView(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < documentCategories.income.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {/* Reference Documents */}
            {documentCategories.references.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  References
                </Typography>
                <List>
                  {documentCategories.references.map((doc, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getFileIcon(doc.name || doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name || doc.file_name || 'Document'}
                          secondary={
                            <>
                              <span style={{ display: 'block' }}>
                                {formatFileSize(doc.size || doc.file_size)}
                              </span>
                              {doc.uploaded_at && (
                                <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleView(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < documentCategories.references.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {/* Other Documents */}
            {documentCategories.other.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Other Documents
                </Typography>
                <List>
                  {documentCategories.other.map((doc, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getFileIcon(doc.name || doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name || doc.file_name || 'Document'}
                          secondary={
                            <>
                              <span style={{ display: 'block' }}>
                                {formatFileSize(doc.size || doc.file_size)}
                              </span>
                              {doc.uploaded_at && (
                                <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleView(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.url && !doc.file_url}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < documentCategories.other.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Summary */}
        {documents.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              Document Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Total Documents
                </Typography>
                <Typography variant="h6">
                  {documents.length}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Identity Docs
                </Typography>
                <Typography variant="h6">
                  {documentCategories.identity.length}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Income Docs
                </Typography>
                <Typography variant="h6">
                  {documentCategories.income.length}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  References
                </Typography>
                <Typography variant="h6">
                  {documentCategories.references.length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('Close')}
        </Button>
        {isSelectedCandidate && contactInfo?.email && (
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => {
              window.location.href = `mailto:${contactInfo.email}`;
            }}
          >
            {t('Contact Tenant')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentsModal;