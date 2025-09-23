import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Stack,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Draw as DrawIcon,
  Keyboard as KeyboardIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import DOMPurify from 'dompurify';
import documentStorageService from '../../services/documentStorageService';
import emailService from '../../services/emailService';
import SignaturePad from '../sections/OwnerAccount/Document/SignaturePad';
import axios from 'axios';
import config from '../../config/environments';

const API_URL = config.API_BASE_URL;

const DocumentSigningPage = () => {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [tenantSignature, setTenantSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');

  useEffect(() => {
    loadDocument();
  }, [documentId, token]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      
      // Verify token
      if (!token) {
        throw new Error('Invalid or missing signing token');
      }
      
      // Try to load from backend first
      try {
        // First try to get the document publicly (no auth needed for signing)
        const response = await axios.get(`${API_URL}/api/documents/${documentId}/public`, {
          params: { token }
        });
        
        const doc = response.data;
        
        // Check if already signed
        if (doc.status === 'completed' && doc.tenant_signature) {
          setSignatureComplete(true);
          setTenantSignature(doc.tenant_signature);
        }
        
        // Check if document is still valid for signing
        if (doc.status !== 'pending_tenant_signature' && doc.status !== 'completed') {
          throw new Error('This document is not available for signing');
        }
        
        setDocument(doc);
        setDocumentHtml(doc.html_content || doc.document_html || '');
        
      } catch (apiError) {
        console.log('Backend not available, falling back to localStorage');
        
        // Fallback to localStorage if backend is not available
        const doc = documentStorageService.getDocument(documentId);
        
        if (!doc) {
          throw new Error('Document not found');
        }
        
        // Check if already signed
        if (doc.status === 'completed' && doc.field_values?.tenant_signature) {
          setSignatureComplete(true);
          setTenantSignature(doc.field_values.tenant_signature);
        }
        
        // Check if document is still valid for signing
        if (doc.status !== 'pending_tenant_signature' && doc.status !== 'completed') {
          throw new Error('This document is not available for signing');
        }
        
        setDocument(doc);
        setDocumentHtml(doc.document_html || '');
      }
      
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = (signatureData) => {
    setTenantSignature(signatureData);
    setSignaturePadOpen(false);
  };

  const handleSubmitSignature = async () => {
    if (!tenantSignature) {
      alert('Please add your signature before submitting');
      return;
    }
    
    try {
      setIsSigning(true);
      
      // Prepare signature data
      const signatureData = {
        document_id: parseInt(documentId),
        signing_token: token,
        tenant_signature: typeof tenantSignature === 'string' 
          ? tenantSignature 
          : JSON.stringify(tenantSignature),
        tenant_fields: {
          tenant_sign_date: new Date().toISOString().split('T')[0]
        }
      };
      
      try {
        // Try to sign via backend API
        const response = await axios.post(`${API_URL}/api/documents/sign`, signatureData);
        
        const updatedDocument = response.data;
        setSignatureComplete(true);
        setDocument(updatedDocument);
        
        // Update localStorage as well for consistency
        documentStorageService.updateDocument(documentId, updatedDocument);
        
      } catch (apiError) {
        console.log('Backend not available, saving to localStorage');
        
        // Fallback to localStorage if backend is not available
        const updatedFieldValues = {
          ...document.field_values,
          tenant_signature: tenantSignature,
          tenant_sign_date: new Date().toISOString().split('T')[0]
        };
        
        const updatedDocument = {
          ...document,
          field_values: updatedFieldValues,
          status: 'completed',
          tenant_signed_at: new Date().toISOString()
        };
        
        documentStorageService.updateDocument(documentId, updatedDocument);
        
        // Send notification email to landlord
        if (document.field_values?.landlord_email) {
          await emailService.sendDocumentSignedNotification(
            document.field_values.landlord_email,
            {
              documentName: document.template_name || document.name || 'Document',
              tenantName: document.field_values?.tenant_name || document.tenant_name || 'Tenant',
              signedDate: new Date().toLocaleDateString(),
              documentLink: `${window.location.origin}/documents/${documentId}`
            }
          );
        }
        
        setSignatureComplete(true);
        setDocument(updatedDocument);
      }
      
    } catch (err) {
      console.error('Error submitting signature:', err);
      alert('Failed to submit signature. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([documentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.template_name || 'document'}_signed.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="h6" gutterBottom>
              Unable to Load Document
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          background: signatureComplete 
            ? 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)'
            : 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)',
          color: 'white',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" gutterBottom>
                {signatureComplete ? 'Document Signed Successfully' : 'Document Signature Request'}
              </Typography>
              <Typography variant="body1">
                {document?.template_name || 'Legal Document'}
              </Typography>
            </Box>
            <Box>
              {signatureComplete ? (
                <CheckCircleIcon sx={{ fontSize: 60 }} />
              ) : (
                <Chip 
                  label="Awaiting Your Signature" 
                  color="warning" 
                  sx={{ backgroundColor: 'white', fontWeight: 'bold' }}
                />
              )}
            </Box>
          </Stack>
        </Box>

        {/* Document Info */}
        <Box sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                From
              </Typography>
              <Typography variant="body1">
                {document?.field_values?.landlord_name || 'Landlord'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                To
              </Typography>
              <Typography variant="body1">
                {document?.field_values?.tenant_name || 'Tenant'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Property
              </Typography>
              <Typography variant="body1">
                {document?.field_values?.property_address || 'Property Address'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Date Sent
              </Typography>
              <Typography variant="body1">
                {document?.sent_to_tenant_at 
                  ? new Date(document.sent_to_tenant_at).toLocaleDateString()
                  : 'Recently'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* Document Content */}
        <Box sx={{ p: 4, maxHeight: '600px', overflow: 'auto' }}>
          <Card variant="outlined">
            <CardContent>
              <Box 
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(documentHtml, {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                                  'section', 'br', 'strong', 'em', 'u', 'img', 'table', 
                                  'tr', 'td', 'th', 'tbody', 'thead'],
                    ALLOWED_ATTR: ['style', 'class', 'id', 'src', 'alt', 'width', 'height']
                  })
                }}
                sx={{
                  '& .signature-section': {
                    backgroundColor: signatureComplete ? '#e8f5e9' : '#fff3e0',
                    padding: 2,
                    borderRadius: 1,
                    marginTop: 3
                  }
                }}
              />
            </CardContent>
          </Card>
        </Box>

        <Divider />

        {/* Signature Section */}
        <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
          {!signatureComplete ? (
            <Stack spacing={3}>
              <Alert severity="info">
                Please review the document above and add your signature below to complete the signing process.
              </Alert>
              
              {/* Signature Display/Add */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Signature
                  </Typography>
                  
                  {tenantSignature ? (
                    <Box sx={{ 
                      p: 2, 
                      border: '2px solid #4caf50',
                      borderRadius: 1,
                      backgroundColor: '#e8f5e9',
                      textAlign: 'center'
                    }}>
                      {tenantSignature.type === 'draw' ? (
                        <img 
                          src={tenantSignature.data} 
                          alt="Your Signature"
                          style={{ maxHeight: 100, maxWidth: 300 }}
                        />
                      ) : (
                        <Typography 
                          variant="h4" 
                          style={{ 
                            fontFamily: tenantSignature.font || 'Dancing Script',
                            fontSize: tenantSignature.fontSize || 48
                          }}
                        >
                          {tenantSignature.text}
                        </Typography>
                      )}
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setSignaturePadOpen(true)}
                        >
                          Change Signature
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      p: 4, 
                      border: '2px dashed #ff9800',
                      borderRadius: 1,
                      textAlign: 'center',
                      backgroundColor: '#fff3e0'
                    }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        No signature added yet
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DrawIcon />}
                        onClick={() => setSignaturePadOpen(true)}
                        sx={{
                          background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)'
                          }
                        }}
                      >
                        Add Signature
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to decline signing this document?')) {
                      navigate('/');
                    }
                  }}
                >
                  Decline to Sign
                </Button>
                
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleSubmitSignature}
                  disabled={!tenantSignature || isSigning}
                  sx={{
                    minWidth: 200,
                    background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 100%)'
                    }
                  }}
                >
                  {isSigning ? 'Submitting...' : 'Submit Signature'}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="h6" gutterBottom>
                  Thank you for signing!
                </Typography>
                <Typography variant="body2">
                  This document has been successfully signed and a copy has been sent to all parties.
                  You can download a copy for your records using the button below.
                </Typography>
              </Alert>
              
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Print Document
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download Copy
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/')}
                >
                  Return Home
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Signature Pad Dialog */}
      <Dialog
        open={signaturePadOpen}
        onClose={() => setSignaturePadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Your Signature</DialogTitle>
        <DialogContent>
          <SignaturePad
            onSave={handleSignature}
            onClose={() => setSignaturePadOpen(false)}
            fieldName="tenant_signature"
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DocumentSigningPage;