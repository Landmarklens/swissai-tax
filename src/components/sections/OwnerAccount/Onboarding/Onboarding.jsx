import { Box, Typography, Chip, Card, CardContent, CardMedia, Grid, InputBase, Paper, Badge, Fade, Grow } from '@mui/material';
import { useState, useMemo } from 'react';
import { landlordArticles } from '../../../../landlordArticles';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const tabs = ['All', ...Array.from(new Set(landlordArticles.map((post) => post.category)))];

// Category icons mapping
const categoryIcons = {
  'Getting Started': '🚀',
  'Tenant Management': '👥',
  'Property Management': '🏠',
  'Legal & Compliance': '📋',
  'AI Features': '🤖',
  'Legal & Automation': '⚖️',
  'Document Management': '📁',
  'Analytics & Insights': '📊',
  'Platform Features': '💡'
};

// Featured articles (IDs of articles to highlight)
const featuredArticleIds = [];

// Estimate reading time based on content length
const getReadingTime = (article) => {
  if (!article.contentList || !article.contentList[0]) return '5 min';
  const wordCount = article.contentList[0].text[0].split(' ').length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  return `${readingTime} min`;
};

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  const onClickTab = (val) => {
    setSelectedTab(val);
  };

  const handlePostClick = (postId, category) => {
    navigate(`/owner-account/onboarding/article/${postId}`);
  };

  // Filter posts based on category and search query
  const filteredPosts = useMemo(() => {
    let posts = selectedTab === 'All' ? landlordArticles : landlordArticles.filter((post) => post.category === selectedTab);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(post => {
        // Search in title, subtitle, and category
        if (post.title.toLowerCase().includes(query) ||
            post.subTitle.toLowerCase().includes(query) ||
            post.category.toLowerCase().includes(query)) {
          return true;
        }

        // Search in article content
        if (post.contentList && post.contentList.length > 0) {
          for (const content of post.contentList) {
            // Search in section titles
            if (content.title && content.title.toLowerCase().includes(query)) {
              return true;
            }
            // Search in section text
            if (content.text && Array.isArray(content.text)) {
              for (const paragraph of content.text) {
                if (paragraph.toLowerCase().includes(query)) {
                  return true;
                }
              }
            }
          }
        }

        return false;
      });
    }

    return posts;
  }, [selectedTab, searchQuery]);


  // Get article count by category
  const getCategoryCount = (category) => {
    if (category === 'All') return landlordArticles.length;
    return landlordArticles.filter(post => post.category === category).length;
  };

  return (
    <Box
      sx={{
        py: 4,
        px: 3,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
    >
      {/* Header Section */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '32px',
                  fontWeight: '600',
                  background: 'linear-gradient(90deg, #1F2D5C 0%, #4B5FA5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
                variant="h4"
              >
                {t('Landlord Knowledge Hub')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '16px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
                variant="body1"
              >
                <AutoStoriesIcon sx={{ fontSize: 20, color: '#4B5FA5' }} />
                Master HomeAI with {filteredPosts.length} comprehensive guides
              </Typography>
            </Box>

            {/* Search Bar */}
            <Paper
              elevation={0}
              sx={{
                p: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                width: 550,
                border: '2px solid #E0E7FF',
                borderRadius: '16px',
                background: '#FFF',
                '&:hover': {
                  borderColor: '#4B5FA5',
                  boxShadow: '0 4px 12px rgba(75, 95, 165, 0.15)'
                },
                '&:focus-within': {
                  borderColor: '#4B5FA5',
                  boxShadow: '0 4px 16px rgba(75, 95, 165, 0.2)'
                }
              }}
            >
              <SearchIcon sx={{ color: '#999', mr: 2, fontSize: 28 }} />
              <InputBase
                sx={{ ml: 1, flex: 1, fontSize: '18px' }}
                placeholder="Search knowledgebase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Typography sx={{ color: '#999', fontSize: 12 }}>
                  {filteredPosts.length} results
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Category Tabs */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mt: 3,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#C1D0FF',
              borderRadius: '10px',
            }
          }}>
            {tabs.map((tab, index) => (
              <Grow in timeout={300 * (index + 1)} key={tab}>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{tab}</span>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 12,
                          ml: 0.5,
                          backgroundColor: selectedTab === tab ? '#1F2D5C' : '#E0E7FF',
                          color: selectedTab === tab ? '#FFF' : '#4F4F4F',
                          px: 0.8,
                          py: 0.2,
                          borderRadius: '10px',
                          fontWeight: 600
                        }}
                      >
                        {getCategoryCount(tab)}
                      </Typography>
                    </Box>
                  }
                  onClick={() => onClickTab(tab)}
                  sx={{
                    px: 2,
                    py: 0.5,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: selectedTab === tab
                      ? 'linear-gradient(135deg, #4B5FA5 0%, #1F2D5C 100%)'
                      : '#FFF',
                    color: selectedTab === tab ? '#FFF' : '#4F4F4F',
                    border: selectedTab === tab ? 'none' : '1px solid #E0E7FF',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: selectedTab === tab
                        ? 'linear-gradient(135deg, #4B5FA5 0%, #1F2D5C 100%)'
                        : '#F5F7FF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(75, 95, 165, 0.15)'
                    }
                  }}
                />
              </Grow>
            ))}
          </Box>
        </Box>
      </Fade>


      {/* Articles Grid */}
      <Grid container spacing={3}>
        {filteredPosts.map((article, index) => (
          <Grid item xs={12} sm={6} md={4} key={article.id}>
            <Grow in timeout={300 + (index * 100)}>
              <Card
                onMouseEnter={() => setHoveredCard(article.id)}
                onMouseLeave={() => setHoveredCard(null)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: hoveredCard === article.id ? '#4B5FA5' : '#E0E7FF',
                  background: '#FFF',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredCard === article.id ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: hoveredCard === article.id
                    ? '0 20px 40px rgba(75, 95, 165, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    '& .article-image': {
                      transform: 'scale(1.05)'
                    },
                    '& .read-more': {
                      opacity: 1,
                      transform: 'translateX(0)'
                    }
                  }
                }}
                onClick={() => handlePostClick(article.id, article.category)}
              >
                {/* Image Section */}
                <Box sx={{ position: 'relative', overflow: 'hidden', height: 200 }}>
                  <CardMedia
                    component="div"
                    className="article-image"
                    sx={{
                      height: '100%',
                      backgroundImage: `url(${article.image})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      transition: 'transform 0.3s ease',
                      filter: hoveredCard === article.id ? 'brightness(1.1)' : 'brightness(1)'
                    }}
                  />
                  {/* Overlay Gradient */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
                    }}
                  />
                  {/* Category Badge */}
                  <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                    <Chip
                      icon={
                        <Typography sx={{ fontSize: 16 }}>
                          {categoryIcons[article.category] || '📄'}
                        </Typography>
                      }
                      label={article.category}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        fontWeight: 500,
                        fontSize: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  {/* New Badge for recent articles */}
                  {index < 3 && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                      <Badge
                        badgeContent={
                          <NewReleasesIcon sx={{ fontSize: 14 }} />
                        }
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#FF4757',
                            color: '#FFF',
                            padding: '4px',
                            borderRadius: '8px'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Content Section */}
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#1F2D5C',
                      mb: 1,
                      lineHeight: 1.3,
                      minHeight: '48px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    variant="h6"
                  >
                    {article.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14,
                      color: '#666',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '40px'
                    }}
                  >
                    {article.subTitle}
                  </Typography>

                  {/* Footer */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 2,
                    borderTop: '1px solid #F0F0F0'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                      <Typography sx={{ fontSize: 12, color: '#999' }}>
                        {getReadingTime(article)} read
                      </Typography>
                    </Box>
                    <Typography
                      className="read-more"
                      sx={{
                        fontSize: 14,
                        color: '#4B5FA5',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0,
                        transform: 'translateX(-10px)',
                        transition: 'all 0.3s ease',
                        '&::after': {
                          content: '"→"',
                          ml: 0.5
                        }
                      }}
                    >
                      Read More
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* No Results Message */}
      {filteredPosts.length === 0 && (
        <Fade in timeout={500}>
          <Box sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            backgroundColor: '#F5F7FF',
            borderRadius: '16px',
            mt: 4
          }}>
            <SearchIcon sx={{ fontSize: 64, color: '#C1D0FF', mb: 2 }} />
            <Typography sx={{ fontSize: 24, fontWeight: 600, color: '#1F2D5C', mb: 1 }}>
              No articles found
            </Typography>
            <Typography sx={{ fontSize: 16, color: '#666', mb: 3 }}>
              Try adjusting your search terms or browse all categories
            </Typography>
            <Chip
              label="Clear Search"
              onClick={() => {
                setSearchQuery('');
                setSelectedTab('All');
              }}
              sx={{
                px: 3,
                py: 1,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #4B5FA5 0%, #1F2D5C 100%)',
                color: '#FFF',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(75, 95, 165, 0.15)'
                }
              }}
            />
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default Onboarding;