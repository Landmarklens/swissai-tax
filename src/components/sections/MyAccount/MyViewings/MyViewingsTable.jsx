import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination
} from '@mui/material';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import PropertyDetailsModal from './PropertyDetailsModal';
import { useDispatch, useSelector } from 'react-redux';
import { getProperty } from '../../../../store/slices/propertiesSlice';
import { selectViewing } from '../../../../store/slices/viewingSlice';
import { useTranslation } from 'react-i18next';

const MyViewingsTable = ({ userId, showNotes }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState(null);
  const { viewings } = useSelector(selectViewing);
  // for now getViewings request gives all viewing (not depends on user)

  const getMyViewings = () => {
    return viewings.data.filter((item) => item.user_id === userId);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const rows = getMyViewings();

  const handleOpenModal = (row) => {
    dispatch(getProperty(row.property_id));
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('Date')}</TableCell>
              <TableCell>{t('Time')}</TableCell>
              <TableCell>{t('Status')}</TableCell>
              <TableCell>{t('Details')}</TableCell>
              <TableCell>{t('Notes')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.scheduled_date}</TableCell>
                <TableCell>{row.scheduled_time}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={() => handleOpenModal(row)}
                    sx={{
                      height: '40px',
                      background: '#fff',
                      color: '#1C2024',
                      fontSize: '12px',
                      lineHeight: '16px',
                      border: '1px solid #00062E32',
                      boxShadow: 'none',
                      '&:hover': {
                        background: '#fff',
                        boxShadow: 'none',
                        cursor: 'point'
                      }
                    }}
                  >
                    {t('Details')}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    startIcon={<AddCommentOutlinedIcon />}
                    onClick={() => {
                      showNotes(row.property_id);
                    }}
                    sx={{
                      height: '40px',
                      background: '#fff',
                      color: '#1C2024',
                      fontSize: '12px',
                      lineHeight: '16px',
                      border: '1px solid #00062E32',
                      boxShadow: 'none',
                      '&:hover': {
                        background: '#fff',
                        boxShadow: 'none',
                        cursor: 'point'
                      }
                    }}
                  >
                    {t('Notes')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <PropertyDetailsModal open={modalOpen} handleClose={handleCloseModal} rowData={selectedRow} />
    </Box>
  );
};

export default MyViewingsTable;
