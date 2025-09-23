import React, { useRef } from 'react';
import UploadImage from './ImageUpload';
import UploadedImages from './UploadedImages';
import { styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { validateFileUpload } from '../../config/axiosConfig';
import { toast } from 'react-toastify';

const HiddenInput = styled('input')({
  display: 'none'
});

const Upload = ({ onFileSelect, onFileDelete, images }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;

    // Check if it's a video or image based on MIME type
    const isVideo = file.type.startsWith('video/');
    
    // Validate file
    const validation = validateFileUpload(file, { isVideo });
    
    if (validation.valid) {
      onFileSelect(file);
    } else {
      toast.error(validation.error);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  return (
    <>
      {images.length ? (
        <UploadedImages inputRef={inputRef} images={images} onDelete={onFileDelete} />
      ) : (
        <UploadImage
          btnText={t('Uplad Video')}
          description={t('AVI, MP4 file size no more than 100MB')}
          inputRef={inputRef}
          handleFiles={handleFiles}
        />
      )}
      <HiddenInput
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,video/mp4,video/x-msvideo"
        onChange={handleChange}
      />
    </>
  );
};

export default Upload;
