import React from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import revolutionize from '../../../assets/mission-statements/1.svg';
import power from '../../../assets/mission-statements/2.svg';
import unleash from '../../../assets/mission-statements/3.svg';
import renting from '../../../assets/mission-statements/4.svg';
import personalize from '../../../assets/mission-statements/5.svg';
import equip from '../../../assets/mission-statements/6.svg';
import boost from '../../../assets/mission-statements/7.svg';
import driven from '../../../assets/mission-statements/8.svg';
import { useTranslation } from 'react-i18next';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  gap: '24px',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  backgroundColor: '#fff',
  border: '1px solid #C1D0FF',
  borderRadius: '4px',
  boxShadow: 'none',
  color: '#202020'
}));

const MissionStatements = () => {
  const { t } = useTranslation();

  const missionStatements = [
    {
      title: t('mission_statements_1'),
      description: t('mission_statements_1_desc'),
      logo: revolutionize
    },
    {
      title: t('mission_statements_2'),
      description: t('mission_statements_2_desc'),
      logo: power
    },
    {
      title: t('mission_statements_3'),
      description: t('mission_statements_3_desc'),
      logo: unleash
    },
    {
      title: t('mission_statements_4'),
      description: t('mission_statements_4_desc'),
      logo: renting
    },
    {
      title: t('mission_statements_5'),
      description: t('mission_statements_5_desc'),
      logo: personalize
    },
    {
      title: t('mission_statements_6'),
      description: t('mission_statements_6_desc'),
      logo: equip
    },
    {
      title: t('mission_statements_7'),
      description: t('mission_statements_7_desc'),
      logo: boost
    },
    {
      title: t('mission_statements_8'),
      description: t('mission_statements_8_desc'),
      logo: driven
    }
  ];

  return (
    <Box sx={{ pt: 6, pb: 10, backgroundColor: '#FFFFFF' }}>
      <Container maxWidth="xl">
        <Typography
          variant="h5"
          component="h2"
          align="center"
          fontWeight="700"
          fontSize={'35px'}
          color="#202020"
          gutterBottom>
          {t('Mission Statements')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            mt: 4,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            }
          }}>
          {missionStatements.map((statement, index) => (
            <StyledPaper key={index}>
              <Box
                sx={{
                  width: '32px',
                  height: '32px'
                }}>
                <Box component="img" src={statement.logo} alt="HomeAI" />
              </Box>
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                fontWeight="700"
                fontSize="20px"
                color="#202020">
                {statement.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statement.description}
              </Typography>
            </StyledPaper>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default MissionStatements;
