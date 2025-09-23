import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Tooltip,
  Divider,
  Rating,
  Stack
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Compare as CompareIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Groups as GroupsIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeIcon,
  Description as DocumentIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { generateAICards, selectTenant, rejectTenant } from '../../../../store/slices/tenantSelectionSlice';

const AICardView = ({ propertyId, onTenantSelected }) => {
  const dispatch = useDispatch();
  const { aiCards, loading, criteria } = useSelector((state) => state.tenantSelection);
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'compare', 'stack'
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'qualified', 'pending', 'rejected'
  const [sortBy, setSortBy] = useState('score'); // 'score', 'income', 'date'

  useEffect(() => {
    // Load AI cards on mount
    dispatch(generateAICards({ propertyId }));
  }, [dispatch, propertyId]);

  const handleRevealIdentity = (cardId) => {
    if (revealedCards.includes(cardId)) {
      setRevealedCards(revealedCards.filter(id => id !== cardId));
    } else {
      setRevealedCards([...revealedCards, cardId]);
    }
  };

  const handleSelectForComparison = (cardId) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSelectTenant = (card) => {
    setSelectedTenant(card);
    setShowConfirmDialog(true);
  };

  const handleConfirmSelection = async () => {
    if (selectedTenant) {
      await dispatch(selectTenant({
        propertyId,
        leadId: selectedTenant.lead_id,
        reason: 'Selected based on AI scoring and criteria match'
      }));
      
      if (onTenantSelected) {
        onTenantSelected(selectedTenant);
      }
    }
    setShowConfirmDialog(false);
  };

  const handleRejectTenant = async (card) => {
    await dispatch(rejectTenant({
      propertyId,
      leadId: card.lead_id,
      reason: 'Does not meet selection criteria'
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <TrendingUpIcon />;
    if (score >= 60) return <TrendingUpIcon />;
    return <TrendingDownIcon />;
  };

  const filteredCards = aiCards?.filter(card => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'qualified') return card.scores?.hard_filter_passed;
    if (filterStatus === 'pending') return card.status === 'pending';
    if (filterStatus === 'rejected') return card.status === 'rejected';
    return true;
  }) || [];

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'score') return (b.scores?.overall || 0) - (a.scores?.overall || 0);
    if (sortBy === 'income') return (b.financial?.monthly_income || 0) - (a.financial?.monthly_income || 0);
    if (sortBy === 'date') return new Date(b.applied_at) - new Date(a.applied_at);
    return 0;
  });

  const renderCard = (card, isCompareMode = false) => {
    const isRevealed = revealedCards.includes(card.id);
    const isSelected = selectedCards.includes(card.id);
    
    return (
      <Card 
        key={card.id}
        sx={{ 
          height: '100%',
          border: isSelected ? 2 : 0,
          borderColor: 'primary.main',
          position: 'relative'
        }}
      >
        {isSelected && !isCompareMode && (
          <Badge
            badgeContent={selectedCards.indexOf(card.id) + 1}
            color="primary"
            sx={{ position: 'absolute', top: 10, right: 10 }}
          />
        )}
        
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {card.anonymized_id?.substring(0, 2) || 'AP'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {isRevealed ? card.name : card.anonymized_id || `Applicant ${card.id?.substring(0, 6)}`}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Applied {new Date(card.applied_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            
            <IconButton onClick={() => handleRevealIdentity(card.id)} size="small">
              {isRevealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Box>
          
          {/* Overall Score */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Overall Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getScoreIcon(card.scores?.overall || 0)}
                <Typography 
                  variant="h4" 
                  color={`${getScoreColor(card.scores?.overall || 0)}.main`}
                >
                  {card.scores?.overall || 0}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={card.scores?.overall || 0}
              color={getScoreColor(card.scores?.overall || 0)}
              sx={{ mt: 1, height: 8, borderRadius: 1 }}
            />
          </Paper>
          
          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Income
                  </Typography>
                  <Typography variant="body2">
                    CHF {card.financial?.monthly_income?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Employment
                  </Typography>
                  <Typography variant="body2">
                    {card.employment?.type || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupsIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Household
                  </Typography>
                  <Typography variant="body2">
                    {card.household?.total_persons || 1} person(s)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Move-in
                  </Typography>
                  <Typography variant="body2">
                    {card.preferences?.move_in_date || 'Flexible'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {/* Strengths */}
          {card.strengths?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Strengths
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {card.strengths.map((strength, index) => (
                  <Chip
                    key={index}
                    label={strength}
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<CheckCircleIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Concerns */}
          {card.concerns?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Concerns
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {card.concerns.map((concern, index) => (
                  <Chip
                    key={index}
                    label={concern}
                    size="small"
                    color="warning"
                    variant="outlined"
                    icon={<WarningIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Criteria Match */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Criteria Match
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  {card.criteria_match?.pets ? 
                    <CheckIcon color="success" /> : 
                    <CloseIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText primary="Pets Policy" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {card.criteria_match?.smoking ? 
                    <CheckIcon color="success" /> : 
                    <CloseIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText primary="Smoking Policy" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {card.criteria_match?.income ? 
                    <CheckIcon color="success" /> : 
                    <CloseIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText primary="Income Requirements" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {card.documents?.complete ? 
                    <CheckIcon color="success" /> : 
                    <WarningIcon color="warning" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary="Documents" 
                  secondary={`${card.documents?.submitted || 0}/${card.documents?.required || 0} submitted`}
                />
              </ListItem>
            </List>
          </Box>
          
          {/* AI Recommendation */}
          {card.ai_recommendation && (
            <Alert severity={card.scores?.overall >= 70 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>AI Recommendation:</strong> {card.ai_recommendation}
              </Typography>
            </Alert>
          )}
          
          {/* Contact Info (if revealed) */}
          {isRevealed && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">{card.email}</Typography>
                </Box>
                {card.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">{card.phone}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </CardContent>
        
        <CardActions>
          {!isCompareMode && (
            <>
              <Button
                size="small"
                onClick={() => handleSelectForComparison(card.id)}
                disabled={selectedCards.length >= 3 && !isSelected}
              >
                {isSelected ? 'Remove' : 'Compare'}
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleRejectTenant(card)}
              >
                Reject
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleSelectTenant(card)}
              >
                Select
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            AI-Generated Applicant Cards
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="grid">Grid</ToggleButton>
              <ToggleButton value="compare" disabled={selectedCards.length < 2}>
                Compare ({selectedCards.length})
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={() => dispatch(generateAICards({ propertyId, regenerate: true }))}
            >
              Regenerate Cards
            </Button>
          </Box>
        </Box>
        
        <Alert severity="info">
          <Typography variant="body2">
            Cards are anonymized and scored using GPT-5 AI based on your selection criteria. 
            Click the eye icon to reveal applicant identity.
          </Typography>
        </Alert>
      </Paper>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={(e, newFilter) => newFilter && setFilterStatus(newFilter)}
              size="small"
            >
              <ToggleButton value="all">All ({aiCards?.length || 0})</ToggleButton>
              <ToggleButton value="qualified">Qualified</ToggleButton>
              <ToggleButton value="pending">Pending</ToggleButton>
              <ToggleButton value="rejected">Rejected</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(e, newSort) => newSort && setSortBy(newSort)}
              size="small"
            >
              <ToggleButton value="score">Score</ToggleButton>
              <ToggleButton value="income">Income</ToggleButton>
              <ToggleButton value="date">Date</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Cards Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress variant="indeterminate" sx={{ width: '50%' }} />
        </Box>
      ) : (
        <>
          {viewMode === 'grid' && (
            <Grid container spacing={3}>
              {sortedCards.map((card) => (
                <Grid item xs={12} md={6} lg={4} key={card.id}>
                  {renderCard(card)}
                </Grid>
              ))}
            </Grid>
          )}
          
          {viewMode === 'compare' && selectedCards.length >= 2 && (
            <Grid container spacing={3}>
              {selectedCards.map((cardId) => {
                const card = aiCards.find(c => c.id === cardId);
                return card ? (
                  <Grid item xs={12} md={selectedCards.length === 2 ? 6 : 4} key={cardId}>
                    {renderCard(card, true)}
                  </Grid>
                ) : null;
              })}
            </Grid>
          )}
        </>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Tenant Selection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to select {selectedTenant?.name || selectedTenant?.anonymized_id} as your tenant?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            An email will be automatically sent to notify the selected tenant and reject other applicants.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmSelection}>
            Confirm Selection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AICardView;