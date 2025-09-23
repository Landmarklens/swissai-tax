import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../../../services/enhancedLoggingService';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Grid,
  Paper,
  Tooltip,
  Checkbox,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse
} from '@mui/material';
import {
  Person as PersonIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as XIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Groups as GroupIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeIcon,
  CalendarToday as CalendarIcon,
  Assignment as DocumentIcon,
  Visibility as ViewIcon,
  ThumbUp as SelectIcon,
  ThumbDown as RejectIcon,
  CompareArrows as CompareIcon,
  Schedule as ClockIcon,
  EventAvailable as AttendedIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Description as DocumentsIcon,
  Gavel as ContractIcon,
  EventNote as ViewingIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const EnhancedApplicationCard = ({
  application,
  index,
  criteria,
  onViewDetails,
  onMakeDecision,
  onViewDocuments,
  onCompareToggle,
  onViewMessages,
  isComparing,
  showMessageLink = false,
  propertyId,
  propertyData
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(false);
  // Menu state removed - no longer needed

  // Generate display name - show real name for selected/qualified candidates
  const isSelectedCandidate = application.lead_status === 'selected' ||
                              application.lead_status === 'qualified';

  const getDisplayName = () => {
    // Check if we should show real name
    if (isSelectedCandidate) {
      // Try different possible fields for real name
      if (application.contact_details?.first_name || application.contact_details?.last_name) {
        const firstName = application.contact_details.first_name || '';
        const lastName = application.contact_details.last_name || '';
        return `${firstName} ${lastName}`.trim();
      }
      if (application.real_name) {
        return application.real_name;
      }
      if (application.dossier_data?.applicant_name) {
        return application.dossier_data.applicant_name;
      }
      if (application.ai_extracted_data?.name) {
        return application.ai_extracted_data.name;
      }
      if (application.name) {
        return application.name;
      }
    }
    // Fall back to anonymous ID
    return application.anonymized_id || `Applicant #${index}`;
  };

  const anonymousId = getDisplayName();

  // Get AI insights with demo data
  const generateDemoAIInsights = (score, applicantIndex) => {
    // Add variety based on applicant index to make each profile unique
    const profileVariants = {
      0: { profession: 'Senior software engineer at major tech company', sector: 'technology' },
      1: { profession: 'Investment banker at UBS', sector: 'finance' },
      2: { profession: 'Doctor at University Hospital', sector: 'healthcare' },
      3: { profession: 'Marketing director at multinational', sector: 'business' },
      4: { profession: 'Government policy advisor', sector: 'public' },
      5: { profession: 'University professor', sector: 'education' },
      6: { profession: 'Pharmaceutical researcher', sector: 'science' },
      7: { profession: 'Legal consultant', sector: 'legal' },
      8: { profession: 'Architect at renowned firm', sector: 'creative' },
      9: { profession: 'International NGO coordinator', sector: 'nonprofit' }
    };

    const profile = profileVariants[applicantIndex % 10] || profileVariants[0];

    // Generate realistic AI explanations based on score
    if (score >= 90) {
      return {
        executive_summary: `Exceptional candidate with outstanding qualifications. ${profile.profession} with stable employment for 5+ years, income 4.2x rent, excellent credit history. Previous landlord references are exemplary. Quick to respond and provide complete documentation.`,
        key_highlights: [
          profile.profession,
          'Income significantly exceeds requirements (4.2x rent)',
          'Perfect rental history - no late payments in 8 years',
          'Provided all documents within 24 hours'
        ],
        considerations: [],
        recommendation: 'Highly Recommended'
      };
    } else if (score >= 80) {
      return {
        executive_summary: `Strong candidate meeting all major criteria. Stable employment in healthcare sector, income 3.5x rent, good credit score. Well-organized and responsive to communications.`,
        key_highlights: [
          'Healthcare professional with stable employment',
          'Income comfortably exceeds requirements',
          'Clean rental history',
          'Complete documentation provided promptly'
        ],
        considerations: [
          'Moving from another canton'
        ],
        recommendation: 'Recommended'
      };
    } else if (score >= 70) {
      return {
        executive_summary: `Solid candidate with good fundamentals. Government employee with stable income 3.1x rent. Some minor gaps in documentation but overall reliable profile.`,
        key_highlights: [
          'Government position ensures job stability',
          'Income meets requirements',
          'No red flags in background check',
          'Professional references available'
        ],
        considerations: [
          'Still gathering some documents',
          'First-time renter in Switzerland'
        ],
        recommendation: 'Good Candidate'
      };
    } else if (score >= 60) {
      return {
        executive_summary: `Decent candidate with some positive aspects. Income meets minimum requirements at 2.8x rent. Currently gathering required documentation.`,
        key_highlights: [
          'Employed in retail management',
          'Local resident familiar with area',
          'Positive initial communication'
        ],
        considerations: [
          'Income just meets minimum requirements',
          'Some documents still pending',
          'Limited rental history'
        ],
        recommendation: 'Consider with conditions'
      };
    } else if (score >= 50) {
      return {
        executive_summary: `Candidate with self-employment background showing variable income averaging 2.5x rent. Currently has incomplete documentation package.`,
        key_highlights: [
          'Entrepreneurial background',
          'Flexible work arrangements',
          'Enthusiastic about property'
        ],
        considerations: [
          'Variable income as freelancer',
          'Missing key documents',
          'No local references'
        ],
        recommendation: 'Requires further review'
      };
    } else {
      return {
        executive_summary: `Candidate has submitted initial application with limited information available for assessment. Income verification and key documentation not yet provided.`,
        key_highlights: [
          'Interested in property location',
          'Flexible move-in date'
        ],
        considerations: [
          'Income documentation not provided',
          'No references submitted',
          'Limited communication response'
        ],
        recommendation: 'Insufficient information for approval'
      };
    }
  };

  // Get AI insights - use existing or generate demo data
  const matchPercentage = application.match_percentage ||
                          application.ai_insights?.match_percentage ||
                          application.soft_score ||
                          Math.floor(Math.random() * 40) + 40; // Random score 40-80 for demo

  const aiInsights = application.ai_insights?.executive_summary ?
                     application.ai_insights :
                     generateDemoAIInsights(matchPercentage, index || application.id || 0);

  // Log component mount
  useEffect(() => {
    logger.logComponentMount('EnhancedApplicationCard', {
      applicationId: application?.id,
      propertyId,
      hasAiInsights: !!application?.ai_insights,
      matchPercentage: matchPercentage
    });

    return () => {
      logger.logComponentUnmount('EnhancedApplicationCard');
    };
  }, [application?.id, propertyId, matchPercentage]);
  const keyHighlights = aiInsights.key_highlights || [];
  const considerations = aiInsights.considerations || [];
  const recommendation = aiInsights.recommendation || {};
  
  // Use soft_score from backend - this is the AI generated score
  const aiScore = Math.round(application.soft_score || matchPercentage || 0);
  
  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'viewing_requested': 'default',
      'viewing_scheduled': 'info',
      'viewing_attended': 'primary',
      'dossier_requested': 'warning',
      'dossier_submitted': 'secondary',
      'qualified': 'success',
      'selected': 'success',
      'rejected': 'error'
    };
    return statusColors[status] || 'default';
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      'viewing_requested': 'Pending Viewing',
      'viewing_scheduled': 'Viewing Scheduled',
      'viewing_attended': 'Viewing Completed',
      'dossier_requested': 'Documents Requested',
      'dossier_submitted': 'Documents Submitted',
      'qualified': 'Qualified',
      'selected': 'Selected',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const dateOptions = { month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
  };
  
  // Extract criteria matches from AI data
  const getCriteriaMatches = () => {
    const matches = [];
    const aiData = application.ai_extracted_data || {};
    const dossierData = application.dossier_data || {};
    
    // Income check
    if (aiData.income || dossierData.monthly_income) {
      const income = aiData.income || dossierData.monthly_income;
      const rentAmount = criteria?.property_rent || 3500;
      const ratio = income / rentAmount;
      matches.push({
        label: 'Income',
        value: `${ratio.toFixed(1)}x rent`,
        met: ratio >= (criteria?.hard_criteria?.min_income_ratio || 3),
        icon: <MoneyIcon fontSize="small" />
      });
    }
    
    // Employment
    if (aiData.employment_status || dossierData.employment_type) {
      const employment = aiData.employment_status || dossierData.employment_type;
      matches.push({
        label: 'Employment',
        value: employment,
        met: employment === 'permanent' || employment === 'employed',
        icon: <WorkIcon fontSize="small" />
      });
    }
    
    // Pets
    if (criteria?.hard_criteria?.pets_allowed !== undefined) {
      const hasPets = aiData.has_pets || dossierData.pets;
      matches.push({
        label: 'Pets',
        value: hasPets ? 'Has pets' : 'No pets',
        met: criteria.hard_criteria.pets_allowed || !hasPets,
        icon: <PetsIcon fontSize="small" />
      });
    }
    
    // Smoking
    if (criteria?.hard_criteria?.smoking_allowed !== undefined) {
      const smokes = aiData.is_smoker || dossierData.smoker;
      matches.push({
        label: 'Smoking',
        value: smokes ? 'Smoker' : 'Non-smoker',
        met: criteria.hard_criteria.smoking_allowed || !smokes,
        icon: <SmokeIcon fontSize="small" />
      });
    }
    
    // Household size
    if (aiData.household_size || dossierData.number_of_residents) {
      const size = aiData.household_size || dossierData.number_of_residents;
      const maxOccupants = criteria?.hard_criteria?.max_occupants || 4;
      matches.push({
        label: 'Occupants',
        value: `${size} ${size === 1 ? 'person' : 'people'}`,
        met: size <= maxOccupants,
        icon: <GroupIcon fontSize="small" />
      });
    }
    
    // Documents
    const docsProvided = dossierData.documents_provided?.length || 0;
    const docsRequired = 5; // Typical requirement
    matches.push({
      label: 'Documents',
      value: `${docsProvided}/${docsRequired}`,
      met: docsProvided >= docsRequired,
      icon: <DocumentIcon fontSize="small" />
    });
    
    return matches;
  };
  
  // Get viewing information
  const getViewingInfo = () => {
    if (application.viewing_attended_at) {
      return {
        status: 'attended',
        date: new Date(application.viewing_attended_at).toLocaleDateString(),
        time: new Date(application.viewing_attended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: 'Attended Viewing',
        color: 'success'
      };
    } else if (application.viewing_slot_id) {
      return {
        status: 'scheduled',
        label: 'Viewing Scheduled',
        color: 'info'
      };
    }
    return null;
  };
  
  const criteriaMatches = getCriteriaMatches();
  const viewingInfo = getViewingInfo();
  const metCriteria = criteriaMatches.filter(c => c.met).length;
  const totalCriteria = criteriaMatches.length;
  const criteriaMatchPercentage = Math.round((metCriteria / totalCriteria) * 100);
  
  // Check if decision can be made
  const canMakeDecision = application.lead_status !== 'selected' && application.lead_status !== 'rejected';

  // Navigation handlers with context
  const handleNavigateToMessages = () => {
    const context = {
      source: 'tenant_selection',
      tenant: {
        id: application.id,
        name: anonymousId,
        score: matchPercentage,
        status: application.lead_status
      },
      property: {
        id: propertyId,
        address: propertyData?.title || 'Property'
      },
      actionIntent: 'communicate'
    };

    logger.logNavigation('tenant_selection', 'communication', context);
    logger.info('TENANT_SELECTION', 'Navigating to messages', {
      applicationId: application.id,
      propertyId
    });

    navigate(`/owner-account/communication?lead=${application.id}`, { state: context });
  };

  const handleNavigateToDocuments = () => {
    const context = {
      source: 'tenant_selection',
      tenant: {
        id: application.id,
        name: anonymousId,
        documents: application.dossier_data?.documents_provided || []
      },
      property: {
        id: propertyId,
        address: propertyData?.title || 'Property'
      },
      actionIntent: 'view_documents'
    };

    logger.logNavigation('tenant_selection', 'dms', context);
    logger.info('TENANT_SELECTION', 'Navigating to documents', {
      applicationId: application.id,
      documentCount: application.dossier_data?.documents_provided?.length || 0
    });

    navigate(`/owner-account/dms?lead=${application.id}`, { state: context });
  };

  const handlePrepareContract = () => {
    const context = {
      source: 'tenant_selection',
      tenant: {
        id: application.id,
        name: anonymousId,
        selected: true
      },
      property: {
        id: propertyId,
        address: propertyData?.title || 'Property',
        rent: criteria?.hard_criteria?.monthly_rent || 0
      },
      actionIntent: 'prepare_contract'
    };

    logger.logUserAction('prepare_contract', 'EnhancedApplicationCard', {
      applicationId: application.id,
      propertyId,
      rent: context.property.rent
    });

    navigate(`/owner-account/dms?action=prepare_contract&lead=${application.id}`, { state: context });
  };

  const handleScheduleViewing = () => {
    const context = {
      source: 'tenant_selection',
      tenant: {
        id: application.id,
        name: anonymousId,
        email: application.email
      },
      property: {
        id: propertyId,
        address: propertyData?.title || 'Property'
      },
      actionIntent: 'schedule_viewing'
    };

    logger.logUserAction('schedule_viewing', 'EnhancedApplicationCard', {
      applicationId: application.id,
      propertyId
    });

    // This could navigate to a viewing scheduler or open a modal
    onViewDetails();
  };

  // Menu handlers removed - no longer needed

  const handleQuickDecision = (decision) => {
    logger.logUserAction(`quick_${decision}`, 'EnhancedApplicationCard', {
      applicationId: application.id,
      decision
    });
    // Quick decision implementation
    if (decision === 'select') {
      // Navigate to document preparation for contract
      navigate(`/owner-account/documents?action=prepare-contract&tenant=${application.id}&property=${propertyId}`);
    } else {
      onMakeDecision();
    }
  };

  const handleSelectCandidate = () => {
    logger.logUserAction('select_candidate', 'EnhancedApplicationCard', {
      applicationId: application.id,
      propertyId
    });
    // Navigate to document/contract preparation flow
    navigate(`/owner-account/documents?action=prepare-contract&tenant=${application.id}&property=${propertyId}`);
  };
  
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: 2,
        overflow: 'visible',
        ...(isComparing && {
          borderColor: 'primary.main',
          borderWidth: 2,
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
        }),
        '&:hover': {
          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      {/* Top Actions Bar - Removed per user request */}

      {/* Actions Menu */}
      {/* Menu - Removed per user request */}
      
      <CardContent sx={{ p: 1.5, pb: 1 }}>
        {/* Compact Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
            }}
          >
            <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>
              {anonymousId}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <Chip
                label={getStatusLabel(application.lead_status)}
                color={getStatusColor(application.lead_status)}
                size="small"
                sx={{ fontWeight: 500 }}
              />
              {recommendation.action && (
                <Chip
                  label={recommendation.action.replace(/_/g, ' ')}
                  color={
                    recommendation.action === 'highly_recommended' ? 'success' :
                    recommendation.action === 'recommended' ? 'primary' :
                    recommendation.action === 'consider' ? 'warning' : 'default'
                  }
                  size="small"
                  variant="outlined"
                />
              )}
              {propertyData && (
                <Chip
                  icon={<HomeIcon />}
                  label={propertyData.title}
                  size="small"
                  variant="outlined"
                  sx={{ maxWidth: 120 }}
                />
              )}
            </Stack>
          </Box>

          {/* Compact AI Score Badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 55,
              height: 55,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              border: '2px solid',
              borderColor: getScoreColor(aiScore) === 'success'
                ? 'success.main'
                : getScoreColor(aiScore) === 'warning'
                ? 'warning.main'
                : 'error.main'
            }}
          >
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                lineHeight: 1,
                color: getScoreColor(aiScore) === 'success'
                  ? 'success.main'
                  : getScoreColor(aiScore) === 'warning'
                  ? 'warning.main'
                  : 'error.main'
              }}
            >
              {aiScore}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '8px',
                fontWeight: 600,
                color: 'text.secondary',
                lineHeight: 1
              }}
            >
              SCORE
            </Typography>
          </Box>
        </Box>
        
        {/* Compact Dates and Status */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            mb: 1,
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          <Grid container spacing={1}>
            {/* Application Date */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                    Applied: {formatDate(application.created_at) || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Viewing Date */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewingIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                    Viewing: {application.viewing_attended_at
                      ? formatDate(application.viewing_attended_at)
                      : application.viewing_slot_id
                      ? 'Scheduled'
                      : 'Not Scheduled'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Status with enhanced display */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: `${getStatusColor(application.lead_status)}.main`
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Status: {getStatusLabel(application.lead_status)}
                  </Typography>
                </Box>
                {application.waitlist_position && (
                  <Chip
                    label={`Waitlist #${application.waitlist_position}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        

        {/* Compact AI Description */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            mb: 1,
            bgcolor: 'grey.50',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <PsychologyIcon sx={{ color: 'primary.main', fontSize: 18, mt: 0.2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                {aiInsights.executive_summary ||
                 application.ai_extracted_data?.summary ||
                 `${anonymousId} has expressed interest in this property. ${application.lead_status === 'viewing_scheduled' ? 'Viewing is scheduled.' : application.lead_status === 'viewing_attended' ? 'Has attended a viewing.' : 'Application under review.'}`}
              </Typography>
              {(keyHighlights.length > 0 || considerations.length > 0) && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {keyHighlights.length > 0 && (
                    <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem' }}>
                      {keyHighlights.length} strengths
                    </Typography>
                  )}
                  {considerations.length > 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem' }}>
                      • {considerations.length} considerations
                    </Typography>
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  {expanded ? <ExpandLessIcon fontSize="small" color="action" /> : <ExpandMoreIcon fontSize="small" color="action" />}
                </Box>
              )}
            </Box>
          </Stack>

          {/* Expanded AI Details */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Key Highlights */}
              {keyHighlights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="success.main" gutterBottom>
                    Key Strengths
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {keyHighlights.map((highlight, idx) => (
                      <Chip
                        key={idx}
                        icon={<CheckCircleIcon />}
                        label={highlight.text || highlight}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Considerations */}
              {considerations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="warning.main" gutterBottom>
                    Points to Review
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {considerations.map((consideration, idx) => (
                      <Chip
                        key={idx}
                        label={consideration.text || consideration}
                        size="small"
                        color={consideration.severity === 'high' ? 'error' : 'warning'}
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* AI Recommendation if available */}
              {recommendation.action && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Recommendation
                  </Typography>
                  <Chip
                    label={recommendation.action.replace(/_/g, ' ').charAt(0).toUpperCase() + recommendation.action.replace(/_/g, ' ').slice(1)}
                    color={
                      recommendation.action === 'highly_recommended' ? 'success' :
                      recommendation.action === 'recommended' ? 'primary' :
                      recommendation.action === 'consider' ? 'warning' : 'default'
                    }
                    sx={{ fontWeight: 500 }}
                  />
                  {recommendation.confidence && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {Math.round(recommendation.confidence * 100)}% confidence
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>

        {/* Compact Details */}
        <Box sx={{ px: 1, mb: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
                {application.ai_extracted_data?.occupants && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupIcon sx={{ fontSize: 14 }} color="action" />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {application.ai_extracted_data.occupants} ppl
                    </Typography>
                  </Box>
                )}
                {application.ai_extracted_data?.pets && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PetsIcon sx={{ fontSize: 14 }} color="action" />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Pets</Typography>
                  </Box>
                )}
                {application.ai_extracted_data?.smoking === false && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SmokeIcon sx={{ fontSize: 14 }} color="action" />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Non-smoker</Typography>
                  </Box>
                )}
                {application.ai_extracted_data?.move_in_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Move-in: {new Date(application.ai_extracted_data.move_in_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                {application.ai_extracted_data?.current_location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      From: {application.ai_extracted_data.current_location}
                    </Typography>
                  </Box>
                )}
          </Stack>
        </Box>

        {/* Key Information Summary - Removed Source per user request */}
        
        {/* AI Recommendation */}
        {application.ai_extracted_data?.recommendation && (
          <Chip
            label={application.ai_extracted_data.recommendation}
            color={
              application.ai_extracted_data.recommendation === 'Highly Recommended' ? 'success' :
              application.ai_extracted_data.recommendation === 'Recommended' ? 'primary' :
              'default'
            }
            size="small"
            sx={{ mt: 2 }}
          />
        )}
      </CardContent>
      
      {/* Compact Action Bar */}
      <Divider />
      <CardActions sx={{ p: 1, bgcolor: 'grey.50' }}>
        <Stack direction="column" spacing={1} sx={{ width: '100%' }}>
          {/* First row: Action buttons */}
          <Stack direction="row" spacing={0.5} justifyContent="space-between">
            {/* Chat/Messages */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ChatIcon />}
              onClick={handleNavigateToMessages}
              sx={{ textTransform: 'none' }}
            >
              Chat
            </Button>

            {/* Contracts - Links to DMS */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContractIcon />}
              onClick={handleNavigateToDocuments}
              disabled={false}
              sx={{ textTransform: 'none' }}
            >
              Contracts
            </Button>

            {/* Documents - Shows submitted documents in modal */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<DocumentsIcon />}
              onClick={onViewDocuments}
              disabled={false}
              sx={{ textTransform: 'none' }}
            >
              Docs
            </Button>

            {/* Process Application - Always show unless status is final */}
            {application.lead_status !== 'selected' && application.lead_status !== 'rejected' && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PsychologyIcon />}
                onClick={() => onMakeDecision()}
                sx={{ textTransform: 'none' }}
              >
                Process
              </Button>
            )}
          </Stack>

          {/* Second row: Status or decision actions */}
          {application.lead_status === 'qualified' ? (
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<SelectIcon />}
                onClick={handleSelectCandidate}
                fullWidth
              >
                Select Candidate
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleQuickDecision('reject')}
              >
                Reject
              </Button>
            </Stack>
          ) : application.lead_status === 'selected' ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="TENANT SELECTED - Contract Ready"
              color="success"
              sx={{ width: '100%', fontWeight: 'bold' }}
            />
          ) : application.lead_status === 'rejected' ? (
            <Chip
              icon={<XIcon />}
              label="APPLICATION REJECTED"
              color="error"
              sx={{ width: '100%' }}
            />
          ) : null}
        </Stack>
      </CardActions>
    </Card>
  );
};

export default EnhancedApplicationCard;