import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const FilingHistoryTable = ({ filings }) => {
  const { t } = useTranslation();

  const handleView = (filing) => {
    // Navigate to filing details or open modal
  };

  const handleDownload = (filing) => {
    // Download PDF
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!filings || filings.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('No past tax filings found')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('Your completed filings will appear here')}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Tax Year')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Status')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Submitted Date')}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Refund')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Confirmation')}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Actions')}
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filings.map((filing) => (
            <TableRow
              key={filing.id}
              sx={{
                '&:hover': { backgroundColor: '#FAFAFA' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {filing.taxYear}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={t('Filed')}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(filing.submittedDate)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600} color="success.main">
                  CHF {filing.refundAmount}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {filing.confirmationNumber}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" justifyContent="center" gap={0.5}>
                  <Tooltip title={t('View Details')}>
                    <IconButton
                      size="small"
                      onClick={() => handleView(filing)}
                      sx={{ color: '#003DA5' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Download PDF')}>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(filing)}
                      sx={{ color: '#DC0018' }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FilingHistoryTable;
