import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import uploadIcon from '../../assets/svg/uploadIcon.svg';
import ImageComponent from '../Image/Image';
import { useTranslation } from 'react-i18next';

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed #00002F26`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const ImageUpload = ({ onFileSelect, inputRef, handleFiles, description, btnText }) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <UploadBox
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      sx={{ backgroundColor: dragActive ? 'action.hover' : 'background.paper' }}
    >
      {/* <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} /> */}
      <Box
        sx={{
          backgroundColor: '#EDF2FE',
          borderRadius: '100%',
          width: '48px',
          height: '48px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: 'auto'
        }}
      >
        <ImageComponent name="logo" src={uploadIcon} height={30} alt={t("filing.home_ai_logo")} />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ marginTop: '16px' }}>
        {t('Upload a file or drag and drop here')}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ marginBottom: '16px' }}>
        {description
          ? t('AVI, MP4 file size no more than 100MB')
          : t('JPG, PNG or JPEG, file size no more than 10MB')}
      </Typography>
      <Button
        variant="contained"
        sx={{
          mt: 2,
          background: '#fff!important',
          color: '#000',
          height: '32px',
          width: '118px',
          fontSize: '14px',
          border: '1px solid #0007149F',
          borderRadius: '4px'
        }}
      >
        {btnText ? btnText : t('Upload Image')}
      </Button>
    </UploadBox>
  );
};

export default ImageUpload;
