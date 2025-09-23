import {
  Modal,
  Box,
  Typography,
  Button,
  FormControl,
  styled,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useState } from 'react';
import { FileX } from '../../assets/svg/FileX';
import { Files, FilesOutlined } from '../../assets/svg/Files';
import { useSelector } from 'react-redux';
import { selectProperties } from '../../store/slices/propertiesSlice';
import { useTranslation } from 'react-i18next';

const OptionBox = styled(Box)(({ theme, selected }) => ({
  width: '100%',
  height: '100px',
  border: `1px solid ${selected ? theme.palette.primary.main : '#E5E7EB'}`,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main
  }
}));

const AddLeaseModal = ({ open, handleClose, openNewContractModal, data, setData }) => {
  const { t } = useTranslation();
  const { properties } = useSelector(selectProperties);

  const handleOptionChange = (option) => {
    setData({ ...data, documentType: option });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="details-modal-title"
        aria-describedby="details-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560,
            minHeight: '200px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 0,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: '700',
                lineHeight: '26px',
                color: '#202020'
              }}
            >
              {t('Add lease')}
            </Typography>
          </Box>
          <Box
            sx={{
              padding: '24px 40px',
              overflowY: 'auto',
              maxHeight: '600px',
              flexGrow: 1
            }}
          >
            <Box sx={{ display: 'grid', gap: '24px' }}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '24px',
                  color: '#202020'
                }}
              >
                {t('Select a template')}
              </Typography>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', gap: '16px' }}>
                  <OptionBox
                    selected={data.documentType === 'termination'}
                    onClick={() => handleOptionChange('termination')}
                    sx={{ padding: '32px 24px', textAlign: 'center' }}
                  >
                    <Box
                      sx={{
                        background: '#EDF2FE',
                        width: '40px',
                        height: '40px',
                        padding: '12px',
                        borderRadius: '40px'
                      }}
                    >
                      <FileX />
                    </Box>
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        color: '#202020'
                      }}
                    >
                      {t('Termination contract')}
                    </Typography>
                  </OptionBox>
                  <OptionBox
                    selected={data.documentType === 'lease'}
                    onClick={() => handleOptionChange('lease')}
                    sx={{ padding: '32px 24px', textAlign: 'center' }}
                  >
                    <Box
                      sx={{
                        background: '#EDF2FE',
                        width: '40px',
                        height: '40px',
                        padding: '12px',
                        borderRadius: '40px'
                      }}
                    >
                      <FilesOutlined />
                    </Box>
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#202020',
                        lineHeight: '24px'
                      }}
                    >
                      {t('New contract')}
                    </Typography>
                  </OptionBox>
                </Box>
                <Typography
                  sx={{
                    mt: '24px',
                    mb: '10px',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '24px',
                    color: '#202020'
                  }}
                >
                  {t('Select a property')}
                </Typography>
                <Select
                  fullWidth
                  defaultValue=""
                  displayEmpty
                  variant="outlined"
                  value={data.propertyId}
                  onChange={(e) => setData({ ...data, propertyId: e.target.value })}
                  size="small"
                  sx={{
                    flex: 1,
                    height: 40,
                    borderColor: 'rgba(0, 6, 46, 0.20)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 6, 46, 0.20)'
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    {t('Select a property')}
                  </MenuItem>
                  {properties.data.map((property, index) => (
                    <MenuItem key={index} value={property.id}>{property.title}</MenuItem>
                  ))}
                </Select>
                <Typography
                  sx={{
                    mt: '24px',
                    mb: '10px',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '24px',
                    color: '#202020'
                  }}
                >
                  {t('Renter Full Name')}
                </Typography>
                <TextField
                  size="small"
                  placeholder="Jon Adams"
                  type="text"
                  sx={{ borderColor: 'rgba(0, 6, 46, 0.20)' }}
                  variant="outlined"
                  fullWidth
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                />
              </FormControl>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderTop: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                border: 'none',
                boxShadow: 'none',
                background: 'none',
                color: '#002BB7C5',
                fontWeight: 400,
                fontSize: '18px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }
              }}
            >
              {t('Cancel')}
            </Button>
            <Button variant="contained" color="primary" onClick={openNewContractModal}>
              {t('Create')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddLeaseModal;
