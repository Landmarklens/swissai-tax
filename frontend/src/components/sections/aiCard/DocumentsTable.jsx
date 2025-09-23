import {
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Paper,
  Checkbox,
  styled
} from '@mui/material';
import { useState } from 'react';
import { DotsThreeVertical } from '../../../assets/svg/DotsThreeVertical';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const StyledPaper = styled(Paper)({
  boxShadow: 'none',
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0
});

const DocumentsTable = ({ data }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);

  const rows = data || [];
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const renderStatus = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return '';
    }
  };

  return (
    <Box>
      <TableContainer component={StyledPaper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < rows.length}
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={handleSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all documents'
                  }}
                />
              </TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>{t('Name')}</TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>
                {t('Property address')}
              </TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>
                {t('Tenant')}
              </TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>
                {t('Status')}
              </TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}>{t('Date')}</TableCell>
              <TableCell sx={{ padding: '2px 16px', background: '#F0F0F3' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => {
              const isItemSelected = isSelected(row.name);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow key={index}>
                  <TableCell sx={{ padding: '2px 16px' }}>
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      onClick={() => handleClick(row.name)}
                      inputProps={{
                        'aria-labelledby': labelId
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '2px 16px' }}>{row.name}</TableCell>
                  <TableCell sx={{ padding: '2px 16px' }}>
                    {row?.property_address?.address}
                    {', '}
                    {row?.property_address?.country}
                  </TableCell>
                  <TableCell sx={{ padding: '2px 16px' }}>{row?.tenant_name}</TableCell>
                  <TableCell sx={{ padding: '2px 16px' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        px: '6px',
                        height: '24px',
                        alignItems: 'center',
                        color: '#AB6400',
                        backgroundColor: 'rgba(255, 222, 0, 0.24)',
                        borderRadius: '3px'
                      }}
                    >
                      {renderStatus(row.status)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ padding: '2px 16px' }}>
                    {dayjs(row.created_at).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '2px 16px',
                      textAlign: 'right',
                      cursor: 'pointer'
                    }}
                  >
                    <DotsThreeVertical />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        sx={{
          backgroundColor: '#fff',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default DocumentsTable;
