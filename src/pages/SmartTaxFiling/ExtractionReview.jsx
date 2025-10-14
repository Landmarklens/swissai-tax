import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  Chip,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider
} from '@mui/material';
import {
  Edit,
  Check,
  Warning,
  Error as ErrorIcon,
  Info,
  AutoAwesome,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  AttachMoney,
  Home,
  AccountBalance,
  LocalHospital,
  School,
  Business,
  Receipt,
  Visibility,
  VerifiedUser,
  ReportProblem,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';

// Field categories for organization
const fieldCategories = [
  {
    key: 'personal',
    title: 'Personal Information',
    icon: <VerifiedUser />,
    fields: ['first_name', 'last_name', 'birth_date', 'ahv_number', 'civil_status', 'nationality']
  },
  {
    key: 'address',
    title: 'Address',
    icon: <Home />,
    fields: ['street', 'house_number', 'postal_code', 'city', 'canton', 'municipality']
  },
  {
    key: 'employment',
    title: 'Employment & Income',
    icon: <AttachMoney />,
    fields: ['gross_salary', 'net_salary', 'employer_name', 'employer_address', 'social_deductions']
  },
  {
    key: 'banking',
    title: 'Banking & Investments',
    icon: <AccountBalance />,
    fields: ['bank_accounts', 'interest_income', 'dividend_income', 'capital_gains', 'crypto_assets']
  },
  {
    key: 'deductions',
    title: 'Deductions',
    icon: <Receipt />,
    fields: ['health_insurance', 'pillar_3a', 'donations', 'professional_expenses', 'education_costs']
  },
  {
    key: 'property',
    title: 'Property',
    icon: <Home />,
    fields: ['property_value', 'mortgage_interest', 'maintenance_costs', 'rental_income']
  }
];

const ExtractionReview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [extractedData, setExtractedData] = useState({});
  const [confidenceScores, setConfidenceScores] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);

  useEffect(() => {
    fetchExtractionData();
  }, []);

  const fetchExtractionData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/ai/extraction/latest');

      setExtractedData(response.data.extracted_data || {});
      setConfidenceScores(response.data.confidence_scores || {});
      setConflicts(response.data.conflicts || []);

      // Auto-expand categories with data
      const expanded = {};
      fieldCategories.forEach(cat => {
        const hasData = cat.fields.some(field => extractedData[field]);
        if (hasData) expanded[cat.key] = true;
      });
      setExpandedCategories(expanded);
    } catch (error) {
      console.error('Failed to fetch extraction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fieldName) => {
    setEditingField(fieldName);
    setEditValue(extractedData[fieldName] || '');
  };

  const handleSave = async (fieldName) => {
    try {
      setSaving(true);

      // Update local state
      setExtractedData(prev => ({
        ...prev,
        [fieldName]: editValue
      }));

      // Update on server
      await api.patch(`/api/v1/ai/extraction/fields/${fieldName}`, {
        value: editValue,
        confidence: 1.0 // User override has full confidence
      });

      setConfidenceScores(prev => ({
        ...prev,
        [fieldName]: 1.0
      }));

      setEditingField(null);
    } catch (error) {
      console.error('Failed to save field:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (score) => {
    if (score >= 0.9) return <CheckCircle color="success" />;
    if (score >= 0.7) return <Warning color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const handleResolveConflict = async (conflictId, resolvedValue) => {
    try {
      await api.post(`/api/v1/ai/conflicts/${conflictId}/resolve`, {
        resolved_value: resolvedValue
      });

      // Remove resolved conflict
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setShowConflictDialog(false);
      setSelectedConflict(null);

      // Refresh data
      await fetchExtractionData();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const validateAndContinue = async () => {
    const errors = {};

    // Check required fields
    const requiredFields = ['first_name', 'last_name', 'birth_date', 'ahv_number', 'gross_salary'];
    requiredFields.forEach(field => {
      if (!extractedData[field]) {
        errors[field] = 'This field is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Save current state
    try {
      await api.post('/api/v1/ai/extraction/validate', {
        extracted_data: extractedData
      });

      navigate('/smart-tax-filing/summary');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const renderFieldRow = (fieldName, fieldLabel) => {
    const value = extractedData[fieldName];
    const confidence = confidenceScores[fieldName] || 0;
    const hasError = validationErrors[fieldName];
    const isEditing = editingField === fieldName;

    return (
      <TableRow key={fieldName} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell>
          <Box display="flex" alignItems="center">
            {fieldLabel}
            {hasError && (
              <Tooltip title={validationErrors[fieldName]}>
                <ErrorIcon color="error" sx={{ ml: 1, fontSize: 16 }} />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              size="small"
              fullWidth
              autoFocus
              error={hasError}
              helperText={hasError ? validationErrors[fieldName] : ''}
            />
          ) : (
            <Typography variant="body2">
              {value ? String(value).replace(/[<>]/g, '') : <span style={{ color: 'text.disabled' }}>Not extracted</span>}
            </Typography>
          )}
        </TableCell>
        <TableCell align="center">
          <Box display="flex" alignItems="center" justifyContent="center">
            {getConfidenceIcon(confidence)}
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {Math.round(confidence * 100)}%
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          {isEditing ? (
            <>
              <IconButton size="small" onClick={() => handleSave(fieldName)} disabled={saving}>
                <Check />
              </IconButton>
              <IconButton size="small" onClick={handleCancel}>
                <ErrorIcon />
              </IconButton>
            </>
          ) : (
            <IconButton size="small" onClick={() => handleEdit(fieldName)}>
              <Edit />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    );
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
        Review Extracted Information
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and edit the information extracted from your documents. Click on any field to make corrections.
      </Typography>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowConflictDialog(true)}>
              Resolve ({conflicts.length})
            </Button>
          }
        >
          We found {conflicts.length} conflicting values in your documents that need resolution
        </Alert>
      )}

      {/* Category Cards */}
      <Grid container spacing={3}>
        {fieldCategories.map((category) => {
          const categoryFields = category.fields.filter(field =>
            extractedData[field] !== undefined || validationErrors[field]
          );

          if (categoryFields.length === 0) return null;

          return (
            <Grid item xs={12} key={category.key}>
              <Card elevation={2}>
                <CardContent>
                  {/* Category Header */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleCategory(category.key)}
                  >
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}
                      >
                        {category.icon}
                      </Box>
                      <Typography variant="h6">{category.title}</Typography>
                      <Chip
                        label={`${categoryFields.length} fields`}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <IconButton>
                      {expandedCategories[category.key] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Category Fields */}
                  <Collapse in={expandedCategories[category.key]}>
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Field</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell align="center">Confidence</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryFields.map(field =>
                            renderFieldRow(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={() => navigate('/smart-tax-filing/documents')}
        >
          Back to Documents
        </Button>

        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => fetchExtractionData()}
          >
            Re-extract
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={validateAndContinue}
            disabled={saving}
          >
            Continue to Summary
          </Button>
        </Box>
      </Box>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Resolve Conflicts</DialogTitle>
        <DialogContent>
          <List>
            {conflicts.map((conflict) => (
              <ListItem key={conflict.id}>
                <ListItemText
                  primary={conflict.field_name}
                  secondary={
                    <Box>
                      {conflict.values.map((val, idx) => (
                        <Chip
                          key={idx}
                          label={`${val.value} (${val.source})`}
                          onClick={() => handleResolveConflict(conflict.id, val.value)}
                          sx={{ mr: 1, mt: 0.5 }}
                        />
                      ))}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConflictDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExtractionReview;