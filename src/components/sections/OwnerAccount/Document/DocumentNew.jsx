import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

// Icons
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Redux
import { getDocuments, createDocument, deleteDocument } from '../../../../store/slices/documentsSlice';
import { fetchProperties } from '../../../../store/slices/propertiesSlice';

const DocumentManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Redux state
  const documents = useSelector(state => state.documents?.documents?.data) || [];
  const properties = useSelector(state => state.properties?.properties?.data) || [];
  const isLoading = useSelector(state => state.documents?.documents?.isLoading);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Fetch data on mount
  useEffect(() => {
    dispatch(getDocuments());
    dispatch(fetchProperties());
  }, [dispatch]);
  
  // Filter documents by type
  const leaseDocuments = documents.filter(doc => 
    doc.document_type === 'lease' || doc.type === 'lease'
  );
  const tenantDocuments = documents.filter(doc => 
    doc.document_type === 'tenant' || doc.type === 'tenant' || 
    doc.document_type === 'identification' || doc.document_type === 'proof_of_income'
  );
  const propertyDocuments = documents.filter(doc => 
    doc.document_type === 'property' || doc.type === 'property' ||
    doc.document_type === 'insurance' || doc.document_type === 'maintenance'
  );
  
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'signed':
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
      case 'in_progress':
        return 'warning';
      case 'expired':
      case 'terminated':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'signed':
      case 'active':
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'pending':
      case 'in_progress':
        return <PendingIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };
  
  const handleDeleteDocument = (docId) => {
    if (window.confirm(t('Are you sure you want to delete this document?'))) {
      dispatch(deleteDocument(docId)).then(() => {
        dispatch(getDocuments());
      });
    }
  };
  
  const handleDownload = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    }
  };
  
  const handleView = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    }
  };
  
  const DocumentTable = ({ documents, type }) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('Document Name')}</TableCell>
            <TableCell>{t('Property')}</TableCell>
            {type === 'lease' && <TableCell>{t('Tenant')}</TableCell>}
            <TableCell>{t('Type')}</TableCell>
            <TableCell>{t('Status')}</TableCell>
            <TableCell>{t('Date')}</TableCell>
            <TableCell align="right">{t('Actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {doc.name || doc.document_name || `${type} Document`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {properties.find(p => p.id === doc.property_id)?.title || 
                   doc.property_address || 
                   `Property ${doc.property_id}`}
                </TableCell>
                {type === 'lease' && (
                  <TableCell>{doc.tenant_name || doc.renter_full_name || '-'}</TableCell>
                )}
                <TableCell>
                  <Chip 
                    label={doc.document_type || type} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={doc.status || 'Pending'}
                    size="small"
                    color={getStatusColor(doc.status)}
                    icon={getStatusIcon(doc.status)}
                  />
                </TableCell>
                <TableCell>
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleView(doc)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDownload(doc)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteDocument(doc.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={type === 'lease' ? 7 : 6} align="center">
                <Box sx={{ py: 3 }}>
                  <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    {t('No documents yet')}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          {t('Document Management')}
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          <Typography variant="body2">
            {t('Documents are automatically collected from tenant applications')}
          </Typography>
        </Alert>
      </Box>
      
      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{leaseDocuments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Lease Agreements')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">{tenantDocuments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Tenant Documents')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6">{propertyDocuments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Property Documents')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">
                {documents.filter(d => d.status === 'signed' || d.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Active Documents')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab 
            label={
              <Badge badgeContent={leaseDocuments.length} color="primary">
                {t('Lease Agreements')}
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={tenantDocuments.length} color="primary">
                {t('Tenant Documents')}
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={propertyDocuments.length} color="primary">
                {t('Property Documents')}
              </Badge>
            } 
          />
        </Tabs>
      </Paper>
      
      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && <DocumentTable documents={leaseDocuments} type="lease" />}
          {tabValue === 1 && <DocumentTable documents={tenantDocuments} type="tenant" />}
          {tabValue === 2 && <DocumentTable documents={propertyDocuments} type="property" />}
        </>
      )}
    </Box>
  );
};

export default DocumentManagement;