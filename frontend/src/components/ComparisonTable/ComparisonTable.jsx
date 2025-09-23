import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(62, 99, 221, 0.1)',
  overflow: 'hidden',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#f8f9fb',
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1rem',
  color: theme.palette.text.primary,
  borderBottom: '2px solid rgba(62, 99, 221, 0.1)',
  textAlign: 'center',
  '&:first-of-type': {
    textAlign: 'left',
  }
}));

const FeatureCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '0.95rem',
  color: theme.palette.text.primary,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
}));

const CompareCell = styled(TableCell)(({ theme }) => ({
  textAlign: 'center',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
}));

const HighlightedColumn = styled(TableCell)(({ theme, highlight }) => ({
  backgroundColor: highlight ? 'rgba(62, 99, 221, 0.03)' : 'transparent',
  textAlign: 'center',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  position: 'relative',
}));

const RecommendedBadge = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 8px',
  }
}));

const ComparisonTable = () => {
  const { t } = useTranslation();

  const features = [
    {
      feature: t('Time to list property'),
      traditional: t('2-4 hours'),
      ai: t('5 minutes'),
    },
    {
      feature: t('Application screening'),
      traditional: t('Manual review'),
      ai: t('AI-powered instant scoring'),
    },
    {
      feature: t('Response time to inquiries'),
      traditional: t('Hours to days'),
      ai: t('Instant 24/7'),
    },
    {
      feature: t('Market price analysis'),
      traditional: { value: false },
      ai: { value: true, text: t('Real-time analytics') },
    },
    {
      feature: t('Document generation'),
      traditional: t('Manual creation'),
      ai: t('Automated templates'),
    },
    {
      feature: t('Tenant background checks'),
      traditional: t('Separate service'),
      ai: { value: true, text: t('Integrated') },
    },
    {
      feature: t('Viewing scheduling'),
      traditional: t('Back-and-forth emails'),
      ai: t('Smart calendar sync'),
    },
    {
      feature: t('Multi-channel management'),
      traditional: { value: false },
      ai: { value: true },
    },
    {
      feature: t('Performance tracking'),
      traditional: t('Basic or none'),
      ai: t('Detailed analytics'),
    },
    {
      feature: t('Average vacancy period'),
      traditional: t('30-45 days'),
      ai: t('18-25 days'),
    },
    {
      feature: t('Cost per property'),
      traditional: t('10-15% of rent'),
      ai: t('CHF 49/month'),
    },
  ];

  const renderCellContent = (content) => {
    if (typeof content === 'object' && content !== null) {
      if (content.value === true) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <CheckIcon sx={{ color: '#65BA74', fontSize: '1.5rem' }} />
            {content.text && (
              <Typography variant="body2" sx={{ color: '#65BA74', fontWeight: 500 }}>
                {content.text}
              </Typography>
            )}
          </Box>
        );
      } else if (content.value === false) {
        return <CloseIcon sx={{ color: '#ef4444', fontSize: '1.5rem' }} />;
      }
    }
    return (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {content}
      </Typography>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
        {t('Traditional vs AI-Powered Management')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
        {t('See how AI transforms property management efficiency')}
      </Typography>

      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <HeaderCell>{t('Feature')}</HeaderCell>
              <HeaderCell>{t('Traditional Management')}</HeaderCell>
              <HeaderCell>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t('HomeAI Platform')}
                  <RecommendedBadge label={t('RECOMMENDED')} size="small" />
                </Box>
              </HeaderCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {features.map((row, index) => (
              <TableRow key={index} hover>
                <FeatureCell>{row.feature}</FeatureCell>
                <CompareCell>{renderCellContent(row.traditional)}</CompareCell>
                <HighlightedColumn highlight={true}>
                  {renderCellContent(row.ai)}
                </HighlightedColumn>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </Box>
  );
};

export default ComparisonTable;