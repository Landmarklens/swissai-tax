import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Paper,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Clear as ClearIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import faqService from '../../../services/faqService';
import { getFAQ } from '../../../constants/FAQ';
import './faq.scss';

const EnhancedFAQ = ({ initialUserType = 'tenant' }) => {
  const { t } = useTranslation();
  const [userType, setUserType] = useState(initialUserType);
  const [faqData, setFaqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Fetch FAQ data when user type changes
  useEffect(() => {
    loadFAQs();
  }, [userType]);

  const loadFAQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await faqService.getAllFAQs(userType);
      setFaqData(data);
      setSelectedCategory(null);
      setSearchResults(null);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      setError('Failed to load FAQs. Using offline data.');
      // Fallback to static FAQ for general questions
      const staticFAQ = getFAQ(t);
      setFaqData({
        title: t('faq.heading'),
        categories: staticFAQ.map(section => ({
          name: section.title,
          questions: section.questions.map((q, idx) => ({
            id: `static-${idx}`,
            question: q.question,
            answer: q.answer,
            bulletPoints: q.bulletPoints,
            detailedPoints: q.detailedPoints,
            conclusion: q.conclusion,
          }))
        }))
      });
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await faqService.searchFAQs(userType, searchQuery);
      setSearchResults(results);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Search failed:', err);
      // Perform local search as fallback
      if (faqData) {
        const localResults = [];
        faqData.categories.forEach(category => {
          category.questions.forEach(q => {
            if (
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              localResults.push({
                ...q,
                category: category.name
              });
            }
          });
        });
        setSearchResults(localResults);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleUserTypeChange = (event, newUserType) => {
    if (newUserType !== null) {
      setUserType(newUserType);
      setSearchQuery('');
      setSearchResults(null);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const renderAnswer = (question) => {
    return (
      <Box>
        {/* Main answer */}
        <Typography paragraph sx={{ mb: 2 }}>
          {t(question.answer)}
        </Typography>

        {/* Bullet points */}
        {question.bulletPoints && question.bulletPoints.length > 0 && (
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {question.bulletPoints.map((point, idx) => (
              <li key={idx}>
                <Typography variant="body2">{point}</Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Detailed points */}
        {question.detailedPoints && question.detailedPoints.length > 0 && (
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {question.detailedPoints.map((point, idx) => (
              <li key={idx}>
                <Typography variant="body2">
                  <strong>{point.title}</strong> {point.description}
                </Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Conclusion */}
        {question.conclusion && (
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText',
              borderRadius: 1 
            }}
          >
            {question.conclusion}
          </Typography>
        )}
      </Box>
    );
  };

  const displayData = useMemo(() => {
    if (searchResults) {
      return {
        title: `Search Results (${searchResults.length})`,
        categories: [{
          name: 'Search Results',
          questions: searchResults
        }]
      };
    }

    if (selectedCategory && faqData) {
      const category = faqData.categories.find(c => c.name === selectedCategory);
      return {
        title: selectedCategory,
        categories: category ? [category] : []
      };
    }

    return faqData;
  }, [faqData, searchResults, selectedCategory]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('Search for answers...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Category Filters */}
      {!searchResults && faqData && (
        <Box mb={4}>
          <Grid container spacing={2}>
            <Grid item>
              <Chip
                icon={<CategoryIcon />}
                label={t("All Categories")}
                onClick={() => setSelectedCategory(null)}
                color={!selectedCategory ? 'primary' : 'default'}
                variant={!selectedCategory ? 'filled' : 'outlined'}
              />
            </Grid>
            {faqData.categories.map((category) => (
              <Grid item key={category.name}>
                <Chip
                  label={`${t(category.name)} (${category.questions?.length || 0})`}
                  onClick={() => setSelectedCategory(category.name)}
                  color={selectedCategory === category.name ? 'primary' : 'default'}
                  variant={selectedCategory === category.name ? 'filled' : 'outlined'}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* FAQ Content */}
      {displayData && displayData.categories.map((category) => (
        <Box key={category.name} mb={4}>
          {!searchResults && !selectedCategory && (
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              {t(category.name)}
            </Typography>
          )}
          
          {category.questions && category.questions.map((question, qIndex) => (
            <Accordion
              key={question.id || `${category.name}-${qIndex}`}
              expanded={expanded === `${category.name}-${qIndex}`}
              onChange={handleAccordionChange(`${category.name}-${qIndex}`)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${category.name}-${qIndex}-content`}
                id={`panel-${category.name}-${qIndex}-header`}
              >
                <Box display="flex" alignItems="center" width="100%">
                  <QuestionAnswerIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {t(question.question)}
                  </Typography>
                  {searchResults && (
                    <Chip 
                      label={question.category} 
                      size="small" 
                      sx={{ ml: 2 }} 
                      color="secondary"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {renderAnswer(question)}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      {/* No Results Message */}
      {searchResults && searchResults.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            {t('No results found for')} "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('Try searching with different keywords')}
          </Typography>
        </Box>
      )}

      {/* Popular FAQs Section */}
      {!searchResults && !selectedCategory && (
        <Box mt={8} p={4} bgcolor="grey.50" borderRadius={2}>
          <Typography variant="h5" gutterBottom fontWeight="600">
            {t('Still have questions?')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {userType === 'tenant' 
              ? t('Contact our support team or browse our tenant guide for more information.')
              : t('Reach out to our landlord success team or check our property management resources.')
            }
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default EnhancedFAQ;