import { Box, Container, Grid, Typography } from '@mui/material';
import React from 'react';
import { theme } from '../../theme/theme';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FacebookIcon from '@mui/icons-material/Facebook';
// import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import ImageComponent from '../Image/Image';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

const SOCIALS = [
  {
    icon: FacebookIcon,
    href: 'https://www.facebook.com/',
    color: '#4267B2'
  },
  {
    icon: TwitterIcon,
    href: 'https://x.com/',
    color: '#000'
  },
  {
    icon: LinkedInIcon,
    href: 'https://www.linkedin.com/',
    color: '#0A66C2'
  },
  {
    icon: InstagramIcon,
    href: 'https://www.instagram.com/',
    color: '#F56040'
  }
];

const StyledLink = styled(Link)`
  color: ${theme.palette.primary.footer};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: 0.2s all;
  &:hover {
    color: ${theme.palette.primary.light};
  }
`;

const Footer = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const outerBox = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    py: '32px'
  };

  const innerBox = {
    display: 'flex',
    flexGrow: 1,
    gap: '20px'
  };

  const iconStyle = {
    mr: 1,
    fontSize: '16px',
    color: '#202020',
    cursor: 'pointer'
  };

  const getSocialIconStyle = (color) => ({
    ...iconStyle,
    fontSize: '18px',
    transition: '.3s ease-in',
    color: '#666',
    '&:hover': {
      color: color ?? '#3F63EC'
    }
  });

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE5E8 100%)',
        borderTop: '1px solid rgba(255, 107, 107, 0.1)'
      }}>
      <Container maxWidth="xl">
        <Box>
          <Box sx={outerBox}>
            <Grid
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                rowGap: 2,
                columnGap: 2
              }}
              container>
              <Grid item xs={12} sm={12} md={4} lg={2.3}>
                <Box sx={{
                  ...innerBox,
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mb: { xs: 2, md: 0 }
                }}>
                  <Link to={`/${currentLang}`} style={{ textDecoration: 'none' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '28px',
                        color: '#DC0018',
                        fontFamily: 'SF Pro Display',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      Swiss<Box component="span" sx={{ color: '#003DA5' }}>Tax</Box>
                    </Typography>
                  </Link>
                </Box>
              </Grid>

                <Grid item xs={12} sm={12} md={6} lg="auto">
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: '15px', md: '20px' },
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      justifyContent: { xs: 'center', md: 'center' },
                      width: '100%',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'center' },
                      mb: { xs: 2, md: 0 }
                    }}>
                    <Box sx={{
                      display: 'flex',
                      gap: { xs: '15px', sm: '20px' },
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <StyledLink to={`/${currentLang}/features`}>{t('Features')}</StyledLink>
                      <StyledLink to={`/${currentLang}/security`}>{t('Security')}</StyledLink>
                      <StyledLink to={`/${currentLang}/contact-us`}>{t('Contact Us')}</StyledLink>
                      <StyledLink to={`/${currentLang}/plan`}>{t('Pricing')}</StyledLink>
                      <StyledLink to={`/${currentLang}/blog-list`}>{t('Blog')}</StyledLink>
                      <StyledLink to={`/${currentLang}/faq`}>{t('FAQ')}</StyledLink>
                      <StyledLink to={`/${currentLang}/status`}>{t('Status')}</StyledLink>
                    </Box>
                    <Typography
                      sx={{
                        color: '#666666',
                        fontSize: '14px',
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        mt: { xs: 2, sm: 0 },
                        textAlign: 'center'
                      }}>
                      © SwissTax - Made in Switzerland with ❤️
                    </Typography>
                  </Box>
                </Grid>

              <Grid item xs={12} sm={12} md={4} lg={2}>
                <Box
                  sx={{
                    ...innerBox,
                    gap: '5px',
                    display: 'flex',
                    justifyContent: { xs: 'center', md: 'flex-end' },
                    flexDirection: 'column',
                    alignItems: { xs: 'center', md: 'flex-start' },
                    mt: { xs: 2, md: 0 }
                  }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      color: 'black',
                      fontWeight: 500,
                      cursor: 'auto',
                      textAlign: { xs: 'center', md: 'left' }
                    }}>
                    {t('Have questions?')}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    <EmailIcon sx={{ ...iconStyle, cursor: 'auto' }} />
                    <StyledLink to="mailto:contact@swisstax.ch">contact@swisstax.ch</StyledLink>
                  </Box>


                  {/* <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2
                    }}>
                    <Typography sx={{ ...linkStyle, mr: 1, fontSize: '14px', cursor: 'auto' }}>
                      {t('Follow Us:')}
                    </Typography>
                    {SOCIALS.map(({ color, href, icon: Icon }) => (
                      <a href={href} target="_black">
                        <Icon sx={{ ...getSocialIconStyle(color) }} />
                      </a>
                    ))}
                  </Box> */}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          // backgroundColor: theme.palette.background.lightBlue,
          borderTop: '1px solid #ddd',
          height: '50px',
          gap: 2
        }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Box
              sx={{
                [theme.breakpoints.down('sm')]: {
                  display: 'none'
                }
              }}>
              <Typography
                noWrap={true}
                sx={{
                  fontSize: '12px'
                }}>
                {t('© Copyright 2025, All Rights Reserved')}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                color: theme.palette.primary,
                rowGap: 0.5,
                columnGap: 2,
                flexWrap: 'wrap'
              }}>
              <StyledLink to={`/${currentLang}/status`} style={{ fontSize: '12px' }}>
                {t('Status')}
              </StyledLink>
              <StyledLink to={`/${currentLang}/security`} style={{ fontSize: '12px' }}>
                {t('Security')}
              </StyledLink>
              <StyledLink to={`/${currentLang}/privacy-policy`} style={{ fontSize: '12px' }}>
                {t('Privacy Policy')}
              </StyledLink>
              <StyledLink to={`/${currentLang}/terms-and-conditions`} style={{ fontSize: '12px' }}>
                {t('Terms and Conditions')}
              </StyledLink>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
