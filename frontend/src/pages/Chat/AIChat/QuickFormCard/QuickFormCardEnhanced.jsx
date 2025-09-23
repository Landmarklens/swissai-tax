import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Grid,
  LinearProgress,
  Alert,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Divider,
  Fade,
  Paper
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
  DirectionsCar as CarIcon,
  WifiOutlined,
  FitnessCenter as GymIcon,
  Pool as PoolIcon,
  Balcony as BalconyIcon,
  LocalLaundryService as LaundryIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocationAutocomplete } from '../MultiFilterPanel/ui/LocationAutocomplete/LocationAutocomplete';
import {
  createInsights,
  createNewConversationProfileThunk
} from '../../../../store/slices/conversationsSlice';

// Predefined amenity options with icons
const AMENITY_OPTIONS = [
  { id: 'parking', label: 'Parking', icon: CarIcon },
  { id: 'gym', label: 'Gym', icon: GymIcon },
  { id: 'pool', label: 'Swimming Pool', icon: PoolIcon },
  { id: 'balcony', label: 'Balcony/Terrace', icon: BalconyIcon },
  { id: 'laundry', label: 'In-unit Laundry', icon: LaundryIcon },
  { id: 'internet', label: 'High-speed Internet', icon: WifiOutlined },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: PetsIcon },
  { id: 'furnished', label: 'Furnished', icon: HomeIcon }
];

const PRIORITY_COLORS = {
  'must-have': 'error',
  'important': 'warning',
  'nice-to-have': 'info'
};

const QuickFormCardEnhanced = ({ onSubmit, initialValues = {} }) => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Information
    moveInDate: initialValues.moveInDate || null,
    budget: initialValues.budget || '',
    location: initialValues.location || '',
    propertyType: initialValues.propertyType || 'apartment',
    rooms: initialValues.rooms || '',

    // Personal Information
    occupation: initialValues.occupation || '',
    monthlyIncome: initialValues.monthlyIncome || '',
    householdSize: initialValues.householdSize || 1,
    hasPets: initialValues.hasPets || false,
    hasChildren: initialValues.hasChildren || false,

    // Preferences
    maxCommuteTime: initialValues.maxCommuteTime || '',
    workLocation: initialValues.workLocation || '',
    amenities: initialValues.amenities || [],

    // Additional Requirements
    additionalNotes: initialValues.additionalNotes || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    personal: false,
    preferences: false,
    additional: false
  });

  // Calculate completion progress
  useEffect(() => {
    const requiredFields = ['moveInDate', 'budget', 'location'];
    const optionalFields = ['propertyType', 'rooms', 'occupation', 'monthlyIncome', 'workLocation', 'maxCommuteTime'];

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

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
        // Add amenity with default priority
        return {
          ...prev,
          amenities: [...currentAmenities, { id: amenityId, priority: 'nice-to-have' }]
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

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

      if (formData.workLocation && formData.maxCommuteTime) {
        insights.push({
          step: 'Location Preferences',
          text: `My work location is ${formData.workLocation} and preferred commute time is ${formData.maxCommuteTime} minutes`
        });
      }

      if (formData.monthlyIncome) {
        insights.push({
          step: 'Budget',
          text: `My monthly income is ${formData.monthlyIncome} CHF`
        });
      }

      // Amenity insights
      formData.amenities.forEach(amenity => {
        const amenityOption = AMENITY_OPTIONS.find(opt => opt.id === amenity.id);
        if (amenityOption) {
          const priorityText = amenity.priority === 'must-have' ? 'must have' :
                              amenity.priority === 'important' ? 'is important for me' :
                              'would be nice to have';
          insights.push({
            step: 'Lifestyle and Amenities',
            text: `${amenityOption.label} ${priorityText}`
          });
        }
      });

      // Personal preferences
      if (formData.hasPets) {
        insights.push({
          step: 'Lifestyle and Amenities',
          text: 'I have pets that will live with me'
        });
      }

      if (formData.hasChildren) {
        insights.push({
          step: 'Lifestyle and Amenities',
          text: `I have children (household size: ${formData.householdSize})`
        });
      }

      if (formData.additionalNotes) {
        insights.push({
          step: 'Additional Requirements',
          text: formData.additionalNotes
        });
      }

      // Create insights and profile
      await dispatch(createInsights(insights));
      await dispatch(createNewConversationProfileThunk(insights));

      if (onSubmit) {
        await onSubmit(formData, insights);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header with Progress */}
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Typography variant="h5" color="white" fontWeight="bold" gutterBottom>
            Tell Us About Your Dream Home
          </Typography>
          <Typography variant="body2" color="white" sx={{ opacity: 0.9, mb: 2 }}>
            Complete this form or chat with our AI to find your perfect match
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
                            id: 'field-moveInDate',
                            error: !!errors.moveInDate,
                            helperText: errors.moveInDate,
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
                    <TextField
                      fullWidth
                      label="Monthly Budget (CHF) *"
                      value={formData.budget}
                      onChange={(e) => handleFieldChange('budget', e.target.value)}
                      id="field-budget"
                      error={!!errors.budget}
                      helperText={errors.budget}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon />
                          </InputAdornment>
                        )
                      }}
                      type="number"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <LocationAutocomplete
                      value={formData.location}
                      onChange={(value) => handleFieldChange('location', value)}
                      error={!!errors.location}
                      helperText={errors.location}
                      label="Preferred Location *"
                      id="field-location"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Property Type"
                      value={formData.propertyType}
                      onChange={(e) => handleFieldChange('propertyType', e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="shared">Shared Accommodation</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number of Rooms"
                      value={formData.rooms}
                      onChange={(e) => handleFieldChange('rooms', e.target.value)}
                      type="number"
                      inputProps={{ min: 1, max: 10, step: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Personal Information Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Personal Information"
              icon={PersonIcon}
              expanded={expandedSections.personal}
              onToggle={() => toggleSection('personal')}
              isComplete={formData.occupation && formData.monthlyIncome}
            />

            <Collapse in={expandedSections.personal}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Occupation"
                      value={formData.occupation}
                      onChange={(e) => handleFieldChange('occupation', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Monthly Income (CHF)"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleFieldChange('monthlyIncome', e.target.value)}
                      error={!!errors.monthlyIncome}
                      helperText={errors.monthlyIncome || "Optional but helps with affordability"}
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon />
                          </InputAdornment>
                        )
                      }}
                    />
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
                      onChange={(e, value) => handleFieldChange('hasPets', value)}
                      fullWidth
                    >
                      <ToggleButton value={false} sx={{ flex: 1 }}>
                        No Pets
                      </ToggleButton>
                      <ToggleButton value={true} sx={{ flex: 1 }}>
                        <PetsIcon sx={{ mr: 0.5 }} /> Has Pets
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <ToggleButtonGroup
                      value={formData.hasChildren}
                      exclusive
                      onChange={(e, value) => handleFieldChange('hasChildren', value)}
                      fullWidth
                    >
                      <ToggleButton value={false} sx={{ flex: 1 }}>
                        No Children
                      </ToggleButton>
                      <ToggleButton value={true} sx={{ flex: 1 }}>
                        <ChildrenIcon sx={{ mr: 0.5 }} /> Has Children
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Preferences Section */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title="Location & Amenities"
              icon={LocationIcon}
              expanded={expandedSections.preferences}
              onToggle={() => toggleSection('preferences')}
              isComplete={formData.amenities.length > 0}
            />

            <Collapse in={expandedSections.preferences}>
              <Box sx={{ px: 2, pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <LocationAutocomplete
                      value={formData.workLocation}
                      onChange={(value) => handleFieldChange('workLocation', value)}
                      label="Work/Study Location"
                      helperText="We'll find homes with good commute times"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Commute Time (minutes)"
                      value={formData.maxCommuteTime}
                      onChange={(e) => handleFieldChange('maxCommuteTime', e.target.value)}
                      type="number"
                      inputProps={{ min: 5, max: 120 }}
                    />
                  </Grid>

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
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Tell us more about your ideal home"
                  value={formData.additionalNotes}
                  onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                  placeholder="E.g., quiet neighborhood, near parks, good schools nearby, etc."
                  helperText={`${formData.additionalNotes.length}/500 characters`}
                  inputProps={{ maxLength: 500 }}
                />
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4299 100%)',
                }
              }}
            >
              {isSubmitting ? 'Finding Your Perfect Home...' : 'Start Finding Homes'}
            </Button>
          </Box>

          {completionProgress < 30 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please fill in at least the required fields (marked with *) to continue
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickFormCardEnhanced;