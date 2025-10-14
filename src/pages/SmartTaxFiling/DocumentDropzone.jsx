import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
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
  ListItemSecondary,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  AutoAwesome,
  ExpandMore,
  InsertDriveFile,
  PictureAsPdf,
  Image,
  AttachMoney,
  Home,
  AccountBalance,
  LocalHospital,
  ChildCare,
  School,
  Business,
  Receipt,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { formatFileSize } from '../../utils/format';

// Document category configurations
const documentCategories = [
  {
    key: 'employment',
    title: 'Employment & Income',
    icon: <AttachMoney />,
    color: '#4CAF50',
    required: true,
    documents: ['Lohnausweis', 'Salary certificates', 'Pension statements'],
    acceptedTypes: ['lohnausweis', 'salary_certificate', 'pension_statement']
  },
  {
    key: 'banking',
    title: 'Banking',
    icon: <AccountBalance />,
    color: '#2196F3',
    required: true,
    documents: ['Year-end bank statements', 'Interest certificates'],
    acceptedTypes: ['bank_statement', 'interest_certificate']
  },
  {
    key: 'investments',
    title: 'Investments',
    icon: <Business />,
    color: '#9C27B0',
    required: false,
    documents: ['Broker statements', 'Dividend confirmations', 'Crypto reports'],
    acceptedTypes: ['broker_statement', 'dividend_statement', 'crypto_report']
  },
  {
    key: 'property',
    title: 'Property',
    icon: <Home />,
    color: '#FF9800',
    required: false,
    documents: ['Mortgage statements', 'Property valuations'],
    acceptedTypes: ['mortgage_statement', 'property_valuation']
  },
  {
    key: 'deductions',
    title: 'Deductions',
    icon: <Receipt />,
    color: '#795548',
    required: false,
    documents: ['Insurance premiums', '3a certificates', 'Donation receipts', 'Medical bills'],
    acceptedTypes: ['insurance_premium', 'pillar_3a', 'donation_receipt', 'medical_invoice']
  },
  {
    key: 'children',
    title: 'Children',
    icon: <ChildCare />,
    color: '#E91E63',
    required: false,
    documents: ['Daycare invoices', 'Education costs'],
    acceptedTypes: ['daycare_invoice', 'education_invoice']
  }
];

const DocumentDropzone = ({ onDocumentsUploaded }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      documents.forEach(doc => {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      });
    };
  }, [documents]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle accepted files
    const newDocuments = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      category: selectedCategory || detectCategory(file.name),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message).join(', ')
      }));
      setErrors(newErrors);
    }
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const detectCategory = (fileName) => {
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('lohn') || lowerName.includes('salary') || lowerName.includes('wage')) {
      return 'employment';
    }
    if (lowerName.includes('bank') || lowerName.includes('konto') || lowerName.includes('account')) {
      return 'banking';
    }
    if (lowerName.includes('broker') || lowerName.includes('depot') || lowerName.includes('portfolio')) {
      return 'investments';
    }
    if (lowerName.includes('mortgage') || lowerName.includes('hypothek') || lowerName.includes('property')) {
      return 'property';
    }
    if (lowerName.includes('kita') || lowerName.includes('daycare') || lowerName.includes('child')) {
      return 'children';
    }
    if (lowerName.includes('insurance') || lowerName.includes('versicherung') || lowerName.includes('3a')) {
      return 'deductions';
    }

    return 'other';
  };

  const handleUploadAndExtract = async () => {
    if (documents.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      // Prepare form data
      const formData = new FormData();
      documents.forEach(doc => {
        formData.append('files', doc.file);
      });

      // Upload documents
      const uploadResponse = await api.post('/api/v1/ai/documents/smart-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadedDocs = uploadResponse.data.documents;

      // Update document status
      setDocuments(prev => prev.map(doc => {
        const uploaded = uploadedDocs.find(u => u.filename === doc.name);
        return {
          ...doc,
          status: uploaded?.status === 'uploaded' ? 'uploaded' : 'failed',
          serverId: uploaded?.id
        };
      }));

      // Start AI extraction
      const documentIds = uploadedDocs
        .filter(d => d.status === 'uploaded')
        .map(d => d.id);

      if (documentIds.length > 0) {
        setExtracting(true);

        const extractResponse = await api.post('/api/v1/ai/extract', {
          document_ids: documentIds,
          user_context: getUserContext()
        });

        setExtractionResults(extractResponse.data);

        // Update document status with extraction results
        setDocuments(prev => prev.map(doc => ({
          ...doc,
          status: doc.status === 'uploaded' ? 'extracted' : doc.status,
          confidence: extractResponse.data.confidence_score
        })));
      }

    } catch (error) {
      console.error('Upload/extraction failed:', error);
      setErrors([{ file: 'Upload', errors: error.message }]);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const getUserContext = () => {
    // Get saved answers from minimal questionnaire
    const context = JSON.parse(localStorage.getItem('minimalAnswers') || '{}');
    return {
      tax_year: new Date().getFullYear() - 1,
      canton: context.canton || '',
      municipality: context.municipality || '',
      has_spouse: context.has_spouse === 'yes',
      has_children: context.has_children === 'yes',
      self_employed: context.self_employed === 'yes',
      has_property: context.has_property === 'yes',
      has_investments: context.has_investments === 'yes'
    };
  };

  const removeDocument = (docId) => {
    setDocuments(prev => {
      const doc = prev.find(d => d.id === docId);
      if (doc && doc.preview) {
        URL.revokeObjectURL(doc.preview);
      }
      return prev.filter(d => d.id !== docId);
    });
  };

  const handleContinue = () => {
    if (onDocumentsUploaded) {
      onDocumentsUploaded(extractionResults);
    }
    navigate('/smart-tax-filing/review');
  };

  const getDocumentIcon = (doc) => {
    if (doc.type === 'application/pdf') return <PictureAsPdf color="error" />;
    if (doc.type.startsWith('image/')) return <Image color="primary" />;
    return <InsertDriveFile />;
  };

  const getStatusChip = (status, confidence) => {
    switch (status) {
      case 'uploaded':
        return <Chip label="Uploaded" size="small" color="info" />;
      case 'extracted':
        return (
          <Chip
            label={`Extracted (${Math.round(confidence * 100)}%)`}
            size="small"
            color="success"
            icon={<AutoAwesome />}
          />
        );
      case 'failed':
        return <Chip label="Failed" size="small" color="error" />;
      default:
        return <Chip label="Pending" size="small" />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Upload Your Documents
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload all your tax-related documents. Our AI will automatically extract the relevant information.
      </Typography>

      {/* Document Categories */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {documentCategories.map(category => (
          <Grid item xs={12} sm={6} md={4} key={category.key}>
            <Paper
              elevation={selectedCategory === category.key ? 3 : 1}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: selectedCategory === category.key ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.3s',
                '&:hover': {
                  elevation: 3,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => setSelectedCategory(category.key)}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    backgroundColor: category.color,
                    borderRadius: 1,
                    p: 0.5,
                    mr: 1.5,
                    color: 'white'
                  }}
                >
                  {category.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {category.title}
                  </Typography>
                  {category.required && (
                    <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {category.documents.join(', ')}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Dropzone */}
      <Card
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop documents here' : 'Drag & drop documents here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select files (PDF, JPG, PNG, DOCX, XLSX - Max 10MB)
          </Typography>
          {selectedCategory && (
            <Chip
              label={`Uploading to: ${documentCategories.find(c => c.key === selectedCategory)?.title}`}
              sx={{ mt: 2 }}
              onDelete={() => setSelectedCategory(null)}
            />
          )}
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setErrors([])}>
          {errors.map((error, index) => (
            <div key={index}>
              <strong>{error.file}:</strong> {error.errors}
            </div>
          ))}
        </Alert>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Uploaded Documents ({documents.length})
            </Typography>

            <List>
              {documents.map(doc => (
                <ListItem
                  key={doc.id}
                  secondaryAction={
                    <Box>
                      {doc.preview && (
                        <IconButton
                          edge="end"
                          onClick={() => setPreviewDocument(doc)}
                          sx={{ mr: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                      )}
                      <IconButton edge="end" onClick={() => removeDocument(doc.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>{getDocumentIcon(doc)}</ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    secondary={
                      <Box>
                        <Typography variant="caption">
                          {formatFileSize(doc.size)} • {doc.category}
                        </Typography>
                        <Box mt={0.5}>{getStatusChip(doc.status, doc.confidence)}</Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Upload Progress */}
            {(uploading || extracting) && (
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  {uploading ? 'Uploading documents...' : 'Extracting information with AI...'}
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {/* Extraction Results */}
            {extractionResults && (
              <Alert
                severity="success"
                sx={{ mt: 2 }}
                icon={<AutoAwesome />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  AI Extraction Complete!
                </Typography>
                <Typography variant="body2">
                  Confidence Score: {Math.round(extractionResults.confidence_score * 100)}%
                </Typography>
                {extractionResults.missing_fields?.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Missing documents: {extractionResults.missing_fields.join(', ')}
                  </Typography>
                )}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button
                variant="outlined"
                onClick={() => navigate('/smart-tax-filing/questionnaire')}
              >
                Back to Questions
              </Button>

              <Box>
                {!extractionResults && documents.length > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleUploadAndExtract}
                    disabled={uploading || extracting}
                    startIcon={<CloudUpload />}
                    sx={{ mr: 2 }}
                  >
                    Upload & Extract
                  </Button>
                )}

                {extractionResults && (
                  <Button
                    variant="contained"
                    onClick={handleContinue}
                    color="primary"
                  >
                    Continue to Review
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        maxWidth="md"
        fullWidth
      >
        {previewDocument && (
          <>
            <DialogTitle>{previewDocument.name}</DialogTitle>
            <DialogContent>
              {previewDocument.preview && (
                <img
                  src={previewDocument.preview}
                  alt={previewDocument.name}
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewDocument(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentDropzone;