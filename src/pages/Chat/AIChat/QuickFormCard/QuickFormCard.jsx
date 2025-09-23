import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  LinearProgress,
  Alert,
  Collapse,
  Divider,
  Paper,
  InputAdornment,
  Tooltip,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Pets as PetsIcon,
  ChildCare as ChildrenIcon,
  Timer as TimerIcon,
  DirectionsCar as CarIcon,
  WifiOutlined,
  FitnessCenter as GymIcon,
  Pool as PoolIcon,
  Balcony as BalconyIcon,
  LocalLaundryService as LaundryIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocationAutocomplete } from '../MultiFilterPanel/ui/LocationAutocomplete/LocationAutocomplete';
import {
  createInsights,
  createNewConversationProfileThunk
} from '../../../../store/slices/conversationsSlice';

// Predefined amenity options with icons - all start with a priority
const AMENITY_OPTIONS = [
  { id: 'parking', label: 'Parking', icon: CarIcon, defaultPriority: 'important' },
  { id: 'gym', label: 'Gym', icon: GymIcon, defaultPriority: 'nice-to-have' },
  { id: 'pool', label: 'Swimming Pool', icon: PoolIcon, defaultPriority: 'nice-to-have' },
  { id: 'balcony', label: 'Balcony/Terrace', icon: BalconyIcon, defaultPriority: 'important' },
  { id: 'laundry', label: 'In-unit Laundry', icon: LaundryIcon, defaultPriority: 'important' },
  { id: 'internet', label: 'High-speed Internet', icon: WifiOutlined, defaultPriority: 'must-have' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: PetsIcon, defaultPriority: 'must-have' },
  { id: 'furnished', label: 'Furnished', icon: HomeIcon, defaultPriority: 'nice-to-have' },
  { id: 'elevator', label: 'Elevator', icon: HomeIcon, defaultPriority: 'nice-to-have' },
  { id: 'storage', label: 'Storage Room', icon: HomeIcon, defaultPriority: 'nice-to-have' },
  { id: 'dishwasher', label: 'Dishwasher', icon: HomeIcon, defaultPriority: 'nice-to-have' },
  { id: 'quiet', label: 'Quiet Area', icon: HomeIcon, defaultPriority: 'important' }
];

const PRIORITY_COLORS = {
  'must-have': 'error',
  'important': 'warning',
  'nice-to-have': 'info'
};

// Priority values matching BE InsightPriority enum
const PRIORITY_VALUES = {
  'must-have': 'MUST',
  'important': 'IMPORTANT',
  'nice-to-have': 'NICE-TO-HAVE'
};

// Validation functions
const validateIncome = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d.-]/g, '');
  if (!numericValue) return 'Income must contain a numeric value';
  const number = parseFloat(numericValue);
  if (isNaN(number)) return 'Income must be a valid number';
  if (number <= 0) return 'Income must be a positive number';
  return '';
};

const validateCommuteTime = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d.-]/g, '');
  if (!numericValue) return 'Commute time must contain a numeric value';
  const number = parseFloat(numericValue);
  if (isNaN(number)) return 'Commute time must be a valid number';
  if (number < 0) return 'Commute time cannot be negative';
  if (number > 180) return 'Commute time seems unreasonably high (max 180 minutes)';
  return '';
};

const validateMoveInDate = (date) => {
  if (!date) return '';
  const today = dayjs().startOf('day');
  const selectedDate = dayjs(date).startOf('day');
  if (!selectedDate.isValid()) return 'Please select a valid date';
  if (selectedDate.isBefore(today)) return 'Move-in date must be in the future';
  return '';
};

export const QuickFormCard = ({ onSubmit, isSubmitting, onInsightsChange }) => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Information
    moveInDate: null,
    budget: '',
    location: '',
    propertyType: '', // No default - user must select
    propertyTypeChanged: false, // Track if user explicitly changed property type
    rooms: '',
    dealType: 'rent',

    // Personal Information
    workLocation: '',
    workFromHome: false,
    maxCommuteTime: '',
    monthlyIncome: '',
    householdSize: 1,
    hasPets: false,
    hasChildren: false,

    // Preferences
    amenities: [],

    // Additional Requirements
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [completionProgress, setCompletionProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    personal: false,
    preferences: false,
    additional: false
  });
  const [showContinueModal, setShowContinueModal] = useState(false);

  // Get Redux state
  const insights = useSelector((state) => state.conversations.activeConversationProfile?.insights);
  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);
  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);

  // Calculate completion progress
  useEffect(() => {
    const requiredFields = ['moveInDate', 'budget', 'location'];
    const optionalFields = ['propertyType', 'rooms', 'monthlyIncome', 'workLocation', 'maxCommuteTime'];

    let completedRequired = requiredFields.filter(field => formData[field]).length;
    let completedOptional = optionalFields.filter(field => formData[field]).length;
    let amenitiesScore = formData.amenities.length > 0 ? 1 : 0;

    const progress = Math.round(
      ((completedRequired / requiredFields.length) * 60) +
      ((completedOptional / optionalFields.length) * 30) +
      (amenitiesScore * 10)
    );

    setCompletionProgress(Math.min(progress, 100));
  }, [formData]);

  // Parse insights to populate form
  useEffect(() => {
    if (insights && Array.isArray(insights) && insights.length > 0) {
      const parsedData = { ...formData };

      insights.forEach((insight) => {
        const text = insight.text || '';
        const step = insight.step || '';

        // Parse location
        if (text.includes('want to live in')) {
          const match = text.match(/want to live in\s+(.+?)\.?$/i);
          if (match) parsedData.location = match[1];
        }

        // Parse commute time
        if (text.includes('commute time is')) {
          const match = text.match(/commute time is\s+(.+?)\.?$/i);
          if (match) parsedData.maxCommuteTime = match[1].replace(/[^\d]/g, '');
        }

        // Parse income
        if (text.includes('income is')) {
          const match = text.match(/income is\s+(.+?)\.?$/i);
          if (match) parsedData.monthlyIncome = match[1].replace(/[^\d]/g, '');
        }

        // Parse move-in date
        if (text.includes('move-in date is')) {
          const match = text.match(/move-in date is\s+(.+?)\.?$/i);
          if (match) {
            try {
              parsedData.moveInDate = dayjs(match[1]);
            } catch (e) {
              console.warn('Could not parse move-in date:', match[1]);
            }
          }
        }

        // Parse amenities
        if (step === 'Lifestyle and Amenities') {
          if (text.includes('must have')) {
            const match = text.match(/must have\s+(.+?)\.?$/i);
            if (match) {
              const amenityName = match[1].toLowerCase().replace(/\s+/g, '_');
              const amenity = AMENITY_OPTIONS.find(a => a.id === amenityName || a.label.toLowerCase() === match[1].toLowerCase());
              if (amenity && !parsedData.amenities.find(a => a.id === amenity.id)) {
                parsedData.amenities.push({ id: amenity.id, priority: 'must-have' });
              }
            }
          }
        }
      });

      setFormData(parsedData);
    }
  }, [insights]);

  // Generate insights from form data with proper categories for progress tracking
  useEffect(() => {
    const newInsights = [];

    // Location & Commute insights
    if (formData.location) {
      newInsights.push({
        step: 'Location & Commute',
        category: 'location',
        text: `I want to live in ${formData.location}`
      });
    }

    if (formData.workLocation) {
      newInsights.push({
        step: 'Location & Commute',
        category: 'location',
        text: `My work location is ${formData.workLocation}`
      });
    }

    if (formData.maxCommuteTime) {
      newInsights.push({
        step: 'Location & Commute',
        category: 'location',
        text: `Preferred commute time is ${formData.maxCommuteTime} minutes`
      });
    }

    // Budget & Finances insights
    if (formData.budget) {
      newInsights.push({
        step: 'Budget & Finances',
        category: 'budget',
        text: `My budget is ${formData.budget} CHF per month`
      });
    }

    if (formData.monthlyIncome) {
      newInsights.push({
        step: 'Budget & Finances',
        category: 'budget',
        text: `My monthly income is ${formData.monthlyIncome} CHF`
      });
    }

    // Property Requirements insights - only add if user has selected a property type
    if (formData.propertyType) {
      const propertyTypeText = formData.propertyType === 'apartment' ? 'an apartment' :
                              formData.propertyType === 'house' ? 'a house' :
                              formData.propertyType === 'studio' ? 'a studio' :
                              formData.propertyType === 'shared' ? 'shared accommodation' :
                              formData.propertyType;
      newInsights.push({
        step: 'Property Requirements',
        category: 'property',
        text: `Looking for ${propertyTypeText}`
      });
    }

    if (formData.rooms) {
      newInsights.push({
        step: 'Property Requirements',
        category: 'property',
        text: `Need ${formData.rooms} rooms`
      });
    }

    if (formData.bathrooms) {
      newInsights.push({
        step: 'Property Requirements',
        category: 'property',
        text: `Need ${formData.bathrooms} bathroom(s)`
      });
    }

    // Timeline insights
    if (formData.moveInDate) {
      newInsights.push({
        step: 'Timeline',
        category: 'timing',
        text: `Move-in date: ${dayjs(formData.moveInDate).format('MMMM D, YYYY')}`
      });
    }

    // Lifestyle & Amenities insights
    if (formData.pets) {
      newInsights.push({
        step: 'Lifestyle & Amenities',
        category: 'lifestyle',
        text: `Has pets: ${formData.petDetails || 'Yes'}`
      });
    }

    if (formData.children) {
      newInsights.push({
        step: 'Lifestyle & Amenities',
        category: 'lifestyle',
        text: `Has children: ${formData.childrenDetails || 'Yes'}`
      });
    }

    if (formData.amenities && Array.isArray(formData.amenities)) {
      formData.amenities.forEach(amenity => {
        const amenityOption = AMENITY_OPTIONS.find(opt => opt.id === amenity.id);
        if (amenityOption) {
          const priorityText = amenity.priority === 'must-have' ? 'must have' :
                              amenity.priority === 'important' ? 'is important' :
                              'would be nice';
          newInsights.push({
            step: 'Lifestyle & Amenities',
            category: 'lifestyle',
            text: `${amenityOption.label} ${priorityText}`
          });
        }
      });
    }

    // Additional Preferences insights
    if (formData.additionalRequirements && Array.isArray(formData.additionalRequirements)) {
      formData.additionalRequirements.forEach(req => {
        newInsights.push({
          step: 'Additional Preferences',
          category: 'additional',
          text: req.text,
          priority: req.priority
        });
      });
    }

    if (onInsightsChange) {
      onInsightsChange(newInsights);
    }
  }, [formData, onInsightsChange]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Mark propertyType as explicitly changed when user selects it
      ...(field === 'propertyType' && { propertyTypeChanged: true })
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleAmenity = (amenityId) => {
    setFormData(prev => {
      const currentAmenities = prev.amenities || [];
      const existingIndex = currentAmenities.findIndex(a => a.id === amenityId);

      if (existingIndex >= 0) {
        // Remove amenity
        return {
          ...prev,
          amenities: currentAmenities.filter(a => a.id !== amenityId)
        };
      } else {
        // Add amenity with its default priority
        const amenityOption = AMENITY_OPTIONS.find(opt => opt.id === amenityId);
        return {
          ...prev,
          amenities: [...currentAmenities, {
            id: amenityId,
            priority: amenityOption?.defaultPriority || 'nice-to-have'
          }]
        };
      }
    });
  };

  const updateAmenityPriority = (amenityId, priority) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map(a =>
        a.id === amenityId ? { ...a, priority } : a
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.moveInDate) {
      newErrors.moveInDate = 'Move-in date is required';
    }

    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || formData.budget <= 0) {
      newErrors.budget = 'Please enter a valid budget amount';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (formData.monthlyIncome && (isNaN(formData.monthlyIncome) || formData.monthlyIncome < 0)) {
      newErrors.monthlyIncome = 'Please enter a valid income amount';
    }

    // Validate maxCommuteTime if provided
    if (formData.maxCommuteTime) {
      const commuteError = validateCommuteTime(formData.maxCommuteTime);
      if (commuteError) {
        newErrors.maxCommuteTime = commuteError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Expand section with first error
      const firstErrorField = Object.keys(errors)[0];
      if (['moveInDate', 'budget', 'location', 'propertyType', 'rooms'].includes(firstErrorField)) {
        setExpandedSections(prev => ({ ...prev, basic: true }));
      } else if (['workLocation', 'maxCommuteTime', 'monthlyIncome'].includes(firstErrorField)) {
        setExpandedSections(prev => ({ ...prev, personal: true }));
      }
      return;
    }

    // If progress is less than 100%, show the modal first
    if (completionProgress < 100 && !showContinueModal) {
      setShowContinueModal(true);
      return;
    }

    try {
      // Convert form data to insights format
      const insights = [];

      // Basic insights
      if (formData.location) {
        insights.push({
          step: 'Location Preferences',
          text: `I want to live in ${formData.location}`
        });
      }

      if (formData.budget) {
        insights.push({
          step: 'Budget',
          text: `My budget is ${formData.budget} CHF per month`
        });
      }

      if (formData.moveInDate) {
        insights.push({
          step: 'Timing and Deadlines',
          text: `My desired move-in date is ${dayjs(formData.moveInDate).format('MMMM D, YYYY')}`
        });
      }

      if (formData.dealType) {
        insights.push({
          step: 'Property Type',
          text: `I am looking to ${formData.dealType} a property`
        });
      }

      // Personal information insights
      if (formData.workFromHome) {
        insights.push({
          step: 'Work Preferences',
          text: 'I work from home'
        });
      } else {
        if (formData.workLocation) {
          insights.push({
            step: 'Work Preferences',
            text: `I work at ${formData.workLocation}`
          });
        }
      }

      if (formData.monthlyIncome) {
        insights.push({
          step: 'Financial Information',
          text: `My monthly income is ${formData.monthlyIncome} CHF`
        });
      }

      // Create conversation profile if needed
      let conversationId = activeConversationId;
      if (!conversationId) {
        const result = await dispatch(createNewConversationProfileThunk()).unwrap();
        conversationId = result?.payload?.id || result?.id;
      }

      // Create insights
      await dispatch(createInsights({ insights, conversation_profile_id: conversationId })).unwrap();

      if (onSubmit) {
        await onSubmit(formData, insights);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const SectionHeader = ({ title, icon: Icon, expanded, onToggle, isComplete }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        py: 1.5,
        px: 2,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' }
      }}
      onClick={onToggle}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon sx={{ color: isComplete ? 'success.main' : 'text.secondary' }} />
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {isComplete && <CheckIcon sx={{ color: 'success.main', fontSize: 18 }} />}
      </Box>
      <IconButton size="small">
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: '2px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'visible',
        width: '100%'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header with Progress */}
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
          <Typography variant="h5" color="white" fontWeight="bold" gutterBottom>
            Tell Us About Your Dream Home
          </Typography>
          <Typography variant="body2" color="white" sx={{ opacity: 0.9, mb: 2 }}>
            Complete this quick form to find your perfect match
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="white">
                Profile Completion
              </Typography>
              <Typography variant="caption" color="white" fontWeight="bold">
                {completionProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                  borderRadius: 4
                }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Deal Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              What are you looking for?
            </Typography>
            <ToggleButtonGroup
              value={formData.dealType}
              exclusive
              onChange={(e, value) => value && handleFieldChange('dealType', value)}
              fullWidth
            >
              <ToggleButton value="rent">Rent</ToggleButton>
              <ToggleButton value="buy">Buy</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Basic Information Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Basic Information"
              icon={HomeIcon}
              expanded={expandedSections.basic}
              onToggle={() => toggleSection('basic')}
              isComplete={formData.moveInDate && formData.budget && formData.location}
            />

            <Collapse in={expandedSections.basic}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Move-in Date *"
                        value={formData.moveInDate}
                        onChange={(value) => handleFieldChange('moveInDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.moveInDate,
                            helperText: typeof errors.moveInDate === 'string' ? errors.moveInDate : (errors.moveInDate?.detail || errors.moveInDate?.message || ''),
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon />
                                </InputAdornment>
                              )
                            }
                          }
                        }}
                        minDate={dayjs()}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Tooltip title="Enter your maximum monthly budget for rent or mortgage payment" arrow>
                      <TextField
                        fullWidth
                        label="Monthly Budget (CHF) *"
                        value={formData.budget}
                        onChange={(e) => handleFieldChange('budget', e.target.value)}
                        error={!!errors.budget}
                        helperText={typeof errors.budget === 'string' ? errors.budget : (errors.budget?.detail || errors.budget?.message || '')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MoneyIcon />
                            </InputAdornment>
                          )
                        }}
                        type="number"
                      />
                    </Tooltip>
                  </Grid>

                  <Grid item xs={12}>
                    <LocationAutocomplete
                      onPlaceSelected={(place) => {
                        const locationName = place?.name || place?.formatted_address || '';
                        handleFieldChange('location', locationName);
                      }}
                      error={!!errors.location}
                      helperText={typeof errors.location === 'string' ? errors.location : (errors.location?.detail || errors.location?.message || "Enter the city or area where you're looking")}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Tooltip title="Select the type of property you're looking for" arrow>
                      <TextField
                        fullWidth
                        select
                        label="Property Type"
                        value={formData.propertyType}
                        onChange={(e) => handleFieldChange('propertyType', e.target.value)}
                        SelectProps={{
                          native: true
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                        required
                        error={!!errors.propertyType}
                        helperText={errors.propertyType}
                      >
                        <option value="">Select a property type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="studio">Studio</option>
                        <option value="shared">Shared Accommodation</option>
                      </TextField>
                    </Tooltip>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Tooltip title="Number of rooms you need (living room + bedrooms). For example: 2.5 rooms = 1 bedroom + living room + small room" arrow>
                      <TextField
                        fullWidth
                        label="Number of Rooms"
                        value={formData.rooms}
                        onChange={(e) => handleFieldChange('rooms', e.target.value)}
                        type="number"
                        inputProps={{ min: 1, max: 10, step: 0.5 }}
                        placeholder="e.g., 2.5"
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Personal Information Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Personal Information (Optional)"
              icon={PersonIcon}
              expanded={expandedSections.personal}
              onToggle={() => toggleSection('personal')}
              isComplete={formData.monthlyIncome && (formData.workFromHome || formData.workLocation)}
            />

            <Collapse in={expandedSections.personal}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.workFromHome}
                          onChange={(e) => handleFieldChange('workFromHome', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="I work from home"
                    />
                  </Grid>

                  {!formData.workFromHome && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Tooltip title="Enter your workplace location to help us find homes with convenient commute" arrow>
                          <TextField
                            fullWidth
                            label="Work Location"
                            placeholder="e.g., Downtown Zurich, Google Office"
                            value={formData.workLocation}
                            onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WorkIcon />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Tooltip>
                      </Grid>

                    </>
                  )}

                  <Grid item xs={12} md={6}>
                    <Tooltip title="Your monthly income helps us find properties within your budget range (typically rent should be less than 1/3 of income)" arrow>
                      <TextField
                        fullWidth
                        label="Monthly Income (CHF)"
                        value={formData.monthlyIncome}
                        onChange={(e) => handleFieldChange('monthlyIncome', e.target.value)}
                        error={!!errors.monthlyIncome}
                        helperText={typeof errors.monthlyIncome === 'string' ? errors.monthlyIncome : (errors.monthlyIncome?.detail || errors.monthlyIncome?.message || "Helps with affordability matching")}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MoneyIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Tooltip>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Household Size"
                      value={formData.householdSize}
                      onChange={(e) => handleFieldChange('householdSize', e.target.value)}
                      type="number"
                      inputProps={{ min: 1, max: 10 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <ToggleButtonGroup
                      value={formData.hasPets}
                      exclusive
                      onChange={(e, value) => {
                        handleFieldChange('hasPets', value);
                        if (value && !formData.petDetails) {
                          handleFieldChange('showPetDetails', true);
                        }
                      }}
                      fullWidth
                      size="small"
                    >
                      <ToggleButton value={false} sx={{ px: 1 }}>No Pets</ToggleButton>
                      <ToggleButton value={true} sx={{ px: 1 }}>
                        <PetsIcon sx={{ mr: 0.5, fontSize: 20 }} /> Pets
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <ToggleButtonGroup
                      value={formData.hasChildren}
                      exclusive
                      onChange={(e, value) => {
                        handleFieldChange('hasChildren', value);
                        if (value && !formData.childrenDetails) {
                          handleFieldChange('showChildrenDetails', true);
                        }
                      }}
                      fullWidth
                      size="small"
                    >
                      <ToggleButton value={false} sx={{ px: 1 }}>No Kids</ToggleButton>
                      <ToggleButton value={true} sx={{ px: 1 }}>
                        <ChildrenIcon sx={{ mr: 0.5, fontSize: 20 }} /> Kids
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  {/* Pet details prompt */}
                  {formData.hasPets && formData.showPetDetails && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Tell us about your pets
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Type of pet(s)"
                              value={formData.petType || ''}
                              onChange={(e) => handleFieldChange('petType', e.target.value)}
                              placeholder="E.g., dog, cat, bird"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Number of pets"
                              type="number"
                              value={formData.petCount || ''}
                              onChange={(e) => handleFieldChange('petCount', e.target.value)}
                              inputProps={{ min: 1, max: 10 }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Pet size/breed (optional)"
                              value={formData.petSize || ''}
                              onChange={(e) => handleFieldChange('petSize', e.target.value)}
                              placeholder="E.g., small, medium, large, or specific breed"
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Children details prompt */}
                  {formData.hasChildren && formData.showChildrenDetails && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Tell us about your children
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Number of children"
                              type="number"
                              value={formData.childrenCount || ''}
                              onChange={(e) => handleFieldChange('childrenCount', e.target.value)}
                              inputProps={{ min: 1, max: 10 }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Ages of children"
                              value={formData.childrenAges || ''}
                              onChange={(e) => handleFieldChange('childrenAges', e.target.value)}
                              placeholder="E.g., 2, 5, 10"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.needSchoolNearby || false}
                                  onChange={(e) => handleFieldChange('needSchoolNearby', e.target.checked)}
                                />
                              }
                              label="Need schools nearby"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Preferences Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Location & Amenities (Optional)"
              icon={LocationIcon}
              expanded={expandedSections.preferences}
              onToggle={() => toggleSection('preferences')}
              isComplete={formData.amenities.length > 0}
            />

            <Collapse in={expandedSections.preferences}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Grid container spacing={2}>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Important Amenities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {AMENITY_OPTIONS.map(amenity => {
                        const Icon = amenity.icon;
                        const isSelected = formData.amenities.some(a => a.id === amenity.id);
                        const selectedAmenity = formData.amenities.find(a => a.id === amenity.id);

                        return (
                          <Chip
                            key={amenity.id}
                            icon={<Icon />}
                            label={amenity.label}
                            onClick={() => toggleAmenity(amenity.id)}
                            color={isSelected ? PRIORITY_COLORS[selectedAmenity?.priority || 'nice-to-have'] : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'transform 0.2s'
                              }
                            }}
                          />
                        );
                      })}
                    </Box>

                    {formData.amenities.length > 0 && (
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Set priority for selected amenities:
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {formData.amenities.map(amenity => {
                            const amenityOption = AMENITY_OPTIONS.find(opt => opt.id === amenity.id);
                            if (!amenityOption) return null;

                            return (
                              <Box
                                key={amenity.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Typography variant="body2">
                                  {amenityOption.label}
                                </Typography>
                                <ToggleButtonGroup
                                  size="small"
                                  value={amenity.priority}
                                  exclusive
                                  onChange={(e, value) => value && updateAmenityPriority(amenity.id, value)}
                                >
                                  <ToggleButton value="nice-to-have">Nice to have</ToggleButton>
                                  <ToggleButton value="important">Important</ToggleButton>
                                  <ToggleButton value="must-have">Must have</ToggleButton>
                                </ToggleButtonGroup>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Additional Requirements Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Additional Requirements"
              icon={InfoIcon}
              expanded={expandedSections.additional}
              onToggle={() => toggleSection('additional')}
              isComplete={!!formData.additionalNotes}
            />

            <Collapse in={expandedSections.additional}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add specific requirements
                </Typography>

                {/* Input for new feature */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add a requirement"
                    value={formData.newFeature || ''}
                    onChange={(e) => handleFieldChange('newFeature', e.target.value)}
                    placeholder="E.g., quiet neighborhood, near parks, etc."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && formData.newFeature?.trim()) {
                        e.preventDefault();
                        const features = formData.additionalFeatures || [];
                        const defaultPriority = 'nice-to-have';
                        handleFieldChange('additionalFeatures', [...features, {
                          text: formData.newFeature.trim(),
                          priority: defaultPriority
                        }]);
                        handleFieldChange('newFeature', '');
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (formData.newFeature?.trim()) {
                        const features = formData.additionalFeatures || [];
                        const defaultPriority = 'nice-to-have';
                        handleFieldChange('additionalFeatures', [...features, {
                          text: formData.newFeature.trim(),
                          priority: defaultPriority
                        }]);
                        handleFieldChange('newFeature', '');
                      }
                    }}
                    disabled={!formData.newFeature?.trim()}
                  >
                    Add
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Press Enter or click Add to add each requirement
                </Typography>

                {/* Additional features list with priorities */}
                {formData.additionalFeatures?.length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Set priority for each requirement:
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {formData.additionalFeatures.map((feature, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                            {feature.text || feature}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ToggleButtonGroup
                              size="small"
                              value={feature.priority || 'nice-to-have'}
                              exclusive
                              onChange={(e, value) => {
                                if (value) {
                                  const updatedFeatures = [...formData.additionalFeatures];
                                  updatedFeatures[index] = {
                                    text: feature.text || feature,
                                    priority: value
                                  };
                                  handleFieldChange('additionalFeatures', updatedFeatures);
                                }
                              }}
                            >
                              <ToggleButton value="nice-to-have">Nice</ToggleButton>
                              <ToggleButton value="important">Important</ToggleButton>
                              <ToggleButton value="must-have">Must</ToggleButton>
                            </ToggleButtonGroup>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newFeatures = formData.additionalFeatures.filter((_, i) => i !== index);
                                handleFieldChange('additionalFeatures', newFeatures);
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={isSubmitting || completionProgress < 30}
              sx={{
                background: '#1976d2',
                color: 'white',
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                '&:hover': {
                  background: '#1565c0',
                  boxShadow: '0 6px 10px rgba(0,0,0,0.15)',
                },
                '&:disabled': {
                  background: 'rgba(25, 118, 210, 0.5)',
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {isSubmitting ? 'Finding Your Perfect Home...' : 'Show Matches'}
            </Button>
          </Box>

          {completionProgress < 30 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please fill in at least the required fields (marked with *) to continue
            </Alert>
          )}
        </Box>
      </CardContent>

      {/* Continue Modal */}
      <Dialog
        open={showContinueModal}
        onClose={() => setShowContinueModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: 'info.main' }} />
            <Typography variant="h6">Complete Your Profile for Better Matches</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            You've filled {completionProgress}% of your profile. The more information you provide, the better we can match you with your perfect home!
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Consider adding:
          </Typography>
          <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
            {!formData.workLocation && <Typography component="li" variant="body2">Your work location for commute optimization</Typography>}
            {!formData.monthlyIncome && <Typography component="li" variant="body2">Monthly income for accurate affordability</Typography>}
            {formData.amenities.length === 0 && <Typography component="li" variant="body2">Preferred amenities that matter to you</Typography>}
            {!formData.additionalNotes && <Typography component="li" variant="body2">Any special requirements or preferences</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowContinueModal(false)}
            color="primary"
            variant="outlined"
          >
            Add More Details
          </Button>
          <Button
            onClick={() => {
              setShowContinueModal(false);
              handleSubmit(); // This will now proceed with submission
            }}
            variant="contained"
            color="primary"
          >
            Continue to Matches
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};