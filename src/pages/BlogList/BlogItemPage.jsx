import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Container,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import Layout from '../Layout/Layout';
import { theme } from '../../theme/theme';
import { blogPosts } from '../../blogData';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const BlogItemPage = () => {
  const { t } = useTranslation();
  const [blogPost, setBlogPost] = useState(null);
  const [popularPosts, setPopularPosts] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const text = 'Managing Rental Properties: Tips and Best Practices';
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParts = location.search.split('id=');
    const urlParts2 = location.search.split('type=');
    const id = urlParts[1] ? parseInt(urlParts[1]) : null;
    const category = urlParts2[1] ? urlParts2[1] : null;

    if (id) {
      const index = blogPosts.findIndex((post) => post.id === id);
      if (index !== -1) {
        setBlogPost(blogPosts[index]);
        // setCurrentIndex(index);
      }
    }
    const filteredPosts = category
      ? blogPosts.filter((post) => post.category === category)
      : blogPosts;
    const index = filteredPosts.findIndex((post) => post.id === id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
    setPopularPosts(filteredPosts.slice(0, 4));
  }, [location]);

  // const popularPosts = blogPosts.slice(0, 4);

  const handleBack = () => {
    navigate('/blog-list');
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + popularPosts.length) % popularPosts.length;
    navigate(`/blog?id=${popularPosts[prevIndex].id}&type=${popularPosts[prevIndex].category}`);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % popularPosts.length;
    navigate(`/blog?id=${popularPosts[nextIndex].id}&type=${popularPosts[nextIndex].category}`);
  };

  const handlePostClick = (postId) => {
    navigate(`/blog?id=${postId}`);
  };

  const shareTo = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blogPost?.title || '');
    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'instagram':
        shareLink = `https://www.instagram.com/?url=${url}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'pinterest':
        shareLink = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
        break;
      default:
        shareLink = url;
    }

    window.open(shareLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* TODO: Implement dynamic SEO based on content - Dynamic title based on blog post */}
      <SEOHelmet
        title={blogPost?.title || "Blog Post - HomeAI"}
        description={blogPost?.excerpt || "Read the latest insights and updates from HomeAI"}
      />
      <Layout id="BlogItemPage" text={text}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Button
              startIcon={<ArrowBackIosNewIcon sx={{ width: '16px' }} />}
              onClick={handleBack}
              sx={{ color: 'text.primary', fontSize: '12px' }}
            >
              {t('Back')}
            </Button>
            <Box>
              <Button
                startIcon={<ArrowBackIosNewIcon sx={{ width: '16px' }} />}
                onClick={handlePrevious}
                sx={{ color: 'text.primary', mr: 1, fontSize: '12px' }}
              >
                {t('Previous')}
              </Button>
              <Button
                endIcon={<ArrowForwardIosIcon sx={{ width: '16px' }} />}
                onClick={handleNext}
                sx={{ color: 'text.primary', fontSize: '12px' }}
              >
                {t('Next')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box>
        {blogPost && (
          <>
            <Container id="BlogPostContainer" maxWidth="md">
              <Box
                sx={{
                  display: 'grid',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '24px',
                      pt: '20px',
                      paddingRight: '20px'
                    }}
                  >
                    <MuiLink onClick={() => shareTo('facebook')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 3C3.897 3 3 3.897 3 5V19C3 20.103 3.897 21 5 21H11.6211H14.4141H19C20.103 21 21 20.103 21 19V5C21 3.897 20.103 3 19 3H5ZM5 5H19L19.002 19H14.4141V15.0352H16.7793L17.1309 12.3105H14.4297V10.5742C14.4297 9.78622 14.6493 9.25391 15.7793 9.25391H17.207V6.82227C16.512 6.75127 15.8142 6.71675 15.1152 6.71875C13.0412 6.71875 11.6211 7.98459 11.6211 10.3086V12.3145H9.27734V15.0391H11.6211V19H5V5Z"
                          fill="#828282"
                        />
                      </svg>
                    </MuiLink>
                    <MuiLink onClick={() => shareTo('instagram')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 3C5.243 3 3 5.243 3 8V16C3 18.757 5.243 21 8 21H16C18.757 21 21 18.757 21 16V8C21 5.243 18.757 3 16 3H8ZM8 5H16C17.654 5 19 6.346 19 8V16C19 17.654 17.654 19 16 19H8C6.346 19 5 17.654 5 16V8C5 6.346 6.346 5 8 5ZM17 6C16.7348 6 16.4804 6.10536 16.2929 6.29289C16.1054 6.48043 16 6.73478 16 7C16 7.26522 16.1054 7.51957 16.2929 7.70711C16.4804 7.89464 16.7348 8 17 8C17.2652 8 17.5196 7.89464 17.7071 7.70711C17.8946 7.51957 18 7.26522 18 7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6ZM12 7C9.243 7 7 9.243 7 12C7 14.757 9.243 17 12 17C14.757 17 17 14.757 17 12C17 9.243 14.757 7 12 7ZM12 9C13.654 9 15 10.346 15 12C15 13.654 13.654 15 12 15C10.346 15 9 13.654 9 12C9 10.346 10.346 9 12 9Z"
                          fill="#828282"
                        />
                      </svg>
                    </MuiLink>
                    <MuiLink onClick={() => shareTo('linkedin')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 3C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3H5ZM5 5H19V19H5V5ZM7.7793 6.31641C6.9223 6.31641 6.4082 6.83158 6.4082 7.51758C6.4082 8.20358 6.92236 8.7168 7.69336 8.7168C8.55036 8.7168 9.06445 8.20358 9.06445 7.51758C9.06445 6.83158 8.5503 6.31641 7.7793 6.31641ZM6.47656 10V17H9V10H6.47656ZM11.082 10V17H13.6055V13.1738C13.6055 12.0348 14.4181 11.8711 14.6621 11.8711C14.9061 11.8711 15.5586 12.1158 15.5586 13.1738V17H18V13.1738C18 10.9768 17.0237 10 15.8027 10C14.5817 10 13.9305 10.4066 13.6055 10.9766V10H11.082Z"
                          fill="#828282"
                        />
                      </svg>
                    </MuiLink>
                    <MuiLink onClick={() => shareTo('twitter')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <mask
                          id="mask0_664_26874"
                          // style="mask-type:alpha"
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="24"
                          height="24"
                        >
                          <rect width="24" height="24" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_664_26874)">
                          <path
                            d="M6.30775 22.5004C5.80258 22.5004 5.375 22.3254 5.025 21.9754C4.675 21.6254 4.5 21.1978 4.5 20.6927V10.3082C4.5 9.80301 4.675 9.37543 5.025 9.02543C5.375 8.67543 5.80258 8.50043 6.30775 8.50043H8.86525V10.0004H6.30775C6.23075 10.0004 6.16025 10.0325 6.09625 10.0967C6.03208 10.1607 6 10.2312 6 10.3082V20.6927C6 20.7697 6.03208 20.8402 6.09625 20.9042C6.16025 20.9683 6.23075 21.0004 6.30775 21.0004H17.6923C17.7692 21.0004 17.8398 20.9683 17.9038 20.9042C17.9679 20.8402 18 20.7697 18 20.6927V10.3082C18 10.2312 17.9679 10.1607 17.9038 10.0967C17.8398 10.0325 17.7692 10.0004 17.6923 10.0004H15.1348V8.50043H17.6923C18.1974 8.50043 18.625 8.67543 18.975 9.02543C19.325 9.37543 19.5 9.80301 19.5 10.3082V20.6927C19.5 21.1978 19.325 21.6254 18.975 21.9754C18.625 22.3254 18.1974 22.5004 17.6923 22.5004H6.30775ZM11.25 15.7504V4.71968L9.4 6.56968L8.34625 5.50043L12 1.84668L15.6538 5.50043L14.6 6.56968L12.75 4.71968V15.7504H11.25Z"
                            fill="#828282"
                          />
                        </g>
                      </svg>
                    </MuiLink>
                    <MuiLink onClick={() => shareTo('pinterest')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <mask
                          id="mask0_664_26881"
                          // style="mask-type:alpha"
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="24"
                          height="24"
                        >
                          <rect width="24" height="24" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_664_26881)">
                          <path
                            d="M6.26925 3.9043H16.7885V15.904L10.1538 22.5003L9.30775 21.654C9.20392 21.5502 9.11767 21.4127 9.049 21.2415C8.9805 21.0704 8.94625 20.9092 8.94625 20.758V20.504L10.0078 15.904H3.30775C2.83208 15.904 2.41192 15.7217 2.04725 15.357C1.68242 14.9922 1.5 14.572 1.5 14.0965V12.481C1.5 12.3772 1.5135 12.265 1.5405 12.1445C1.56733 12.024 1.59742 11.9119 1.63075 11.808L4.49625 5.04655C4.63975 4.72605 4.88008 4.45555 5.21725 4.23505C5.55442 4.01455 5.90508 3.9043 6.26925 3.9043ZM15.2885 5.4043H6.26925C6.19875 5.4043 6.12667 5.42346 6.053 5.4618C5.97917 5.5003 5.923 5.56446 5.8845 5.6543L3 12.4043V14.0965C3 14.1862 3.02883 14.2599 3.0865 14.3175C3.14417 14.3754 3.21792 14.4043 3.30775 14.4043H11.9038L10.65 19.885L15.2885 15.2658V5.4043ZM16.7885 15.904V14.4043H20V5.4043H16.7885V3.9043H21.5V15.904H16.7885Z"
                            fill="#828282"
                          />
                        </g>
                      </svg>
                    </MuiLink>
                    <MuiLink onClick={() => shareTo('whatsapp')} sx={{ cursor: 'pointer' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <mask
                          id="mask0_664_26878"
                          // style="mask-type:alpha"
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="24"
                          height="24"
                        >
                          <rect width="24" height="24" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_664_26878)">
                          <path
                            d="M17.7308 20.5003H7.2115V8.5003L13.8462 1.9043L14.6923 2.7503C14.7961 2.85413 14.8823 2.99163 14.951 3.1628C15.0195 3.33396 15.0538 3.49521 15.0538 3.64655V3.9003L13.9923 8.5003H20.6923C21.1679 8.5003 21.5881 8.68271 21.9527 9.04755C22.3176 9.41221 22.5 9.83238 22.5 10.308V11.9233C22.5 12.0271 22.4865 12.1393 22.4595 12.2598C22.4327 12.3803 22.4026 12.4925 22.3693 12.5965L19.5038 19.358C19.3603 19.6785 19.1199 19.949 18.7828 20.1695C18.4456 20.39 18.0949 20.5003 17.7308 20.5003ZM8.7115 19.0003H17.7308C17.8013 19.0003 17.8733 18.981 17.947 18.9425C18.0208 18.904 18.077 18.84 18.1155 18.7503L21 12.0003V10.308C21 10.2182 20.9712 10.1445 20.9135 10.0868C20.8558 10.0291 20.7821 10.0003 20.6923 10.0003H12.0963L13.35 4.51955L8.7115 9.1388V19.0003ZM7.2115 8.5003V10.0003H4V19.0003H7.2115V20.5003H2.5V8.5003H7.2115Z"
                            fill="#828282"
                          />
                        </g>
                      </svg>
                    </MuiLink>
                  </Box>
                  <CardMedia
                    component="img"
                    width="100%"
                    height="auto"
                    image={blogPost.image}
                    alt={blogPost.title}
                    sx={{
                      borderRadius: '6px',
                      maxHeight: '480px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '30px 48px',
                    gap: '24px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '22px',
                      color: 'black',
                      fontWeight: 500
                    }}
                  >
                    {t(blogPost.subTitle)}
                  </Typography>
                  {blogPost?.contentList && (
                    <Box sx={{ display: 'grid', gap: '24px' }}>
                      {blogPost.contentList.map((item, index) => (
                        <Box key={index} sx={{ lineHeight: 1.6 }}>
                          {item.title && (
                            <Typography variant="h6" gutterBottom>
                              {t(item.title)}
                            </Typography>
                          )}
                          {item?.text &&
                            Array.isArray(item.text) &&
                            item.text.map((text, idx) => {
                              if (typeof text === 'string') {
                                return (
                                  <ReactMarkdown
                                    key={idx}
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ node, ...props }) => (
                                        <Typography paragraph {...props} />
                                      ),
                                      h1: ({ node, ...props }) => (
                                        <Typography variant="h4" gutterBottom {...props} />
                                      ),
                                      h2: ({ node, ...props }) => (
                                        <Typography variant="h5" gutterBottom {...props} />
                                      )
                                    }}
                                  >
                                    {text}
                                  </ReactMarkdown>
                                );
                              } else if (text.points) {
                                return (
                                  <List key={idx} sx={{ listStyle: 'disc', pl: 3 }}>
                                    {text.points.map((point, pointIndex) => (
                                      <ListItem
                                        key={`point-${pointIndex}`}
                                        sx={{ display: 'list-item', lineHeight: 1.6 }}
                                      >
                                        {point}
                                      </ListItem>
                                    ))}
                                  </List>
                                );
                              }
                              return null;
                            })}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Container>
            <Container maxWidth="xl">
              <Box>
                <Typography
                  sx={{
                    fontSize: '22px',
                    color: 'black',
                    fontWeight: 500,
                    marginBottom: '20px'
                  }}
                >
                  {t('Related Articles')}
                </Typography>
                <Grid id="Related Articles" container spacing={2}>
                  {popularPosts.map((post) => (
                    <Grid item xs={12} sm={6} md={3} key={post.id}>
                      <RouterLink
                        to={`/blog?id=${post.id}&type=${post.category}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Card
                          sx={{
                            width: '100%',
                            height: '100%',
                            boxShadow: 'none',
                            border: `1.5px solid ${theme.palette.border.blue}`,
                            transition: 'transform 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="200px"
                            image={post.image}
                            alt={post.title}
                          />
                          <CardContent>
                            <Typography
                              sx={{
                                backgroundColor: theme.palette.background.skyBlue,
                                minWidth: '50px',
                                width: 'fit-content',
                                fontSize: '12px',
                                color: 'black',
                                fontWeight: 500,
                                textAlign: 'center',
                                borderRadius: '100px',
                                py: 0.5,
                                px: 1
                              }}
                            >
                              {t(post.category)}
                            </Typography>
                            <Typography
                              sx={{
                                color: 'black',
                                fontSize: '16px',
                                fontWeight: 550,
                                pt: 1
                              }}
                            >
                              {t(post.title)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </RouterLink>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Container>
          </>
        )}
      </Box>
      </Layout>
    </>
  );
};

export default BlogItemPage;
