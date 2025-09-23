import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Card,
  CardContent,
  Tooltip,
  Badge,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Description as DocumentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  AutoAwesome as AIIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  AccountBalance as BankIcon,
  Assignment as ContractIcon,
  Badge as IDIcon,
  Shield as InsuranceIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { processDocuments, getDocumentExtraction } from '../../../../store/slices/tenantSelectionSlice';

const DOCUMENT_TYPES = {
  salary_slip: { icon: <MoneyIcon />, label: 'Salary Slip', color: 'success' },
  employment_contract: { icon: <ContractIcon />, label: 'Employment Contract', color: 'primary' },
  bank_statement: { icon: <BankIcon />, label: 'Bank Statement', color: 'info' },
  betreibungsregister: { icon: <DocumentIcon />, label: 'Betreibungsregister', color: 'warning' },
  reference_letter: { icon: <HomeIcon />, label: 'Reference Letter', color: 'secondary' },
  id_document: { icon: <IDIcon />, label: 'ID/Passport', color: 'error' },
  liability_insurance: { icon: <InsuranceIcon />, label: 'Liability Insurance', color: 'success' }
};

const DocumentViewer = ({ leadId, documents = [], onDocumentsProcessed }) => {
  const dispatch = useDispatch();
  const { documentProcessing, extractedData } = useSelector((state) => state.tenantSelection);
  
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showExtraction, setShowExtraction] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({});

  useEffect(() => {
    if (documents.length > 0 && leadId) {
      // Process documents automatically
      handleProcessDocuments();
    }
  }, [documents, leadId]);

  const handleProcessDocuments = async () => {
    const documentUrls = documents.map(doc => doc.url);
    const result = await dispatch(processDocuments({ leadId, documentUrls })).unwrap();
    
    if (result && onDocumentsProcessed) {
      onDocumentsProcessed(result);
    }
  };

  const getDocumentStatus = (doc) => {
    const processing = documentProcessing[doc.id];
    if (!processing) return 'pending';
    return processing.status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'processing':
        return <LinearProgress variant="indeterminate" sx={{ width: 20 }} />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const renderExtractedData = (extraction) => {
    if (!extraction) return null;
    
    return (
      <Box>
        {/* Financial Information */}
        {extraction.financial && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Income
                  </Typography>
                  <Typography variant="h6">
                    CHF {extraction.financial.monthly_income?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Annual Income
                  </Typography>
                  <Typography variant="h6">
                    CHF {extraction.financial.annual_income?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Bonus/13th Salary
                  </Typography>
                  <Typography variant="h6">
                    {extraction.financial.has_bonus ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Debt Obligations
                  </Typography>
                  <Typography variant="h6">
                    CHF {extraction.financial.monthly_obligations?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Employment Information */}
        {extraction.employment && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Employment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Employer
                  </Typography>
                  <Typography variant="body1">
                    {extraction.employment.company || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Position
                  </Typography>
                  <Typography variant="body1">
                    {extraction.employment.position || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Employment Type
                  </Typography>
                  <Typography variant="body1">
                    {extraction.employment.type || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {extraction.employment.start_date || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Employment Duration
                  </Typography>
                  <Typography variant="body1">
                    {extraction.employment.duration_months 
                      ? `${extraction.employment.duration_months} months` 
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Debt Register (Betreibungsregister) */}
        {extraction.debt_register && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Debt Register Extract
              </Typography>
              <Alert 
                severity={extraction.debt_register.has_entries ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              >
                {extraction.debt_register.has_entries 
                  ? `Found ${extraction.debt_register.entry_count} entries`
                  : 'No debt entries found'}
              </Alert>
              {extraction.debt_register.has_entries && extraction.debt_register.entries && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {extraction.debt_register.entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.type}</TableCell>
                          <TableCell>CHF {entry.amount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={entry.status} 
                              size="small"
                              color={entry.status === 'resolved' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* References */}
        {extraction.references && extraction.references.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                References
              </Typography>
              <List>
                {extraction.references.map((ref, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={ref.name}
                      secondary={
                        <>
                          {ref.relationship} • {ref.contact}
                          {ref.recommendation && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              "{ref.recommendation}"
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
        
        {/* AI Analysis */}
        {extraction.ai_analysis && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                GPT-5 Analysis
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Document Authenticity Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={extraction.ai_analysis.authenticity_score * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                    color={getConfidenceColor(extraction.ai_analysis.authenticity_score)}
                  />
                  <Typography variant="body2">
                    {Math.round(extraction.ai_analysis.authenticity_score * 100)}%
                  </Typography>
                </Box>
              </Box>
              
              {extraction.ai_analysis.red_flags && extraction.ai_analysis.red_flags.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Red Flags Detected
                  </Typography>
                  <ul>
                    {extraction.ai_analysis.red_flags.map((flag, index) => (
                      <li key={index}>{flag}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              {extraction.ai_analysis.positive_indicators && extraction.ai_analysis.positive_indicators.length > 0 && (
                <Alert severity="success">
                  <Typography variant="subtitle2" gutterBottom>
                    Positive Indicators
                  </Typography>
                  <ul>
                    {extraction.ai_analysis.positive_indicators.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              {extraction.ai_analysis.summary && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body2">
                    {extraction.ai_analysis.summary}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Document Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<AIIcon />}
              label="GPT-5 Powered"
              color="primary"
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleProcessDocuments}
              disabled={!documents.length}
            >
              Reprocess
            </Button>
          </Box>
        </Box>
        
        <Alert severity="info">
          Documents are automatically analyzed using GPT-5 AI to extract key information, 
          verify authenticity, and identify any concerns.
        </Alert>
      </Paper>
      
      {/* Document List */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Submitted Documents
            </Typography>
            
            <List>
              {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
                const doc = documents.find(d => d.type === type);
                const status = doc ? getDocumentStatus(doc) : 'missing';
                
                return (
                  <ListItem
                    key={type}
                    button={!!doc}
                    selected={selectedDocument?.type === type}
                    onClick={() => doc && setSelectedDocument(doc)}
                  >
                    <ListItemIcon>
                      <Badge
                        badgeContent={status === 'missing' ? '!' : null}
                        color="error"
                      >
                        {config.icon}
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={config.label}
                      secondary={
                        doc ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(status)}
                            <Typography variant="caption">
                              {status === 'completed' ? 'Verified' : status}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="error">
                            Not submitted
                          </Typography>
                        )
                      }
                    />
                    {doc && (
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={() => window.open(doc.url)}>
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                );
              })}
            </List>
            
            {/* Document Completeness */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Document Completeness
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(documents.length / Object.keys(DOCUMENT_TYPES).length) * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2">
                  {documents.length}/{Object.keys(DOCUMENT_TYPES).length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Extraction Results */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            {selectedDocument ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {DOCUMENT_TYPES[selectedDocument.type]?.label || 'Document'} Analysis
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setShowExtraction(!showExtraction)}
                  >
                    {showExtraction ? 'Hide' : 'Show'} Raw Data
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {documentProcessing[selectedDocument.id]?.status === 'processing' ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Processing document with GPT-5...
                    </Typography>
                  </Box>
                ) : (
                  renderExtractedData(extractedData[selectedDocument.id])
                )}
                
                {showExtraction && extractedData[selectedDocument.id] && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.900', color: 'white' }}>
                    <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(extractedData[selectedDocument.id], null, 2)}
                    </Typography>
                  </Paper>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <DocumentIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  Select a document to view analysis
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentViewer;