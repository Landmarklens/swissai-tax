import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import DocumentManagementSection from '../../pages/Settings/components/DocumentManagementSection';
import { documentAPI } from '../../services/api';

const Documents = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsByYear, setDocumentsByYear] = useState({});
  const [downloadingDocs, setDownloadingDocs] = useState(new Set());
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await documentAPI.getAllUserDocuments();
      const docs = response.data;
      setDocuments(docs);

      // Organize documents by year
      const byYear = {};
      docs.forEach(doc => {
        const year = doc.upload_year || 'Unknown';
        if (!byYear[year]) {
          byYear[year] = [];
        }
        byYear[year].push(doc);
      });

      setDocumentsByYear(byYear);
      setError(null);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(t('Failed to load documents. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = async (documentId, fileName) => {
    setDownloadingDocs(prev => new Set([...prev, documentId]));

    try {
      const response = await documentAPI.getDownloadUrl(documentId);
      const url = response.data.download_url || response.data.url;

      if (!url) {
        throw new Error('Download URL not available');
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up with delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

    } catch (error) {
      console.error('Error downloading document:', error);
      setError(t('Failed to download document. Please try again.'));
    } finally {
      setDownloadingDocs(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            component={Link}
            to="/"
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            {t('home')}
          </MuiLink>
          <Typography color="text.primary">{t('Documents')}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            {t('Documents')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your tax documents and files')}
          </Typography>
        </Box>

        {/* Document Management Section */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DocumentManagementSection />
          </Grid>

          {/* Documents by Year */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  {t('Your Documents by Year')}
                </Typography>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : documents.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    {t('No documents found')}
                  </Typography>
                ) : (
                  Object.keys(documentsByYear)
                    .sort((a, b) => b - a) // Sort years descending
                    .map(year => (
                      <Accordion key={year} defaultExpanded={year === new Date().getFullYear().toString()}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6">
                            {year}
                            <Chip
                              label={`${documentsByYear[year].length} ${t('documents')}`}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {documentsByYear[year].map(doc => (
                              <ListItem
                                key={doc.id}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleDownload(doc.id, doc.file_name)}
                                    color="primary"
                                    disabled={downloadingDocs.has(doc.id)}
                                  >
                                    {downloadingDocs.has(doc.id) ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <DownloadIcon />
                                    )}
                                  </IconButton>
                                }
                              >
                                <ListItemIcon>
                                  <DescriptionIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary={doc.file_name}
                                  secondary={
                                    <>
                                      {doc.document_type_name} • {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)}
                                    </>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Footer />

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Documents;
