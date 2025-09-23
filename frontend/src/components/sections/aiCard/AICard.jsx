import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { theme } from '../../../theme/theme';
import { Link } from 'react-router-dom';
import image from '../../../assets/img.svg';
import { useTranslation } from 'react-i18next';

const AICard = ({
  background,
  buttonColor,
  elementColor,
  textColor,
  space = 16,
  isTenants,
  isOwners,
  isAbout,
  userType = 'tenant'
}) => {
  const { t } = useTranslation();

  return (
    <Container
      maxWidth={isAbout ? false : 'xl'}
      disableGutters={isAbout}
      sx={{
        padding: isAbout ? 0 : undefined
      }}
    >
      <Box
        sx={{
          backgroundColor: background,
          color: 'white',
          borderRadius: isAbout ? 0 : '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          mx: isAbout ? 0 : space,
          zIndex: 1,
          py: 8,
          pt: !isTenants && !isOwners ? '140px' : 8,
          [theme.breakpoints.down('sm')]: {
            mx: 0,
            borderRadius: '0px',
            py: 8
          }
        }}
      >
        <Box
          sx={{
            height: '90%',
            width: '15%',
            position: 'absolute',
            borderRadius: '0px 100% 0px 8px',
            background: elementColor,
            bottom: 0,
            left: 0,
            zIndex: -1
          }}
        ></Box>
        {!isTenants && !isOwners && (
          <Box
            component="img"
            src={image}
            alt="Background Image"
            sx={{
              position: 'absolute',
              top: '0',
              zIndex: '-1'
            }}
          />
        )}

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: textColor,
            fontWeight: 600,
            fontSize: '28px'
          }}
        >
          {userType === 'landlord' 
            ? (
              <>
                {t('Let AI Handle Your Property Management')} - <br />
                {t('Find Quality Tenants Faster Than Ever!')}
              </>
            )
            : (
              <>
                {t('Start Your Search with Our AI')} - <br />
                {t('Get Matched to Your Dream Apartment Today!')}
              </>
            )
          }
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to={userType === 'landlord' ? '/owner-account' : '/plan'}
          sx={{
            backgroundColor: buttonColor,
            color: 'white',
            marginTop: '20px',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          {userType === 'landlord' ? t('List Your Property') : t('Get Started')}
        </Button>

        <Box
          sx={{
            height: '90%',
            width: '15%',
            position: 'absolute',
            borderRadius: '100% 0px 8px 0px',
            background: elementColor,
            bottom: 0,
            right: 0,
            zIndex: -1
          }}
        ></Box>
      </Box>
    </Container>
  );
};

export default AICard;
