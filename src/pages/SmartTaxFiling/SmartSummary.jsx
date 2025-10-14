import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  PictureAsPdf,
  Download,
  Edit,
  ExpandMore,
  AttachMoney,
  Home,
  AccountBalance,
  Receipt,
  Calculate,
  AutoAwesome,
  Refresh,
  Send,
  Print,
  Email,
  VerifiedUser,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const SmartSummary = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [selectedCanton, setSelectedCanton] = useState('ZH');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);

      // Fetch all necessary data in parallel
      const [summaryRes, calculationRes, validationRes] = await Promise.all([
        api.get('/api/v1/ai/summary'),
        api.get('/api/v1/tax/calculate'),
        api.get('/api/v1/ai/validate')
      ]);

      setSummaryData(summaryRes.data);
      setTaxCalculation(calculationRes.data);
      setValidationResults(validationRes.data);

      // Auto-expand sections with issues
      const expanded = {};
      if (validationRes.data.errors?.length > 0) expanded.validation = true;
      setExpandedSections(expanded);
    } catch (error) {
      console.error('Failed to fetch summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);

      const response = await api.post('/api/v1/ai/generate-pdf', {
        canton: selectedCanton,
        tax_year: selectedYear,
        format: 'official' // Use official canton form format
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax_declaration_${selectedCanton}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailPDF = async () => {
    try {
      await api.post('/api/v1/ai/email-pdf', {
        email: emailAddress,
        canton: selectedCanton,
        tax_year: selectedYear
      });

      setShowEmailDialog(false);
      // Show success notification
    } catch (error) {
      console.error('Failed to email PDF:', error);
    }
  };

  const handleRecalculate = async () => {
    try {
      const response = await api.get('/api/v1/tax/calculate');
      setTaxCalculation(response.data);
    } catch (error) {
      console.error('Failed to recalculate:', error);
    }
  };

  const renderIncomeSection = () => {
    const income = summaryData?.income || {};

    return (
      <Accordion expanded={expandedSections.income} onChange={() => toggleSection('income')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" width="100%">
            <AttachMoney color="primary" sx={{ mr: 2 }} />
            <Box flex={1}>
              <Typography variant="h6">Income</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {formatCurrency(income.total_gross || 0)}
              </Typography>
            </Box>
            {income.complete ? (
              <Chip label="Complete" color="success" size="small" />
            ) : (
              <Chip label="Incomplete" color="warning" size="small" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell align="right">{formatCurrency(income.gross_salary || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bonuses</TableCell>
                  <TableCell align="right">{formatCurrency(income.bonuses || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Other Income</TableCell>
                  <TableCell align="right">{formatCurrency(income.other_income || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Total Gross Income</strong></TableCell>
                  <TableCell align="right"><strong>{formatCurrency(income.total_gross || 0)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderDeductionsSection = () => {
    const deductions = summaryData?.deductions || {};

    return (
      <Accordion expanded={expandedSections.deductions} onChange={() => toggleSection('deductions')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" width="100%">
            <Receipt color="primary" sx={{ mr: 2 }} />
            <Box flex={1}>
              <Typography variant="h6">Deductions</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {formatCurrency(deductions.total || 0)}
              </Typography>
            </Box>
            <Chip label={`${Object.keys(deductions).length - 1} items`} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Professional Expenses</TableCell>
                  <TableCell align="right">{formatCurrency(deductions.professional_expenses || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Insurance Premiums</TableCell>
                  <TableCell align="right">{formatCurrency(deductions.insurance_premiums || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Pillar 3a</TableCell>
                  <TableCell align="right">{formatCurrency(deductions.pillar_3a || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Donations</TableCell>
                  <TableCell align="right">{formatCurrency(deductions.donations || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Childcare</TableCell>
                  <TableCell align="right">{formatCurrency(deductions.childcare || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Total Deductions</strong></TableCell>
                  <TableCell align="right"><strong>{formatCurrency(deductions.total || 0)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderTaxCalculation = () => {
    if (!taxCalculation) return null;

    return (
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Calculate color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Tax Calculation</Typography>
            </Box>
            <IconButton onClick={handleRecalculate} size="small">
              <Refresh />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary">Taxable Income</Typography>
                <Typography variant="h5">{formatCurrency(taxCalculation.taxable_income)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary">Total Tax Due</Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(taxCalculation.total_tax)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>Tax Breakdown</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Federal Tax</Typography>
                <Typography variant="body1">{formatCurrency(taxCalculation.federal_tax)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Cantonal Tax</Typography>
                <Typography variant="body1">{formatCurrency(taxCalculation.cantonal_tax)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Municipal Tax</Typography>
                <Typography variant="body1">{formatCurrency(taxCalculation.municipal_tax)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Church Tax</Typography>
                <Typography variant="body1">{formatCurrency(taxCalculation.church_tax || 0)}</Typography>
              </Grid>
            </Grid>
          </Box>

          {taxCalculation.comparison && (
            <Alert
              severity={taxCalculation.comparison.change > 0 ? 'warning' : 'success'}
              sx={{ mt: 2 }}
              icon={taxCalculation.comparison.change > 0 ? <TrendingUp /> : <TrendingDown />}
            >
              <Typography variant="body2">
                {taxCalculation.comparison.change > 0 ? 'Increase' : 'Decrease'} of{' '}
                {formatCurrency(Math.abs(taxCalculation.comparison.change))} ({taxCalculation.comparison.percentage}%)
                compared to last year
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderValidationResults = () => {
    if (!validationResults) return null;

    return (
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <VerifiedUser color={validationResults.is_valid ? 'success' : 'error'} sx={{ mr: 2 }} />
            <Typography variant="h6">Validation Results</Typography>
          </Box>

          {validationResults.is_valid ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your tax declaration is complete and ready for submission
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please address the following issues before submitting
            </Alert>
          )}

          {validationResults.errors?.length > 0 && (
            <List>
              {validationResults.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.field}
                    secondary={error.message}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => navigate('/smart-tax-filing/review', { state: { field: error.field } })}
                    >
                      Fix
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {validationResults.warnings?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Warnings</Typography>
              <List>
                {validationResults.warnings.map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={warning.field}
                      secondary={warning.message}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Tax Declaration Summary
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review your complete tax declaration before generating the official PDF.
      </Typography>

      {/* Progress Overview */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Completion Status</Typography>
            <Chip
              label={`${summaryData?.completeness || 0}% Complete`}
              color={summaryData?.completeness >= 95 ? 'success' : 'warning'}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={summaryData?.completeness || 0}
            sx={{ height: 10, borderRadius: 1 }}
          />
        </CardContent>
      </Card>

      {/* AI Insights */}
      {summaryData?.ai_insights && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={<AutoAwesome />}
        >
          <Typography variant="subtitle2" gutterBottom>AI Insights</Typography>
          <Typography variant="body2">{summaryData.ai_insights}</Typography>
        </Alert>
      )}

      {/* Main Content Sections */}
      {renderIncomeSection()}
      <Box mt={2} />
      {renderDeductionsSection()}

      {/* Tax Calculation */}
      {renderTaxCalculation()}

      {/* Validation Results */}
      {renderValidationResults()}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={() => navigate('/smart-tax-filing/review')}
        >
          Back to Review
        </Button>

        <Box>
          <Button
            variant="outlined"
            startIcon={<Email />}
            onClick={() => setShowEmailDialog(true)}
            sx={{ mr: 2 }}
          >
            Email PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ mr: 2 }}
          >
            Print
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Download />}
            onClick={handleGeneratePDF}
            disabled={generating || !validationResults?.is_valid}
          >
            {generating ? 'Generating...' : 'Generate Official PDF'}
          </Button>
        </Box>
      </Box>

      {/* Email Dialog */}
      <Dialog
        open={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Email Tax Declaration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Enter the email address where you want to receive the PDF:
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            type="email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
          <Button onClick={handleEmailPDF} variant="contained" color="primary">
            Send PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartSummary;