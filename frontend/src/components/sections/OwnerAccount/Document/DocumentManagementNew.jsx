import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDocuments, deleteDocument, selectDocuments } from '../../../../store/slices/documentsSlice';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Tooltip,
  LinearProgress,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Container,
  CardActions,
  Stack
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import SendIcon from '@mui/icons-material/Send';
import ArchiveIcon from '@mui/icons-material/Archive';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DraftsIcon from '@mui/icons-material/Drafts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CreateIcon from '@mui/icons-material/Create';
import LanguageIcon from '@mui/icons-material/Language';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import UpdateIcon from '@mui/icons-material/Update';

import { documentTemplates } from './templates/documentTemplates';
import DocumentFillerEnhanced from './DocumentFillerEnhanced';
import templateService from '../../../../services/templateService';
import NotificationSnackbar from '../../../common/NotificationSnackbar';

const DocumentManagementNew = () => {
  const dispatch = useDispatch();
  const documentsState = useSelector(selectDocuments);
  // Ensure documents is always an array
  const documents = Array.isArray(documentsState.documents.data) 
    ? documentsState.documents.data 
    : (documentsState.documents.data?.documents || []);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [openFillerDialog, setOpenFillerDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [language, setLanguage] = useState('en'); // UI language from user profile
  const [documentLanguage, setDocumentLanguage] = useState('en'); // Document language only
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [notification, setNotification] = useState({ open: false, severity: 'info', title: '', message: '' });

  // Fetch documents from backend on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      await dispatch(getDocuments()).unwrap();
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Show error notification to user
      setNotification({
        open: true,
        severity: 'error',
        title: 'Failed to Load Documents',
        message: error.message || 'Unable to fetch documents. Please try again later.'
      });
    }
  };

  const categories = [
    { id: 'lease', name: 'Lease', icon: <GavelIcon />, color: '#6366F1', count: 8 },  // Soft indigo
    { id: 'notices', name: 'Notices', icon: <NotificationsIcon />, color: '#EF4444', count: 6 },  // Soft red
    { id: 'addendums', name: 'Addendums', icon: <AssignmentIcon />, color: '#3B82F6', count: 5 },  // Soft blue
    { id: 'maintenance', name: 'Maintenance', icon: <BuildIcon />, color: '#10B981', count: 7 },  // Soft green
    { id: 'financial', name: 'Financial', icon: <AttachMoneyIcon />, color: '#8B5CF6', count: 4 },  // Soft purple
    { id: 'disclosures', name: 'Disclosures', icon: <DescriptionIcon />, color: '#F59E0B', count: 3 },  // Soft amber
  ];

  // Get recent activity from documents
  const getRecentActivity = () => {
    // Sort documents by date and get the 3 most recent
    const sortedDocs = [...documents].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    
    return sortedDocs.map(doc => {
      let action = '';
      let icon = null;
      let color = '';
      
      if (doc.status === 'completed') {
        action = language === 'de' ? 'unterzeichnet' :
                 language === 'fr' ? 'signé' :
                 language === 'it' ? 'firmato' :
                 'signed';
        icon = <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />;
        color = '#05966915';
      } else if (doc.status === 'pending_tenant_signature') {
        action = language === 'de' ? 'zur Unterschrift gesendet' :
                 language === 'fr' ? 'envoyé pour signature' :
                 language === 'it' ? 'inviato per la firma' :
                 'sent for signature';
        icon = <SendIcon sx={{ fontSize: 18, color: '#3B82F6' }} />;
        color = '#3B82F615';
      } else if (doc.status === 'draft') {
        action = language === 'de' ? 'als Entwurf gespeichert' :
                 language === 'fr' ? 'enregistré comme brouillon' :
                 language === 'it' ? 'salvato come bozza' :
                 'saved as draft';
        icon = <EditIcon sx={{ fontSize: 18, color: '#F59E0B' }} />;
        color = '#F59E0B15';
      } else {
        action = language === 'de' ? 'aktualisiert' :
                 language === 'fr' ? 'mis à jour' :
                 language === 'it' ? 'aggiornato' :
                 'updated';
        icon = <UpdateIcon sx={{ fontSize: 18, color: '#6B7280' }} />;
        color = '#6B728015';
      }
      
      // Calculate time ago
      const dateObj = new Date(doc.date);
      const now = new Date();
      const diffMs = now - dateObj;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let timeAgo = '';
      if (diffHours < 1) {
        timeAgo = language === 'de' ? 'gerade eben' :
                  language === 'fr' ? 'à l\'instant' :
                  language === 'it' ? 'proprio ora' :
                  'just now';
      } else if (diffHours < 24) {
        timeAgo = language === 'de' ? `vor ${diffHours} Stunden` :
                  language === 'fr' ? `il y a ${diffHours} heures` :
                  language === 'it' ? `${diffHours} ore fa` :
                  `${diffHours} hours ago`;
      } else {
        timeAgo = language === 'de' ? `vor ${diffDays} Tagen` :
                  language === 'fr' ? `il y a ${diffDays} jours` :
                  language === 'it' ? `${diffDays} giorni fa` :
                  `${diffDays} days ago`;
      }
      
      return {
        id: doc.id,
        name: doc.name,
        action,
        tenant: doc.tenant,
        timeAgo,
        icon,
        color
      };
    });
  };

  const handleTemplateSelect = async (template) => {
    console.log('Template selected:', template);
    
    try {
      // Load template using the service
      const templateData = await templateService.getTemplate(template.id, documentLanguage);
      console.log('Template data loaded:', templateData ? 'Success' : 'Failed');
      
      if (templateData) {
        // Generate HTML from template
        const htmlContent = templateService.generateHtmlFromTemplate(templateData, {});
        
        setSelectedTemplate({
          ...template,
          content: htmlContent,
          templateData: templateData
        });
        setOpenTemplateDialog(false);
        setOpenFillerDialog(true);
      } else {
        console.error('Failed to load template');
        // Fallback: use the original template
        setSelectedTemplate(template);
        setOpenTemplateDialog(false);
        setOpenFillerDialog(true);
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      setSelectedTemplate(template);
      setOpenTemplateDialog(false);
      setOpenFillerDialog(true);
    }
  };

  const handleDocumentLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setDocumentLanguage(newLanguage);
    
    // If a template is already selected, reload it with the new language
    if (selectedTemplate) {
      handleTemplateSelect(selectedTemplate);
    }
  };

  // Document Action Handlers
  const handleViewDocument = (doc) => {
    if (doc.document_html) {
      const viewWindow = window.open('', '_blank');
      viewWindow.document.write(doc.document_html);
      viewWindow.document.close();
    }
  };

  const handleEditDocument = (doc) => {
    setSelectedTemplate({
      id: doc.template_id,
      name: doc.template_name || doc.name,
      content: doc.document_html,
      templateData: doc.template_data,
      fieldValues: doc.field_values
    });
    setOpenFillerDialog(true);
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await dispatch(deleteDocument(docId)).unwrap();
        // Refresh the documents list after successful deletion
        await fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleSendDocument = (doc) => {
    console.log('Send document:', doc);
    // TODO: Implement email/sharing functionality
  };

  const handleDownloadDocument = (doc) => {
    const element = document.createElement('a');
    const file = new Blob([doc.document_html || '<html><body>Document content</body></html>'], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.name || 'document'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const steps = [
    {
      label: language === 'de' ? 'Vorlage wählen' : 
             language === 'fr' ? 'Choisir un modèle' :
             language === 'it' ? 'Scegli un modello' : 'Choose a Template',
      description: language === 'de' ? 'Wählen Sie aus unserer Bibliothek professioneller Vorlagen' :
                   language === 'fr' ? 'Sélectionnez parmi notre bibliothèque de modèles professionnels' :
                   language === 'it' ? 'Seleziona dalla nostra libreria di modelli professionali' :
                   'Select from our library of professional property management templates',
      icon: <AssignmentIcon />
    },
    {
      label: language === 'de' ? 'Details ausfüllen' :
             language === 'fr' ? 'Remplir les détails' :
             language === 'it' ? 'Compila i dettagli' : 'Fill in Details',
      description: language === 'de' ? 'Klicken Sie auf ein Feld, um es in Echtzeit auszufüllen' :
                   language === 'fr' ? 'Cliquez sur n\'importe quel champ pour le remplir en temps réel' :
                   language === 'it' ? 'Clicca su qualsiasi campo per compilarlo in tempo reale' :
                   'Click on any field in the document to fill it in real-time',
      icon: <CreateIcon />
    },
    {
      label: language === 'de' ? 'Unterschriften hinzufügen' :
             language === 'fr' ? 'Ajouter des signatures' :
             language === 'it' ? 'Aggiungi firme' : 'Add Signatures',
      description: language === 'de' ? 'Digital unterschreiben oder Unterschriften anfordern' :
                   language === 'fr' ? 'Signer numériquement ou demander des signatures' :
                   language === 'it' ? 'Firma digitalmente o richiedi firme' :
                   'Sign digitally or request signatures from tenants',
      icon: <EditIcon />
    },
    {
      label: language === 'de' ? 'Senden & Speichern' :
             language === 'fr' ? 'Envoyer et stocker' :
             language === 'it' ? 'Invia e archivia' : 'Send & Store',
      description: language === 'de' ? 'An Empfänger senden und sicher in der Cloud speichern' :
                   language === 'fr' ? 'Envoyer aux destinataires et stocker en toute sécurité' :
                   language === 'it' ? 'Invia ai destinatari e archivia in modo sicuro' :
                   'Send to recipients and store securely in the cloud',
      icon: <SendIcon />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Section for First Time Users */}
      {showWelcome && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowWelcome(false)}>
              {language === 'de' ? 'Schließen' : 
               language === 'fr' ? 'Fermer' :
               language === 'it' ? 'Chiudi' : 'Dismiss'}
            </Button>
          }
          icon={<InfoIcon />}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {language === 'de' ? 'Willkommen beim Dokumentenmanagement!' :
             language === 'fr' ? 'Bienvenue dans la gestion des documents!' :
             language === 'it' ? 'Benvenuto nella gestione dei documenti!' :
             'Welcome to Document Management!'}
          </Typography>
          <Typography variant="body2">
            {language === 'de' ? 'Erstellen Sie professionelle Immobiliendokumente in Sekunden. Wählen Sie eine Vorlage, füllen Sie die Details aus und senden Sie sie an Ihre Mieter.' :
             language === 'fr' ? 'Créez des documents immobiliers professionnels en quelques secondes. Choisissez un modèle, remplissez les détails et envoyez-les à vos locataires.' :
             language === 'it' ? 'Crea documenti immobiliari professionali in pochi secondi. Scegli un modello, compila i dettagli e inviali ai tuoi inquilini.' :
             'Create professional property documents in seconds. Choose a template, fill in the details, and send to your tenants.'}
          </Typography>
        </Alert>
      )}

      {/* Header with Language Selector */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',  // Soft indigo gradient
          borderRadius: 3
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="h3" sx={{ color: '#312E81', fontWeight: 'bold', mb: 2 }}>
              {language === 'de' ? 'Dokumentenzentrum' :
               language === 'fr' ? 'Centre de documents' :
               language === 'it' ? 'Centro documenti' :
               'Document Center'}
            </Typography>
            <Typography variant="h6" sx={{ color: '#4C1D95', mb: 3 }}>
              {language === 'de' ? 'Professionelle Immobiliendokumente einfach gemacht' :
               language === 'fr' ? 'Documents immobiliers professionnels simplifiés' :
               language === 'it' ? 'Documenti immobiliari professionali resi semplici' :
               'Professional property documents made simple'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<TrendingUpIcon />} 
                label={`${documents.length} ${language === 'de' ? 'Aktive Dokumente' : 
                        language === 'fr' ? 'Documents actifs' :
                        language === 'it' ? 'Documenti attivi' : 'Active Documents'}`}
                sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#4C1D95' }}
              />
              <Chip 
                icon={<AccessTimeIcon />} 
                label={language === 'de' ? 'Durchschnitt: 5 Min. zum Abschluss' :
                       language === 'fr' ? 'Moyenne: 5 min pour terminer' :
                       language === 'it' ? 'Media: 5 min per completare' :
                       'Average: 5 min to complete'}
                sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#4C1D95' }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#4C1D95', mb: 1 }}>
                {language === 'de' ? 'Schnellaktionen' :
                 language === 'fr' ? 'Actions rapides' :
                 language === 'it' ? 'Azioni rapide' :
                 'Quick Actions'}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setOpenTemplateDialog(true);
                      setActiveStep(1);
                    }}
                    sx={{
                      bgcolor: 'white',
                      color: '#4338CA',
                      '&:hover': { bgcolor: '#F5F3FF' }
                    }}
                  >
                    {language === 'de' ? 'Neu' :
                     language === 'fr' ? 'Nouveau' :
                     language === 'it' ? 'Nuovo' :
                     'New Document'}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FolderIcon />}
                    onClick={() => setOpenTemplateDialog(true)}
                    sx={{
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#4338CA',
                      bgcolor: 'transparent',
                      '&:hover': {
                        borderColor: '#6366F1',
                        bgcolor: 'rgba(99, 102, 241, 0.05)'
                      }
                    }}
                  >
                    {language === 'de' ? 'Vorlagen' :
                     language === 'fr' ? 'Modèles' :
                     language === 'it' ? 'Modelli' :
                     'Templates'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="caption" sx={{ color: '#6366F1', mb: 0.5, display: 'block' }}>
                Document Language
              </Typography>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 1 }}>
                <Select
                  value={documentLanguage}
                  onChange={handleDocumentLanguageChange}
                  sx={{
                    color: '#4338CA',
                    '.MuiSelect-icon': { color: '#6366F1' },
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' }
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <LanguageIcon sx={{ color: '#6366F1', mr: 1 }} />
                    </InputAdornment>
                  }
                >
                <MenuItem value="en">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🇬🇧 English
                  </Box>
                </MenuItem>
                <MenuItem value="de">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🇩🇪 Deutsch
                  </Box>
                </MenuItem>
                <MenuItem value="fr">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🇫🇷 Français
                  </Box>
                </MenuItem>
                <MenuItem value="it">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🇮🇹 Italiano
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* How It Works Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#FAFAFF', borderRadius: 2, border: '1px solid #E0E7FF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon /> 
            {language === 'de' ? 'So funktioniert es' :
             language === 'fr' ? 'Comment ça marche' :
             language === 'it' ? 'Come funziona' :
             'How It Works'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => setShowTutorial(true)}
          >
            {language === 'de' ? 'Tutorial ansehen' :
             language === 'fr' ? 'Voir le tutoriel' :
             language === 'it' ? 'Guarda il tutorial' :
             'Watch Tutorial'}
          </Button>
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                StepIconComponent={() => (
                  <Avatar 
                    sx={{
                      bgcolor: activeStep >= index ? '#6366F1' : '#EEF2FF',
                      width: 40,
                      height: 40,
                      cursor: 'pointer'
                    }}
                    onClick={() => setActiveStep(index)}
                  >
                    {React.cloneElement(step.icon, { sx: { fontSize: 20 } })}
                  </Avatar>
                )}
              >
                <Typography variant="subtitle2" fontWeight="bold">{step.label}</Typography>
                <Typography variant="caption" color="text.secondary">{step.description}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Quick Stats with Better Visual Hierarchy */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card 
            elevation={0} 
            sx={{
              border: '2px solid',
              borderColor: '#E5E7EB',
              borderRadius: 2,
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}
            onClick={() => {
              setStatusFilter('completed');
              setTabValue(0); // Show all documents tab
              setSearchTerm(''); // Clear search
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: '#374151', fontWeight: 'bold' }}>
                    {documents.filter(d => d.status === 'completed').length}
                  </Typography>
                  <Typography color="text.secondary" variant="body1">
                    {language === 'de' ? 'Abgeschlossen' :
                     language === 'fr' ? 'Terminé' :
                     language === 'it' ? 'Completato' :
                     'Completed'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F3F4F6', width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#6B7280' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '2px solid',
              borderColor: '#FECACA',  // Light red
              borderRadius: 2,
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}
            onClick={() => {
              setStatusFilter('pending_tenant_signature');
              setTabValue(0);
              setSearchTerm('');
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: '#DC2626', fontWeight: 'bold' }}>
                    {documents.filter(d => d.status === 'pending' || d.status === 'pending_tenant_signature').length}
                  </Typography>
                  <Typography color="text.secondary" variant="body1">
                    {language === 'de' ? 'Ausstehend' :
                     language === 'fr' ? 'En attente' :
                     language === 'it' ? 'In attesa' :
                     'Awaiting'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FEF2F2', width: 56, height: 56 }}>
                  <PendingIcon sx={{ fontSize: 32, color: '#EF4444' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '2px solid',
              borderColor: '#BFDBFE',  // Light blue
              borderRadius: 2,
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}
            onClick={() => {
              setStatusFilter('draft');
              setTabValue(0);
              setSearchTerm('');
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: '#2563EB', fontWeight: 'bold' }}>
                    {documents.filter(d => d.status === 'draft').length}
                  </Typography>
                  <Typography color="text.secondary" variant="body1">
                    {language === 'de' ? 'Entwürfe' :
                     language === 'fr' ? 'Brouillons' :
                     language === 'it' ? 'Bozze' :
                     'Drafts'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EFF6FF', width: 56, height: 56 }}>
                  <DraftsIcon sx={{ fontSize: 32, color: '#3B82F6' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '2px solid',
              borderColor: '#E9D5FF',  // Light purple
              borderRadius: 2,
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}
            onClick={() => setOpenTemplateDialog(true)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: '#7C3AED', fontWeight: 'bold' }}>
                    30+
                  </Typography>
                  <Typography color="text.secondary" variant="body1">
                    {language === 'de' ? 'Vorlagen' :
                     language === 'fr' ? 'Modèles' :
                     language === 'it' ? 'Modelli' :
                     'Templates'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F3E8FF', width: 56, height: 56 }}>
                  <AssignmentIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Template Categories - Improved Layout */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ color: '#F59E0B' }} /> 
          {language === 'de' ? 'Beliebte Vorlagen' :
           language === 'fr' ? 'Modèles populaires' :
           language === 'it' ? 'Modelli popolari' :
           'Popular Templates'}
        </Typography>
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={category.id}>
              <Card 
                elevation={0}
                sx={{ 
                  cursor: 'pointer',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: category.color,
                    boxShadow: `0 8px 24px ${category.color}20`
                  }
                }}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setOpenTemplateDialog(true);
                  setActiveStep(0);
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${category.color}15`, 
                      width: 64, 
                      height: 64, 
                      margin: '0 auto', 
                      mb: 2 
                    }}
                  >
                    {React.cloneElement(category.icon, { 
                      sx: { fontSize: 32, color: category.color } 
                    })}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight="600">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.count} {language === 'de' ? 'Vorlagen' :
                                      language === 'fr' ? 'modèles' :
                                      language === 'it' ? 'modelli' :
                                      'templates'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Content Area with Better Organization */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            {/* Enhanced Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={language === 'de' ? 'Suche nach Dokumentname, Typ oder Empfänger...' :
                            language === 'fr' ? 'Rechercher par nom, type ou destinataire...' :
                            language === 'it' ? 'Cerca per nome, tipo o destinatario...' :
                            'Search by document name, type, or recipient...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setStatusFilter(null); // Clear status filter when searching
                }}
                sx={{ 
                  '.MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#F0F4FF'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small">
                        <FilterListIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* Tabs */}
            <Tabs value={tabValue} onChange={(e, v) => {
              setTabValue(v);
              setStatusFilter(null); // Clear status filter when changing tabs
            }} sx={{ mb: 3 }}>
              <Tab label={language === 'de' ? 'Alle Dokumente' :
                         language === 'fr' ? 'Tous les documents' :
                         language === 'it' ? 'Tutti i documenti' :
                         'All Documents'} />
              <Tab label={language === 'de' ? 'Aktiv' :
                         language === 'fr' ? 'Actif' :
                         language === 'it' ? 'Attivo' :
                         'Active'} />
              <Tab label={language === 'de' ? 'Archiviert' :
                         language === 'fr' ? 'Archivé' :
                         language === 'it' ? 'Archiviato' :
                         'Archived'} />
            </Tabs>

            {/* Show active filter */}
            {statusFilter && (
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    size="small" 
                    onClick={() => setStatusFilter(null)}
                  >
                    Clear Filter
                  </Button>
                }
              >
                Showing {statusFilter} documents
              </Alert>
            )}
            
            {/* Document List */}
            <List>
              {documents
                .filter(doc => {
                  // Filter by status if status filter is active
                  if (statusFilter) {
                    return doc.status === statusFilter;
                  }
                  // Filter by search term
                  if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    return doc.name.toLowerCase().includes(search) ||
                           doc.tenant.toLowerCase().includes(search) ||
                           doc.status.toLowerCase().includes(search);
                  }
                  return true;
                })
                .filter(doc => {
                  // Filter by tab
                  if (tabValue === 1) return doc.status !== 'archived'; // Active
                  if (tabValue === 2) return doc.status === 'archived'; // Archived
                  return true; // All documents
                })
                .map((doc, index) => (
                <React.Fragment key={doc.id}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      '&:hover': { bgcolor: '#f8f9fa' },
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: '#667eea10' }}>
                        <DescriptionIcon sx={{ color: '#667eea' }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          <Typography variant="subtitle1" fontWeight="500" component="span">
                            {doc.name}
                          </Typography>
                          <Chip 
                            label={doc.status === 'pending_tenant_signature' ? 'Awaiting Signature' : doc.status} 
                            size="small"
                            color={doc.status === 'completed' ? 'success' : 
                                   (doc.status === 'pending' || doc.status === 'pending_tenant_signature') ? 'warning' : 
                                   doc.status === 'draft' ? 'info' : 
                                   doc.status === 'archived' ? 'default' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </>
                      }
                      secondary={`${doc.tenant} • ${doc.date}`}
                    />
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleViewDocument(doc)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditDocument(doc)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send">
                        <IconButton size="small" onClick={() => handleSendDocument(doc)}>
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownloadDocument(doc)}>
                          <GetAppIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteDocument(doc.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItem>
                  {index < documents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* Empty State */}
            {documents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FolderIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {language === 'de' ? 'Keine Dokumente gefunden' :
                   language === 'fr' ? 'Aucun document trouvé' :
                   language === 'it' ? 'Nessun documento trovato' :
                   'No documents found'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {language === 'de' ? 'Erstellen Sie Ihr erstes Dokument, um zu beginnen' :
                   language === 'fr' ? 'Créez votre premier document pour commencer' :
                   language === 'it' ? 'Crea il tuo primo documento per iniziare' :
                   'Create your first document to get started'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTemplateDialog(true)}
                  sx={{ bgcolor: '#667eea' }}
                >
                  {language === 'de' ? 'Dokument erstellen' :
                   language === 'fr' ? 'Créer un document' :
                   language === 'it' ? 'Crea documento' :
                   'Create Document'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Enhanced Right Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon /> 
              {language === 'de' ? 'Letzte Aktivität' :
               language === 'fr' ? 'Activité récente' :
               language === 'it' ? 'Attività recente' :
               'Recent Activity'}
            </Typography>
            <List dense>
              {getRecentActivity().length > 0 ? (
                getRecentActivity().map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: activity.color, width: 32, height: 32 }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" fontWeight="500">
                            {activity.name} {activity.action}
                          </Typography>
                        }
                        secondary={`${activity.tenant} • ${activity.timeAgo}`}
                      />
                    </ListItem>
                    {index < getRecentActivity().length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {language === 'de' ? 'Keine aktuelle Aktivität' :
                         language === 'fr' ? 'Aucune activité récente' :
                         language === 'it' ? 'Nessuna attività recente' :
                         'No recent activity'}
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: '2px dashed #667eea', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutlineIcon sx={{ color: '#667eea' }} /> 
              {language === 'de' ? 'Benötigen Sie Hilfe?' :
               language === 'fr' ? 'Besoin d\'aide?' :
               language === 'it' ? 'Hai bisogno di aiuto?' :
               'Need Help?'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {language === 'de' ? 'Erfahren Sie, wie Sie Dokumente effizient erstellen und verwalten' :
               language === 'fr' ? 'Apprenez à créer et gérer des documents efficacement' :
               language === 'it' ? 'Scopri come creare e gestire documenti in modo efficiente' :
               'Learn how to create and manage documents efficiently'}
            </Typography>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                mb: 1,
                bgcolor: '#667eea',
                '&:hover': { bgcolor: '#5a67d8' }
              }}
              startIcon={<InfoIcon />}
            >
              {language === 'de' ? 'Tutorial ansehen' :
               language === 'fr' ? 'Voir le tutoriel' :
               language === 'it' ? 'Guarda il tutorial' :
               'Watch Tutorial'}
            </Button>
            <Button 
              fullWidth 
              variant="outlined"
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': { 
                  borderColor: '#667eea',
                  bgcolor: '#667eea10' 
                }
              }}
            >
              {language === 'de' ? 'Support kontaktieren' :
               language === 'fr' ? 'Contacter le support' :
               language === 'it' ? 'Contatta il supporto' :
               'Contact Support'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#667eea',
          '&:hover': { bgcolor: '#5a67d8' }
        }}
        onClick={() => setOpenTemplateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Template Selection Dialog */}
      <Dialog
        open={openTemplateDialog}
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {language === 'de' ? 'Vorlage auswählen' :
               language === 'fr' ? 'Sélectionner un modèle' :
               language === 'it' ? 'Seleziona un modello' :
               'Select Template'}
            </Typography>
            <IconButton onClick={() => setOpenTemplateDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '400px', maxHeight: '70vh', overflow: 'auto' }}>
          <Tabs 
            value={selectedCategory} 
            onChange={(e, v) => setSelectedCategory(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}
          >
            <Tab value="all" label={language === 'de' ? 'Alle' :
                                   language === 'fr' ? 'Tous' :
                                   language === 'it' ? 'Tutti' :
                                   'All'} />
            {categories.map((cat) => (
              <Tab key={cat.id} value={cat.id} label={cat.name} />
            ))}
          </Tabs>
          
          {(() => {
            const allTemplates = Object.values(documentTemplates)
              .flatMap(categoryObj => Object.values(categoryObj));
            console.log('Document templates loaded:', allTemplates.length, 'templates');
            console.log('Selected category:', selectedCategory);
            const filteredTemplates = allTemplates
              .filter(template => selectedCategory === 'all' || template.category === selectedCategory);
            console.log('Filtered templates:', filteredTemplates.length);
            
            if (filteredTemplates.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {language === 'de' ? 'Keine Vorlagen verfügbar' :
                     language === 'fr' ? 'Aucun modèle disponible' :
                     language === 'it' ? 'Nessun modello disponibile' :
                     'No templates available'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {language === 'de' ? 'Bitte wählen Sie eine andere Kategorie' :
                     language === 'fr' ? 'Veuillez sélectionner une autre catégorie' :
                     language === 'it' ? 'Si prega di selezionare un\'altra categoria' :
                     'Please select another category'}
                  </Typography>
                </Box>
              );
            }
            
            return (
              <Grid container spacing={2}>
                {filteredTemplates.map((template) => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          boxShadow: 3,
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s'
                      }}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#667eea10' }}>
                            <DescriptionIcon sx={{ color: '#667eea' }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {template.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          fullWidth 
                          endIcon={<ArrowForwardIcon />}
                          sx={{ color: '#667eea' }}
                        >
                          {language === 'de' ? 'Verwenden' :
                           language === 'fr' ? 'Utiliser' :
                           language === 'it' ? 'Usa' :
                           'Use Template'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Document Filler Dialog */}
      <Dialog
        open={openFillerDialog}
        onClose={() => setOpenFillerDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedTemplate && (
            <DocumentFillerEnhanced
              template={selectedTemplate}
              tenantApplications={[
                // Mock data - replace with actual tenant applications from your backend
                { id: 1, name: 'John Smith', email: 'john.smith@email.com', property: '123 Main St', applicationDate: '2024-01-15' },
                { id: 2, name: 'Jane Doe', email: 'jane.doe@email.com', property: '456 Oak Ave', applicationDate: '2024-01-20' },
                { id: 3, name: 'Robert Johnson', email: 'robert.j@email.com', property: '789 Pine Rd', applicationDate: '2024-01-25' }
              ]}
              onSave={(data) => {
                console.log('Document saved:', data);
                // Here you would save to backend
                // If data includes sentToTenant, handle sending to tenant
                if (data.sentToTenant) {
                  console.log('Sending document to tenant:', data.tenantEmail);
                  // API call to send document to tenant for signature
                }
                setOpenFillerDialog(false);
              }}
              onClose={() => setOpenFillerDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Snackbar */}
      <NotificationSnackbar
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        severity={notification.severity}
        title={notification.title}
        message={notification.message}
      />
    </Container>
  );
};

export default DocumentManagementNew;