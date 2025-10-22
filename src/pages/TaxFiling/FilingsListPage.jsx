/**
 * Filings List Page
 * Displays all tax filings for the user, grouped by year
 * Supports multi-canton filings and copy from previous year
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
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
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as ContinueIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CompleteIcon,
  Schedule as InProgressIcon,
  Description as DraftIcon
} from '@mui/icons-material';
import axios from 'axios';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

// Swiss canton codes
const CANTONS = [
  { code: 'ZH', name: 'Zürich' },
  { code: 'BE', name: 'Bern' },
  { code: 'LU', name: 'Luzern' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'ZG', name: 'Zug' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'AG', name: 'Aargau' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Ticino' },
  { code: 'VD', name: 'Vaud' },
  { code: 'VS', name: 'Valais' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'GE', name: 'Geneva' },
  { code: 'JU', name: 'Jura' }
];

const FilingsListPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State
  const [filings, setFilings] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState(null);

  // Create filing form
  const [newFiling, setNewFiling] = useState({
    tax_year: new Date().getFullYear(),
    canton: 'ZH',
    municipality: '',
    postal_code: '',
    language: i18n.language || 'en',
    is_primary: true
  });

  // Postal code lookup state
  const [postalCodeLookup, setPostalCodeLookup] = useState({
    loading: false,
    error: null,
    result: null
  });

  // Copy filing form
  const [copyForm, setCopyForm] = useState({
    source_filing_id: '',
    new_year: new Date().getFullYear()
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuFiling, setMenuFiling] = useState(null);

  // Load filings on mount
  useEffect(() => {
    loadFilings();
  }, []);

  const loadFilings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use cookie-based authentication (configured in axiosConfig)
      const response = await axios.get('/api/tax-filing/filings');

      setFilings(response.data.filings || {});
      setStatistics(response.data.statistics || {});
    } catch (err) {
      console.error('Error loading filings:', err);
      setError(err.response?.data?.detail || 'Failed to load filings');
    } finally {
      setLoading(false);
    }
  };

  const handlePostalCodeLookup = async (postalCode) => {
    if (!postalCode || postalCode.length !== 4) {
      setPostalCodeLookup({ loading: false, error: null, result: null });
      return;
    }

    setPostalCodeLookup({ loading: true, error: null, result: null });

    try {
      const response = await axios.get(
        `/api/tax-filing/postal-code/${postalCode}`
      );

      setPostalCodeLookup({
        loading: false,
        error: null,
        result: response.data
      });

      // Auto-fill municipality and canton
      setNewFiling(prev => ({
        ...prev,
        municipality: response.data.municipality,
        canton: response.data.canton
      }));
    } catch (err) {
      console.error('Error looking up postal code:', err);

      // Distinguish between "not found" and other errors
      let errorMessage = 'Postal code not found';
      if (err.response?.status === 404) {
        errorMessage = 'This postal code is not valid or does not exist in Switzerland. Please check and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.detail || 'Invalid postal code format';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }

      setPostalCodeLookup({
        loading: false,
        error: errorMessage,
        result: null
      });
    }
  };

  const handleCreateFiling = async () => {
    try {
      const response = await axios.post(
        '/api/tax-filing/filings',
        newFiling
      );

      setCreateDialogOpen(false);
      loadFilings();

      // Navigate to pre-interview document screen
      navigate(`/${i18n.language}/tax-filing/pre-interview/${response.data.id}`);
    } catch (err) {
      console.error('Error creating filing:', err);
      alert(err.response?.data?.detail || 'Failed to create filing');
    }
  };

  const handleCopyFiling = async () => {
    try {
      await axios.post(
        '/api/tax-filing/filings/copy',
        copyForm
      );

      setCopyDialogOpen(false);
      loadFilings();
    } catch (err) {
      console.error('Error copying filing:', err);
      alert(err.response?.data?.detail || 'Failed to copy filing');
    }
  };

  const handleDeleteFiling = async (filingId) => {
    console.log('[DELETE] Starting deletion for filing:', filingId);

    if (!window.confirm(t('filings.confirmDelete'))) {
      console.log('[DELETE] User cancelled deletion');
      return;
    }

    try {
      console.log('[DELETE] Calling API to delete filing:', filingId);
      const response = await axios.delete(`/api/tax-filing/filings/${filingId}`);
      console.log('[DELETE] Delete successful, response:', response);

      await loadFilings();
      console.log('[DELETE] Filings reloaded');
    } catch (err) {
      console.error('[DELETE] Error deleting filing:', err);
      console.error('[DELETE] Error details:', err.response);
      alert(err.response?.data?.detail || 'Failed to delete filing');
    }
  };

  const handleMenuOpen = (event, filing) => {
    setAnchorEl(event.currentTarget);
    setMenuFiling(filing);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFiling(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        return <CompleteIcon color="success" />;
      case 'in_progress':
        return <InProgressIcon color="primary" />;
      case 'draft':
      default:
        return <DraftIcon color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'draft':
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{t('filings.loadingFilings')}</Typography>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('filings.title', 'My Tax Filings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('filings.subtitle', 'Manage your tax returns across multiple years and cantons')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          {t('filings.newFiling', 'New Filing')}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('filings.stats.total', 'Total Filings')}
                </Typography>
                <Typography variant="h4">{statistics.total_filings || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('filings.stats.completed', 'Completed')}
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistics.completed_filings || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('filings.stats.inProgress', 'In Progress')}
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {statistics.in_progress_filings || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filings by Year */}
      {Object.keys(filings).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {t('filings.noFilings', 'No filings yet')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('filings.getStarted', 'Start your first tax filing to see it here')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('filings.startTaxFiling', 'Start Tax Filing')}
          </Button>
        </Paper>
      ) : (
        Object.keys(filings)
          .sort((a, b) => b - a) // Sort years descending
          .map((year) => (
            <Accordion key={year} defaultExpanded={year === String(new Date().getFullYear())}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {year} ({filings[year].length} {filings[year].length === 1 ? t('filings.filing') : t('filings.filings')})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {filings[year].map((filing) => (
                    <Grid item xs={12} md={6} key={filing.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(filing.status)}
                              <Typography variant="h6">{filing.name}</Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, filing)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={filing.canton || t('filings.no_canton')}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={t(`filings.status.${filing.status}`)}
                              size="small"
                              color={getStatusColor(filing.status)}
                            />
                            {filing.is_primary === false && (
                              <Chip
                                label={t('filings.secondary')}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>

                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {t('filings.progress')}: {filing.completion_percentage}%
                          </Typography>

                          <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.200', borderRadius: 1, mb: 2 }}>
                            <Box
                              sx={{
                                width: `${filing.completion_percentage}%`,
                                height: '100%',
                                bgcolor: 'primary.main',
                                borderRadius: 1
                              }}
                            />
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            {t('filings.lastUpdated')}: {new Date(filing.updated_at).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          {filing.status !== 'completed' && filing.status !== 'submitted' && (
                            <Button
                              size="small"
                              startIcon={<ContinueIcon />}
                              onClick={() => navigate(`/${i18n.language}/tax-filing/interview/${filing.id}`)}
                            >
                              {t('filings.continue')}
                            </Button>
                          )}
                          <Button
                            size="small"
                            onClick={() => navigate(`/${i18n.language}/tax-filing/review/${filing.id}`)}
                          >
                            {t('filings.viewDetails')}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/${i18n.language}/tax-filing/interview/${menuFiling?.id}`);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('filings.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCopyForm({
              source_filing_id: menuFiling?.id,
              new_year: new Date().getFullYear()
            });
            setCopyDialogOpen(true);
            handleMenuClose();
          }}
        >
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          {t('filings.copyToNewYear')}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDeleteFiling(menuFiling?.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('filings.delete')}
        </MenuItem>
      </Menu>

      {/* Create Filing Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('filings.createNew', 'Create New Tax Filing')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('filings.taxYear', 'Tax Year')}
              type="number"
              value={newFiling.tax_year}
              onChange={(e) => setNewFiling({ ...newFiling, tax_year: parseInt(e.target.value) })}
              fullWidth
            />

            <TextField
              label={t('filings.postalCodeAsOf31Dec', 'Postal Code (as of 31 December)')}
              value={newFiling.postal_code}
              onChange={(e) => {
                const value = e.target.value;
                setNewFiling({ ...newFiling, postal_code: value });
                // Trigger lookup when 4 digits entered
                if (value.length === 4) {
                  handlePostalCodeLookup(value);
                }
              }}
              placeholder={t('filings.postal_code_placeholder')}
              required
              fullWidth
              helperText={
                postalCodeLookup.loading
                  ? t('filings.lookingUpPostalCode', 'Looking up postal code...')
                  : postalCodeLookup.error
                  ? postalCodeLookup.error
                  : postalCodeLookup.result
                  ? `${postalCodeLookup.result.municipality}, ${postalCodeLookup.result.canton_name}`
                  : t('filings.enterPostalCode', 'Enter your 4-digit postal code')
              }
              error={!!postalCodeLookup.error}
              InputProps={{
                endAdornment: postalCodeLookup.loading && <CircularProgress size={20} />
              }}
            />

            {postalCodeLookup.result && (
              <>
                <TextField
                  label={t('filings.municipality', 'Municipality')}
                  value={newFiling.municipality}
                  onChange={(e) => setNewFiling({ ...newFiling, municipality: e.target.value })}
                  required
                  fullWidth
                  disabled
                  helperText={t('filings.autoFilledFromPostalCode', 'Auto-filled from postal code')}
                />

                <FormControl fullWidth disabled>
                  <InputLabel>{t('filings.canton', 'Canton')}</InputLabel>
                  <Select
                    value={newFiling.canton}
                    label={t('filings.canton', 'Canton')}
                  >
                    {CANTONS.map((canton) => (
                      <MenuItem key={canton.code} value={canton.code}>
                        {canton.name} ({canton.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t('filings.cancel')}</Button>
          <Button
            onClick={handleCreateFiling}
            variant="contained"
            color="primary"
            disabled={!newFiling.municipality.trim()}
          >
            {t('filings.createAndStart')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Filing Dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('filings.copyFiling', 'Copy Filing to New Year')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              {t('filings.copyInfo')}
            </Alert>
            <TextField
              label={t('filings.newYear', 'New Tax Year')}
              type="number"
              value={copyForm.new_year}
              onChange={(e) => setCopyForm({ ...copyForm, new_year: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>{t('filings.cancel')}</Button>
          <Button onClick={handleCopyFiling} variant="contained" color="primary">
            {t('filings.copyFiling')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    <Footer />
    </>
  );
};

export default FilingsListPage;
