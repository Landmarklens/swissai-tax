import React, { useState, useEffect } from 'react';
import { tenantSelectionApi } from '../../../../api/tenantSelectionApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Switch,
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  TextareaAutosize,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Psychology as AIIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const EnhancedCriteriaBuilder = ({ propertyId, initialCriteria, onSave, onBack }) => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const [criteria, setCriteria] = useState({
    // Hard Criteria
    pets_allowed: initialCriteria?.pets_allowed || 'no',
    smoking_allowed: initialCriteria?.smoking_allowed || 'no',
    min_income_ratio: initialCriteria?.min_income_ratio || 3.0,
    max_household_size: initialCriteria?.max_household_size || 4,
    
    // Soft Criteria (Scoring Weights)
    income_weight: initialCriteria?.income_weight || 40,
    employment_weight: initialCriteria?.employment_weight || 30,
    references_weight: initialCriteria?.references_weight || 20,
    profile_weight: initialCriteria?.profile_weight || 10,
    
    // AI Instructions
    ai_tone: initialCriteria?.ai_tone || 'professional',
    ai_response_style: initialCriteria?.ai_response_style || 'detailed',
    auto_reply_enabled: initialCriteria?.auto_reply_enabled !== false,
    custom_instructions: initialCriteria?.custom_instructions || '',
    
    // Auto-responses
    pet_response: initialCriteria?.pet_response || '',
    smoking_response: initialCriteria?.smoking_response || '',
    viewing_instructions: initialCriteria?.viewing_instructions || '',
    document_requirements: initialCriteria?.document_requirements || 
      'Please provide: Salary slip (last 3 months), Employment contract, ID/Passport, Betreibungsregister extract',
    
    // Additional preferences
    preferred_move_in: initialCriteria?.preferred_move_in || 'flexible',
    lease_duration_preference: initialCriteria?.lease_duration_preference || 'minimum_1_year',
    deposit_amount: initialCriteria?.deposit_amount || 3
  });

  const [expanded, setExpanded] = useState('hard-criteria');

  // Load existing AI configuration
  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await tenantSelectionApi.getConfig(propertyId);
        const config = response.data;
        
        if (config) {
          // Map backend data to form fields
          setCriteria(prev => ({
            ...prev,
            // AI Instructions
            custom_instructions: config.ai_instructions || '',
            
            // Extract from knowledge base
            pet_response: config.ai_knowledge_base?.pet_policy || '',
            smoking_response: config.ai_knowledge_base?.smoking_policy || '',
            viewing_instructions: config.ai_knowledge_base?.viewing_instructions || '',
            document_requirements: config.ai_knowledge_base?.document_requirements || 
              'Please provide: Salary slip (last 3 months), Employment contract, ID/Passport, Betreibungsregister extract',
            parking_info: config.ai_knowledge_base?.parking_info || '',
            
            // Extract from response settings
            ai_tone: config.ai_response_settings?.tone || 'professional',
            ai_response_style: config.ai_response_settings?.response_style || 'detailed',
            auto_reply_enabled: config.ai_response_settings?.auto_reply_enabled !== false,
            
            // Keep existing hard/soft criteria
            pets_allowed: config.hard_criteria?.no_pets === false ? 'yes' : 'no',
            smoking_allowed: config.hard_criteria?.no_smoking === false ? 'yes' : 'no',
            min_income_ratio: config.hard_criteria?.min_income || 3.0,
            max_household_size: config.hard_criteria?.max_occupants || 4,
            
            // Scoring weights
            income_weight: config.soft_criteria?.income_weight || 40,
            employment_weight: config.soft_criteria?.employment_weight || 30,
            references_weight: config.soft_criteria?.references_weight || 20,
            profile_weight: config.soft_criteria?.profile_weight || 10,
          }));
        }
      } catch (err) {
        console.error('Failed to load configuration:', err);
        setError('Failed to load existing configuration. You can still create new settings.');
      } finally {
        setLoading(false);
      }
    };
    
    if (propertyId) {
      loadExistingConfig();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const validateWeights = () => {
    const total = criteria.income_weight + 
                  criteria.employment_weight + 
                  criteria.references_weight + 
                  criteria.profile_weight;
    return total === 100;
  };

  const handleSubmit = async () => {
    if (!validateWeights()) {
      setValidationErrors({ weights: 'Scoring weights must total 100%' });
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Save AI instructions via API
      const aiData = {
        ai_instructions: criteria.custom_instructions,
        ai_knowledge_base: {
          pet_policy: criteria.pet_response,
          parking_info: criteria.parking_info,
          viewing_instructions: criteria.viewing_instructions,
          document_requirements: criteria.document_requirements
        },
        response_templates: {
          viewing_request: {
            subject: "Viewing Request - Property " + propertyId,
            body: "Thank you for your interest..."
          },
          general_inquiry: {
            subject: "Re: Your Inquiry",
            body: "Thank you for your inquiry..."
          }
        },
        ai_response_settings: {
          tone: criteria.ai_tone,
          response_style: criteria.ai_response_style,
          auto_reply_enabled: criteria.auto_reply_enabled
        }
      };
      
      await tenantSelectionApi.updateAIInstructions(propertyId, aiData);
      setHasChanges(false);
      
      // Call the parent's onSave with full criteria
      onSave(criteria);
    } catch (error) {
      console.error('Failed to save AI instructions:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.detail?.errors) {
        const backendErrors = {};
        error.response.data.detail.errors.forEach(err => {
          const field = err.split(':')[0].toLowerCase().replace(' ', '_');
          backendErrors[field] = err;
        });
        setValidationErrors(backendErrors);
        setError('Please fix the validation errors below.');
      } else {
        setError('Failed to save AI instructions. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const aiToneExamples = {
    professional: "Thank you for your interest in the property at Bahnhofstrasse 123. I will review your application and respond within 24 hours.",
    friendly: "Hi there! Thanks so much for reaching out about our lovely apartment on Bahnhofstrasse! I'd be happy to help you with any questions.",
    formal: "Dear Applicant, We acknowledge receipt of your inquiry regarding the property listing. Your application will be processed according to our standard procedures.",
    casual: "Hey! Got your message about the apartment. Let me know if you have any questions - happy to chat!"
  };

  // Show loading skeleton
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Define Tenant Selection Criteria
        </Typography>
        <Box sx={{ mt: 3 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ width: 40, height: 40, bgcolor: 'grey.300', borderRadius: 1, mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ width: '30%', height: 20, bgcolor: 'grey.300', borderRadius: 1, mb: 1 }} />
                    <Box sx={{ width: '70%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Define Tenant Selection Criteria
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Set your requirements and configure how the AI will interact with applicants
      </Typography>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. Click "Save Configuration" to apply them.
        </Alert>
      )}

      {/* Hard Criteria */}
      <Accordion 
        expanded={expanded === 'hard-criteria'} 
        onChange={handleAccordionChange('hard-criteria')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Hard Criteria (Required)</Typography>
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
                  <FormControlLabel value="negotiable" control={<Radio />} label="Case by case" />
                  <FormControlLabel value="no" control={<Radio />} label="No pets" />
                </RadioGroup>
                {criteria.pets_allowed !== 'yes' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Custom pet response"
                    value={criteria.pet_response}
                    onChange={(e) => handleCriteriaChange('pet_response', e.target.value)}
                    placeholder="e.g., Small pets may be considered with additional deposit"
                    sx={{ mt: 2 }}
                  />
                )}
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
                {criteria.smoking_allowed === 'no' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Custom smoking response"
                    value={criteria.smoking_response}
                    onChange={(e) => handleCriteriaChange('smoking_response', e.target.value)}
                    placeholder="e.g., This is a strictly non-smoking property"
                    sx={{ mt: 2 }}
                  />
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography gutterBottom>
                  <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Minimum Income Ratio
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tenant's income should be at least {criteria.min_income_ratio}x the rent
                </Typography>
                <Slider
                  value={criteria.min_income_ratio}
                  onChange={(e, value) => handleCriteriaChange('min_income_ratio', value)}
                  min={2}
                  max={5}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography gutterBottom>
                  <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Maximum Household Size
                </Typography>
                <Slider
                  value={criteria.max_household_size}
                  onChange={(e, value) => handleCriteriaChange('max_household_size', value)}
                  min={1}
                  max={8}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* AI Configuration */}
      <Accordion 
        expanded={expanded === 'ai-config'} 
        onChange={handleAccordionChange('ai-config')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">AI Assistant Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" icon={<AIIcon />}>
                Configure how the AI assistant will interact with potential tenants
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>AI Tone</InputLabel>
                <Select
                  value={criteria.ai_tone}
                  onChange={(e) => handleCriteriaChange('ai_tone', e.target.value)}
                  label="AI Tone"
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="friendly">Friendly</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                </Select>
              </FormControl>
              
              {criteria.ai_tone && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary">
                    Example response:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    "{aiToneExamples[criteria.ai_tone]}"
                  </Typography>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Response Style</InputLabel>
                <Select
                  value={criteria.ai_response_style}
                  onChange={(e) => handleCriteriaChange('ai_response_style', e.target.value)}
                  label="Response Style"
                >
                  <MenuItem value="brief">Brief and to the point</MenuItem>
                  <MenuItem value="detailed">Detailed and informative</MenuItem>
                  <MenuItem value="conversational">Conversational</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={criteria.auto_reply_enabled}
                    onChange={(e) => handleCriteriaChange('auto_reply_enabled', e.target.checked)}
                  />
                }
                label="Enable automatic replies"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Custom AI Instructions"
                value={criteria.custom_instructions}
                onChange={(e) => handleCriteriaChange('custom_instructions', e.target.value)}
                placeholder="Add any specific instructions for the AI assistant. For example: 'Always mention the nearby public transport options' or 'Emphasize the quiet neighborhood'"
                helperText={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>These instructions will guide the AI's responses to tenant inquiries</span>
                    <span style={{ 
                      color: criteria.custom_instructions.length > 4500 ? 'error.main' : 
                             criteria.custom_instructions.length > 4000 ? 'warning.main' : 'text.secondary' 
                    }}>
                      {criteria.custom_instructions.length}/5000
                    </span>
                  </Box>
                }
                error={!!validationErrors.custom_instructions || criteria.custom_instructions.length > 5000}
                inputProps={{ maxLength: 5000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Viewing Instructions"
                value={criteria.viewing_instructions}
                onChange={(e) => handleCriteriaChange('viewing_instructions', e.target.value)}
                placeholder="e.g., Viewings are by appointment only. Please arrive 5 minutes early and ring the bell for Apartment 3B."
                helperText={`${criteria.viewing_instructions.length}/2000`}
                error={criteria.viewing_instructions.length > 2000}
                inputProps={{ maxLength: 2000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Document Requirements"
                value={criteria.document_requirements}
                onChange={(e) => handleCriteriaChange('document_requirements', e.target.value)}
                helperText="List the documents tenants must provide"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Scoring Weights */}
      <Accordion 
        expanded={expanded === 'scoring'} 
        onChange={handleAccordionChange('scoring')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Applicant Scoring Weights</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity={validateWeights() ? 'success' : 'warning'}>
                Total weight: {criteria.income_weight + criteria.employment_weight + 
                             criteria.references_weight + criteria.profile_weight}% 
                {validateWeights() ? ' ✓' : ' (must equal 100%)'}
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Income Stability ({criteria.income_weight}%)</Typography>
              <Slider
                value={criteria.income_weight}
                onChange={(e, value) => handleCriteriaChange('income_weight', value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Employment Status ({criteria.employment_weight}%)</Typography>
              <Slider
                value={criteria.employment_weight}
                onChange={(e, value) => handleCriteriaChange('employment_weight', value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>References ({criteria.references_weight}%)</Typography>
              <Slider
                value={criteria.references_weight}
                onChange={(e, value) => handleCriteriaChange('references_weight', value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Profile Completeness ({criteria.profile_weight}%)</Typography>
              <Slider
                value={criteria.profile_weight}
                onChange={(e, value) => handleCriteriaChange('profile_weight', value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={onBack}
          disabled={saving}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={saving || (!hasChanges && !loading)}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>
    </Box>
  );
};

export default EnhancedCriteriaBuilder;