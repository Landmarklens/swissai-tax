import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse
} from '@mui/material';
import {
  Description,
  CloudUpload,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import DocumentUploadQuestion from './DocumentUploadQuestion';

/**
 * Pending Documents List Component
 * Displays and manages pending documents that need to be uploaded
 *
 * @param {Object} props
 * @param {string} props.sessionId - Interview session ID
 * @param {Array<import('../../types/interview').PendingDocument>} props.pendingDocuments - List of pending documents
 * @param {function} props.onDocumentUploaded - Callback when document is uploaded
 * @param {function} props.onDocumentRemoved - Callback when document is removed
 * @param {function} props.onUpload - Upload function
 */
const PendingDocumentsList = ({
  sessionId,
  pendingDocuments,
  onDocumentUploaded,
  onDocumentRemoved,
  onUpload
}) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [removing, setRemoving] = useState(null);

  /**
   * Get status icon based on document status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <HourglassEmpty color="warning" />;
      case 'uploaded':
      case 'verified':
        return <CheckCircle color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <Description color="action" />;
    }
  };

  /**
   * Get status chip based on document status
   */
  const getStatusChip = (status) => {
    const config = {
      pending: { label: 'Pending', color: 'warning' },
      uploaded: { label: 'Uploaded', color: 'info' },
      verified: { label: 'Verified', color: 'success' },
      failed: { label: 'Failed', color: 'error' }
    };
    const chipConfig = config[status] || { label: 'Unknown', color: 'default' };
    return (
      <Chip
        size="small"
        label={chipConfig.label}
        color={chipConfig.color}
      />
    );
  };

  /**
   * Handle upload button click
   */
  const handleUploadClick = (doc) => {
    setSelectedDoc(doc);
    setUploadDialogOpen(true);
  };

  /**
   * Handle remove button click
   */
  const handleRemoveClick = async (doc) => {
    const confirmed = window.confirm(
      `Remove "${doc.document_label}"?\n\nThis document won't be required for your tax calculation.`
    );

    if (confirmed) {
      setRemoving(doc.id);
      try {
        await onDocumentRemoved(doc.id);
      } catch (error) {
        console.error('Error removing document:', error);
        alert('Failed to remove document. Please try again.');
      } finally {
        setRemoving(null);
      }
    }
  };

  /**
   * Handle upload complete
   */
  const handleUploadComplete = async (response) => {
    setUploadDialogOpen(false);
    setSelectedDoc(null);
    await onDocumentUploaded(selectedDoc?.id);
  };

  /**
   * Handle dialog close
   */
  const handleDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedDoc(null);
  };

  /**
   * Toggle expanded state
   */
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Don't render if no pending documents
  if (!pendingDocuments || pendingDocuments.length === 0) {
    return null;
  }

  return (
    <>
      <Card
        sx={{
          my: 3,
          border: '2px solid',
          borderColor: 'warning.main',
          boxShadow: 3
        }}
      >
        <CardContent>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              cursor: 'pointer'
            }}
            onClick={handleToggleExpand}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Description sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Pending Documents ({pendingDocuments.length})
              </Typography>
            </Box>
            <IconButton size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Upload these documents before calculating your taxes, or mark them as not needed.
              </Typography>
            </Alert>

            {/* Document List */}
            <List>
              {pendingDocuments.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(doc.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={500}>
                        {doc.document_label}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {doc.help_text}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusChip(doc.status)}
                      {doc.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={() => handleUploadClick(doc)}
                            disabled={removing === doc.id}
                          >
                            Upload
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveClick(doc)}
                            disabled={removing === doc.id}
                            title="Mark as not needed"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload {selectedDoc?.document_label}
        </DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <DocumentUploadQuestion
              question={{
                id: selectedDoc.question_id,
                type: 'DOCUMENT_UPLOAD',
                text: selectedDoc.document_label,
                help_text: selectedDoc.help_text,
                document_type: selectedDoc.document_type,
                accepted_formats: ['pdf', 'jpg', 'jpeg', 'png'],
                max_size_mb: 10,
                allow_bring_later: false
              }}
              sessionId={sessionId}
              onUploadComplete={handleUploadComplete}
              onBringLater={() => {}}
              onUpload={onUpload}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PendingDocumentsList;
