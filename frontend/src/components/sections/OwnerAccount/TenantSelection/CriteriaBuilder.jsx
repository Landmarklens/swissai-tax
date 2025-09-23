import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Switch,
  Checkbox,
  TextField,
  Button,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Save as SaveIcon,
  SaveAlt as SaveTemplateIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { updateCriteria, saveCriteriaTemplate } from '../../../../store/slices/tenantSelectionSlice';

const REQUIRED_DOCUMENTS = [
  { id: 'salary_slip', label: 'Salary Slips (3 months)', required: true },
  { id: 'employment_contract', label: 'Employment Contract', required: true },
  { id: 'betreibungsregister', label: 'Betreibungsregisterauszug', required: true },
  { id: 'reference_letter', label: 'Reference Letter', required: false },
  { id: 'bank_statement', label: 'Bank Statements', required: false },
  { id: 'id_document', label: 'ID/Passport Copy', required: true },
  { id: 'liability_insurance', label: 'Liability Insurance', required: false }
];

const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'Permanent Employment' },
  { value: 'temporary', label: 'Temporary Employment' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' }
];

const CriteriaBuilder = ({ propertyId, onSave, onNext }) => {
  const dispatch = useDispatch();
  const { criteria: savedCriteria } = useSelector((state) => state.tenantSelection);
  
  const [criteria, setCriteria] = useState({
    // Basic Requirements
    pets_allowed: 'no',
    smoking_allowed: 'no',
    
    // Financial Requirements
    min_income_ratio: 3,
    require_guarantor: false,
    max_debt_ratio: 30,
    min_savings_months: 3,
    
    // Household Composition
    max_occupants: 4,
    children_allowed: true,
    couples_only: false,
    singles_only: false,
    
    // Employment
    employment_types: ['permanent', 'self_employed'],
    min_employment_duration: 6, // months
    probation_period_ok: false,
    
    // Documents
    required_documents: REQUIRED_DOCUMENTS.filter(d => d.required).map(d => d.id),
    
    // Move-in
    earliest_move_in: null,
    latest_move_in: null,
    flexible_move_in: true,
    
    // Additional
    min_rental_history: 0, // years
    no_subletting: true,
    quiet_hours_agreement: true,
    
    // Custom criteria
    custom_criteria: []
  });

  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [customCriterion, setCustomCriterion] = useState('');

  useEffect(() => {
    if (savedCriteria) {
      setCriteria({ ...criteria, ...savedCriteria });
    }
  }, [savedCriteria]);

  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentToggle = (docId) => {
    setCriteria(prev => ({
      ...prev,
      required_documents: prev.required_documents.includes(docId)
        ? prev.required_documents.filter(id => id !== docId)
        : [...prev.required_documents, docId]
    }));
  };

  const handleEmploymentTypeToggle = (type) => {
    setCriteria(prev => ({
      ...prev,
      employment_types: prev.employment_types.includes(type)
        ? prev.employment_types.filter(t => t !== type)
        : [...prev.employment_types, type]
    }));
  };

  const addCustomCriterion = () => {
    if (customCriterion.trim()) {
      setCriteria(prev => ({
        ...prev,
        custom_criteria: [...prev.custom_criteria, customCriterion.trim()]
      }));
      setCustomCriterion('');
    }
  };

  const removeCustomCriterion = (index) => {
    setCriteria(prev => ({
      ...prev,
      custom_criteria: prev.custom_criteria.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    await dispatch(updateCriteria({ propertyId, criteria }));
    if (onSave) {
      onSave(criteria);
    }
    if (onNext) {
      onNext();
    }
  };

  const handleSaveTemplate = async () => {
    if (templateName.trim()) {
      await dispatch(saveCriteriaTemplate({ 
        name: templateName, 
        criteria 
      }));
      setShowSaveTemplate(false);
      setTemplateName('');
    }
  };

  const incomeRatioMarks = [
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
    { value: 4, label: '4x' },
    { value: 5, label: '5x' }
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tenant Selection Criteria
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Define your requirements for tenant selection. These criteria will be automatically applied 
          when processing applications through our GPT-5 powered system.
        </Typography>
      </Paper>

      {/* Basic Requirements */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeIcon />
            <Typography>Basic Requirements</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PetsIcon />
                    Pets Policy
                  </Box>
                </FormLabel>
                <RadioGroup
                  value={criteria.pets_allowed}
                  onChange={(e) => handleCriteriaChange('pets_allowed', e.target.value)}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Pets allowed" />
                  <FormControlLabel value="negotiable" control={<Radio />} label="Negotiable" />
                  <FormControlLabel value="no" control={<Radio />} label="No pets" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmokeIcon />
                    Smoking Policy
                  </Box>
                </FormLabel>
                <RadioGroup
                  value={criteria.smoking_allowed}
                  onChange={(e) => handleCriteriaChange('smoking_allowed', e.target.value)}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Smoking allowed" />
                  <FormControlLabel value="balcony" control={<Radio />} label="Balcony only" />
                  <FormControlLabel value="no" control={<Radio />} label="Non-smoking" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Financial Requirements */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon />
            <Typography>Financial Requirements</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Minimum Income Ratio
                <Tooltip title="Gross monthly income must be at least this multiple of the rent">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={criteria.min_income_ratio}
                onChange={(e, value) => handleCriteriaChange('min_income_ratio', value)}
                min={2}
                max={5}
                step={0.5}
                marks={incomeRatioMarks}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}x rent`}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Debt Ratio (%)"
                value={criteria.max_debt_ratio}
                onChange={(e) => handleCriteriaChange('max_debt_ratio', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Savings (months of rent)"
                value={criteria.min_savings_months}
                onChange={(e) => handleCriteriaChange('min_savings_months', parseInt(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={criteria.require_guarantor}
                    onChange={(e) => handleCriteriaChange('require_guarantor', e.target.checked)}
                  />
                }
                label="Require guarantor for borderline cases"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Employment Requirements */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon />
            <Typography>Employment Requirements</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography gutterBottom>Acceptable Employment Types</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {EMPLOYMENT_TYPES.map((type) => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    onClick={() => handleEmploymentTypeToggle(type.value)}
                    color={criteria.employment_types.includes(type.value) ? 'primary' : 'default'}
                    variant={criteria.employment_types.includes(type.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Employment Duration (months)"
                value={criteria.min_employment_duration}
                onChange={(e) => handleCriteriaChange('min_employment_duration', parseInt(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={criteria.probation_period_ok}
                    onChange={(e) => handleCriteriaChange('probation_period_ok', e.target.checked)}
                  />
                }
                label="Accept during probation period"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Required Documents */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocumentIcon />
            <Typography>Required Documents</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Documents will be automatically processed and verified using GPT-5 AI
          </Alert>
          <List>
            {REQUIRED_DOCUMENTS.map((doc) => (
              <ListItem key={doc.id} dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={criteria.required_documents.includes(doc.id)}
                    onChange={() => handleDocumentToggle(doc.id)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={doc.label}
                  secondary={doc.required ? 'Mandatory' : 'Optional'}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Household Composition */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            <Typography>Household Composition</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Occupants"
                value={criteria.max_occupants}
                onChange={(e) => handleCriteriaChange('max_occupants', parseInt(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={criteria.children_allowed}
                    onChange={(e) => handleCriteriaChange('children_allowed', e.target.checked)}
                  />
                }
                label="Children allowed"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Criteria */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Custom Criteria</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Add custom requirement"
                  value={customCriterion}
                  onChange={(e) => setCustomCriterion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomCriterion()}
                />
                <Button
                  variant="contained"
                  onClick={addCustomCriterion}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {criteria.custom_criteria.map((criterion, index) => (
                  <Chip
                    key={index}
                    label={criterion}
                    onDelete={() => removeCustomCriterion(index)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setShowSaveTemplate(true)}
            startIcon={<SaveTemplateIcon />}
          >
            Save as Template
          </Button>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            startIcon={<SaveIcon />}
          >
            Save Criteria
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CriteriaBuilder;