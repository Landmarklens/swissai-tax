import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectSubscriptions } from '../../../../store/slices/subscriptionsSlice';
import dayjs from 'dayjs';
import { numberFormatter } from '../../../../utils';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 'none'
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:first-of-type td, &:first-of-type th': {
    borderTop: 'none'
  },

  '&:last-of-type': {
    borderBottom: '1px solid #ddd' // Border for last row
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#fbfcff' // Red background for even rows
  },
  '& td, & th': {
    border: 'none' // Remove borders for table body
  }
}));

const BillingHistoryTable = () => {
  const { t } = useTranslation();
  const { billingHistory } = useSelector(selectSubscriptions);

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table
        sx={{
          minWidth: 650,
          marginTop: '32px'
        }}
        aria-label="billing history table"
      >
        <TableHead
          sx={{
            backgroundColor: '#f7f9ff!important',
            borderBottom: '1px solid #ddd!important'
          }}
        >
          <StyledTableRow>
            <StyledTableCell sx={{ color: '#8E8E93' }}>{t('Date')}</StyledTableCell>
            <StyledTableCell sx={{ color: '#8E8E93' }}>{t('Plan')}</StyledTableCell>
            <StyledTableCell sx={{ color: '#8E8E93' }}>{t('Amount')}</StyledTableCell>
            <StyledTableCell sx={{ color: '#8E8E93' }}>{t('Download Invoice')}</StyledTableCell>
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {billingHistory.data?.map((row, index) => (
            <StyledTableRow key={index}>
              <StyledTableCell>{dayjs(row.created).format('DD/MM/YYYY')}</StyledTableCell>
              <StyledTableCell>{row.plan_name}</StyledTableCell>
              <StyledTableCell>₣{numberFormatter(row.amount_paid || 0)}</StyledTableCell>
              <StyledTableCell>
                <Link href={row.receipt_url} target="_blank" color="primary" underline="always">
                  {t('Download')}
                </Link>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BillingHistoryTable;
