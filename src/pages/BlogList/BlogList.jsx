import React, { useState } from 'react';
import {
  Container,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import Layout from '../Layout/Layout';
import { theme } from '../../theme/theme';
import { blogPosts } from '../../blogData';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '../../components/SEO/SEOHelmet';
const categories = ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))];

const BlogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const heading = 'Blog';
  const text = "Stay ahead of the curve with our team's real estate updates.";
  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const handlePostClick = (postId, category) => {
    navigate(`/blog?id=${postId}&type=${category}`);
  };

  return (
    <>
      <SEOHelmet
        titleKey="meta.blog.title"
        descriptionKey="meta.blog.description"
      />
      <Layout heading={heading} text={text}>
        <Box>
          <Container>
            <Grid container spacing={2} justifyContent="center" my={3}>
              {categories.map((category, index) => (
                <Grid item key={index}>
                  <Button
                    sx={{
                      color: selectedCategory === category ? '' : theme.palette.text.secondary,
                      backgroundColor:
                        selectedCategory === category ? theme.palette.background.skyBlue : '',
                      fontWeight: 400,
                      py: 0.5,
                      px: 1,
                      borderRadius: '100px'
                    }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2}>
              {filteredPosts.map((post) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                  key={post.id}
                  onClick={() => handlePostClick(post.id, post.category)}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: '100%',
                      boxShadow: 'none',
                      border: `1.5px solid ${theme.palette.border.blue}`
                    }}
                  >
                    <CardMedia component="img" height="200px" image={post.image} alt={post.title} />
                    <CardContent>
                      <Typography
                        sx={{
                          backgroundColor: theme.palette.background.skyBlue,
                          width: '50px',
                          fontSize: '12px',
                          color: 'black',
                          fontWeight: 500,
                          textAlign: 'center',
                          borderRadius: '100px',
                          py: 0.5,
                          px: 1
                        }}
                      >
                        {post.category}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'black',
                          fontSize: '16px',
                          fontWeight: 550,
                          pt: 1
                        }}
                      >
                        {post.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Layout>
    </>
  );
};

export default BlogPage;
