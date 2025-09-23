import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Fab,
  Badge,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Zoom,
  Fade,
  Slide
} from '@mui/material';
import {
  Chat as ChatIcon,
  Edit as FormIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Favorite as SavedIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  KeyboardArrowUp as ScrollTopIcon,
  AutoAwesome as AIIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Map as MapIcon,
  Notifications as NotificationIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Import enhanced components
import QuickFormCardEnhanced from '../Chat/AIChat/QuickFormCard/QuickFormCardEnhanced';
import ConversationProgressEnhanced from '../Chat/AIChat/ConversationProgress/ConversationProgressEnhanced';
import RecommendationCardEnhanced from '../Chat/AIChat/RecommendationsList/RecommendationCardEnhanced/RecommendationCardEnhanced';
import AiChat from '../Chat/AIChat/AIChat';

// Import standard components
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchRecommendations,
  clearRecommendations
} from '../../store/slices/recommendationsSlice';
import {
  getConversationHistory,
  setActiveConversationId
} from '../../store/slices/conversationsSlice';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';

const TenantSearchExperience = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Redux state
  const user = useSelector(state => state.auth.user);
  const recommendations = useSelector(state => state.recommendations.recommendations);
  const isGenerating = useSelector(state => state.recommendations.isGenerating);
  const conversationId = useSelector(state => state.conversations.activeConversationId);
  const insights = useSelector(state => state.conversations.insights);
  const profileProgress = useSelector(state => state.conversations.profileProgress);

  // Local state
  const [searchMode, setSearchMode] = useState('smart'); // 'smart', 'form', 'chat'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const mainContentRef = useRef(null);
  const resultsRef = useRef(null);

  // Check if user is new
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('tenantOnboardingCompleted');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        setShowScrollTop(mainContentRef.current.scrollTop > 300);
      }
    };

    const contentElement = mainContentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Load saved properties count
  useEffect(() => {
    // Fetch saved properties count from API
    // This is a placeholder - implement actual API call
    setSavedCount(3);
  }, []);

  const handleSearchModeChange = (event, newMode) => {
    if (newMode) {
      setSearchMode(newMode);
      if (newMode === 'smart') {
        // Smart mode shows both form and chat options
        setShowProgress(true);
      }
    }
  };

  const handleFormSubmit = async (formData, insights) => {
    // Process form submission
    console.log('Form submitted:', formData, insights);

    // Fetch recommendations based on form data
    dispatch(fetchRecommendations({
      conversationId,
      insights,
      preferences: formData
    }));

    // Scroll to results
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChatMessage = (message) => {
    // Handle chat messages
    setChatMessages(prev => [...prev, message]);
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('tenantOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getProgressPercentage = () => {
    if (profileCompleted) return 100;
    if (!insights || insights.length === 0) return 0;

    // Calculate based on insights
    const requiredCategories = ['location', 'budget', 'property', 'timing'];
    const completedCategories = requiredCategories.filter(cat =>
      insights.some(i => i.category === cat || i.step?.toLowerCase().includes(cat))
    );

    return Math.round((completedCategories.length / requiredCategories.length) * 100);
  };

  const progressPercentage = profileProgress || getProgressPercentage();

  // Onboarding Dialog
  const OnboardingDialog = () => (
    <Dialog
      open={showOnboarding}
      onClose={handleCompleteOnboarding}
      maxWidth="md"
      fullWidth
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 4,
            color: 'white',
            textAlign: 'center'
          }}
        >
          <AIIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome to Your Home Search Journey!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            We've reimagined how you find your perfect home in Switzerland
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <ChatIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chat naturally with our AI to describe your dream home. It understands your needs and preferences.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <FormIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Quick Form
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prefer forms? Fill out our smart form with just the essentials. Takes less than 2 minutes!
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <AIIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Smart Matching
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI analyzes 100+ factors to find homes that truly match your lifestyle and needs.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Choose How You'd Like to Start
            </Typography>
            <ToggleButtonGroup
              value={searchMode}
              exclusive
              onChange={handleSearchModeChange}
              sx={{ mt: 2 }}
            >
              <ToggleButton value="smart" sx={{ px: 3 }}>
                <AIIcon sx={{ mr: 1 }} />
                Smart Mode (Recommended)
              </ToggleButton>
              <ToggleButton value="form" sx={{ px: 3 }}>
                <FormIcon sx={{ mr: 1 }} />
                Quick Form
              </ToggleButton>
              <ToggleButton value="chat" sx={{ px: 3 }}>
                <ChatIcon sx={{ mr: 1 }} />
                AI Chat
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCompleteOnboarding}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  py: 1.5
                }}
              >
                Start Finding My Home
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <LoggedInLayout>
      <SEOHelmet
        title="Find Your Perfect Home - HomeAI"
        description="Discover your dream home in Switzerland with AI-powered search"
      />

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Sidebar for desktop */}
        {!isMobile && (
          <Paper
            sx={{
              width: 280,
              borderRadius: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">
                Home Search
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.name || 'Guest'} • {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
              {/* Search Mode Selector */}
              <Typography variant="subtitle2" gutterBottom>
                Search Mode
              </Typography>
              <ToggleButtonGroup
                value={searchMode}
                exclusive
                onChange={handleSearchModeChange}
                orientation="vertical"
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="smart">
                  <AIIcon sx={{ mr: 1 }} />
                  Smart Search
                </ToggleButton>
                <ToggleButton value="form">
                  <FormIcon sx={{ mr: 1 }} />
                  Form Mode
                </ToggleButton>
                <ToggleButton value="chat">
                  <ChatIcon sx={{ mr: 1 }} />
                  Chat Mode
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Quick Stats */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Profile
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {progressPercentage}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Matches
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {recommendations?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Saved
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {savedCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Viewed
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      12
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Quick Actions */}
              <Typography variant="subtitle2" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SavedIcon />}
                  onClick={() => setSidebarOpen(true)}
                >
                  Saved Properties ({savedCount})
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                >
                  Search History
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<NotificationIcon />}
                >
                  Alerts & Updates
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                >
                  Preferences
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="text"
                startIcon={<HelpIcon />}
                onClick={() => setShowOnboarding(true)}
              >
                Help & Tutorial
              </Button>
            </Box>
          </Paper>
        )}

        {/* Main Content */}
        <Box
          ref={mainContentRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: 'grey.50'
          }}
        >
          <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Mobile Header */}
            {isMobile && (
              <AppBar position="sticky" color="default" elevation={0}>
                <Toolbar>
                  <IconButton edge="start" onClick={() => setSidebarOpen(true)}>
                    <FilterIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    Find Home
                  </Typography>
                  <IconButton>
                    <Badge badgeContent={savedCount} color="error">
                      <SavedIcon />
                    </Badge>
                  </IconButton>
                </Toolbar>
              </AppBar>
            )}

            {/* Progress Section */}
            {showProgress && progressPercentage < 100 && (
              <Fade in timeout={500}>
                <Box sx={{ mb: 3 }}>
                  <ConversationProgressEnhanced
                    progress={progressPercentage}
                    profileCompleted={profileCompleted}
                    completedSteps={['location', 'budget']}
                    currentStep="property"
                    insights={insights}
                    mode={searchMode === 'form' ? 'form' : 'conversation'}
                  />
                </Box>
              </Fade>
            )}

            {/* Search Interface based on mode */}
            {searchMode === 'smart' && (
              <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Let's Find Your Perfect Home
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Choose your preferred way to search. You can switch anytime!
                  </Typography>

                  <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} centered>
                    <Tab label="Quick Form" icon={<FormIcon />} iconPosition="start" />
                    <Tab label="AI Chat" icon={<ChatIcon />} iconPosition="start" />
                  </Tabs>
                </Paper>

                <Box sx={{ mt: 3 }}>
                  {activeTab === 0 ? (
                    <QuickFormCardEnhanced onSubmit={handleFormSubmit} />
                  ) : (
                    <Paper sx={{ p: 3, minHeight: 400 }}>
                      <AiChat
                        handleChangeMessage={handleChatMessage}
                        message=""
                        embedded
                      />
                    </Paper>
                  )}
                </Box>
              </Box>
            )}

            {searchMode === 'form' && (
              <QuickFormCardEnhanced onSubmit={handleFormSubmit} />
            )}

            {searchMode === 'chat' && (
              <Paper sx={{ p: 3, minHeight: 500 }}>
                <AiChat
                  handleChangeMessage={handleChatMessage}
                  message=""
                  embedded
                />
              </Paper>
            )}

            {/* Results Section */}
            <Box ref={resultsRef}>
              {isGenerating && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 3 }}>
                    Finding your perfect homes...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our AI is analyzing thousands of properties
                  </Typography>
                </Box>
              )}

              {!isGenerating && recommendations && recommendations.length > 0 && (
                <>
                  {/* Results Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 3
                    }}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {recommendations.length} Properties Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sorted by AI match score
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, v) => v && setViewMode(v)}
                      >
                        <ToggleButton value="grid">
                          <GridIcon />
                        </ToggleButton>
                        <ToggleButton value="list">
                          <ListIcon />
                        </ToggleButton>
                        <ToggleButton value="map">
                          <MapIcon />
                        </ToggleButton>
                      </ToggleButtonGroup>

                      <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        Filters
                      </Button>
                    </Box>
                  </Box>

                  {/* Results Grid */}
                  <Grid container spacing={3}>
                    {recommendations.map(recommendation => (
                      <Grid
                        item
                        xs={12}
                        sm={viewMode === 'list' ? 12 : 6}
                        md={viewMode === 'list' ? 12 : 4}
                        key={recommendation.id}
                      >
                        <RecommendationCardEnhanced
                          recommendation={recommendation}
                          isEnriched={true}
                          conversationId={conversationId}
                          variant={viewMode === 'list' ? 'compact' : 'default'}
                          onViewDetails={() => console.log('View details:', recommendation.id)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {!isGenerating && (!recommendations || recommendations.length === 0) && progressPercentage > 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    No properties found yet
                  </Typography>
                  <Typography variant="body2">
                    Complete your profile to see personalized recommendations
                  </Typography>
                </Alert>
              )}
            </Box>
          </Container>
        </Box>

        {/* Scroll to Top Button */}
        <Zoom in={showScrollTop}>
          <Fab
            color="primary"
            size="small"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
            onClick={scrollToTop}
          >
            <ScrollTopIcon />
          </Fab>
        </Zoom>

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={sidebarOpen && isMobile}
          onClose={() => setSidebarOpen(false)}
        >
          <Box sx={{ width: 280, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Menu</Typography>
              <IconButton onClick={() => setSidebarOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {/* Add mobile menu content here */}
          </Box>
        </Drawer>
      </Box>

      {/* Onboarding Dialog */}
      <OnboardingDialog />
    </LoggedInLayout>
  );
};

export default TenantSearchExperience;