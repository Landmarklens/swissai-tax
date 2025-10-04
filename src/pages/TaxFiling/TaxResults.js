import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore,
  Print,
  Download,
  Send,
  CheckCircle,
  ArrowBack,
  TrendingDown,
  TrendingUp,
  Info
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { calculateTax } from '../../store/slices/taxFilingSlice';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TaxResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Get calculation from location state (passed from document checklist)
  const { session_id, calculation: passedCalculation } = location.state || {};

  const { session, calculation } = useSelector((state) => state.taxFiling || {});
  const [loading, setLoading] = useState(!passedCalculation);
  const [expanded, setExpanded] = useState('income');
  const [calculationData, setCalculationData] = useState(passedCalculation || null);

  useEffect(() => {
    if (passedCalculation) {
      // Use passed calculation data
      setCalculationData(passedCalculation);
      setLoading(false);
    } else if (session_id && !calculationData) {
      loadCalculation();
    } else if (calculation?.result) {
      setCalculationData(calculation.result);
      setLoading(false);
    }
  }, [session_id, passedCalculation, calculation]);

  const loadCalculation = async () => {
    try {
      setLoading(true);
      if (dispatch && calculateTax) {
        await dispatch(calculateTax(session_id || session?.id)).unwrap();
      }
    } catch (error) {
      console.error('Failed to calculate tax:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const result = calculationData || {
    tax_year: 2024,
    canton: 'ZH',
    municipality: 'Zurich',
    income: {
      employment: 100000,
      self_employment: 0,
      capital: 5000,
      rental: 0,
      total_income: 105000
    },
    deductions: {
      professional_expenses: 3000,
      pillar_3a: 7056,
      insurance_premiums: 1750,
      child_deduction: 0,
      medical_expenses: 0,
      total_deductions: 11806
    },
    taxable_income: 93194,
    federal_tax: 8234,
    cantonal_tax: 7455,
    municipal_tax: 8870,
    church_tax: 0,
    total_tax: 24559,
    effective_rate: 23.4,
    monthly_tax: 2047
  };

  // Prepare chart data
  const taxBreakdownData = [
    { name: 'Federal Tax', value: result.federal_tax, color: '#2196F3' },
    { name: 'Cantonal Tax', value: result.cantonal_tax, color: '#4CAF50' },
    { name: 'Municipal Tax', value: result.municipal_tax, color: '#FF9800' },
    { name: 'Church Tax', value: result.church_tax, color: '#9C27B0' }
  ].filter(item => item.value > 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Your Tax Calculation Results
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Tax Due
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(result.total_tax)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Monthly: {formatCurrency(result.monthly_tax)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Taxable Income
              </Typography>
              <Typography variant="h5">
                {formatCurrency(result.taxable_income)}
              </Typography>
              <Chip
                size="small"
                label={`After ${formatCurrency(result.deductions.total_deductions)} deductions`}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Effective Rate
              </Typography>
              <Typography variant="h5">
                {result.effective_rate.toFixed(1)}%
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {result.effective_rate < 25 ? (
                  <TrendingDown color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingUp color="error" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="body2" color={result.effective_rate < 25 ? 'success.main' : 'error.main'}>
                  {result.effective_rate < 25 ? 'Below average' : 'Above average'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Typography variant="h6">
                {result.canton}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.municipality}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tax Breakdown Chart and Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tax Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taxBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Breakdown
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tax Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Federal Tax</TableCell>
                    <TableCell align="right">{formatCurrency(result.federal_tax)}</TableCell>
                    <TableCell align="right">
                      {((result.federal_tax / result.total_tax) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cantonal Tax</TableCell>
                    <TableCell align="right">{formatCurrency(result.cantonal_tax)}</TableCell>
                    <TableCell align="right">
                      {((result.cantonal_tax / result.total_tax) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Municipal Tax</TableCell>
                    <TableCell align="right">{formatCurrency(result.municipal_tax)}</TableCell>
                    <TableCell align="right">
                      {((result.municipal_tax / result.total_tax) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  {result.church_tax > 0 && (
                    <TableRow>
                      <TableCell>Church Tax</TableCell>
                      <TableCell align="right">{formatCurrency(result.church_tax)}</TableCell>
                      <TableCell align="right">
                        {((result.church_tax / result.total_tax) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(result.total_tax)}</strong></TableCell>
                    <TableCell align="right"><strong>100.0%</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Income and Deductions Details */}
      <Box sx={{ mt: 3 }}>
        <Accordion expanded={expanded === 'income'} onChange={handleAccordionChange('income')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Income Details</Typography>
            <Chip
              label={formatCurrency(result.income.total_income)}
              size="small"
              sx={{ ml: 2 }}
            />
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {Object.entries(result.income).map(([key, value]) => {
                if (key === 'total_income' || value === 0) return null;
                return (
                  <ListItem key={key}>
                    <ListItemText
                      primary={key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                      secondary="Income source"
                    />
                    <Typography variant="h6">{formatCurrency(value)}</Typography>
                  </ListItem>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'deductions'} onChange={handleAccordionChange('deductions')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Deduction Details</Typography>
            <Chip
              label={formatCurrency(result.deductions.total_deductions)}
              size="small"
              color="success"
              sx={{ ml: 2 }}
            />
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {Object.entries(result.deductions).map(([key, value]) => {
                if (key === 'total_deductions' || value === 0) return null;
                return (
                  <ListItem key={key}>
                    <ListItemText
                      primary={key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                      secondary="Tax deduction"
                    />
                    <Typography variant="h6" color="success.main">
                      -{formatCurrency(value)}
                    </Typography>
                  </ListItem>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Optimization Tips */}
      <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Tax Optimization Tips
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Consider maximizing your Pillar 3a contributions (CHF 7,056 for 2024)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Keep all receipts for professional training and development expenses" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Review your insurance premiums to ensure you're claiming all eligible deductions" />
          </ListItem>
        </List>
      </Alert>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tax-filing/documents')}
        >
          Back to Documents
        </Button>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
          >
            Print Summary
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            color="success"
            onClick={() => navigate('/tax-filing/submit')}
          >
            Submit Tax Filing
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TaxResults;