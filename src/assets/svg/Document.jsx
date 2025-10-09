import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const Document = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        height: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: '500' }} variant="h4">
          Document Management System
        </Typography>
        <Button
          sx={{ width: '150px', height: '37px', boxShadow: 'none' }}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add Lease
        </Button>
      </Box>
      <Box sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px'
          }}
        ></Box>
      </Box>
    </Box>
  );
};

export default Document;
