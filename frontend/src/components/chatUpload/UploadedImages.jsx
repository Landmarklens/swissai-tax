import { Box, Typography, LinearProgress, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Picture } from '../../assets/svg/Picture';
import { Pencil } from '../../assets/svg/Pencil';
import { Trash } from '../../assets/svg/Trash';
import uploadIcon from '../../assets/svg/uploadIcon.svg';
import ImageComponent from '../Image/Image';
import { useTranslation } from 'react-i18next';

const ImagesContainer = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
}));

const ImageBox = styled(Box)(({ uploaded, url }) => ({
  position: 'relative',
  width: 218,
  height: 232,
  borderRadius: 6,
  border: !uploaded ? '1px solid rgba(0, 0, 47, 0.15)' : '',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundImage: uploaded && `url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  overflow: 'hidden'
}));

const ImageActionsBox = styled(Box)(({ completed }) => ({
  width: '100%',
  height: '100%',
  position: 'absolute',
  background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0.40) 100%)',
  opacity: 0,
  transition: '.1s all ease',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 13,
  '&:hover': {
    opacity: completed ? 1 : 0
  }
}));

const ActionButton = styled(Button)(({ bgColor }) => ({
  width: 40,
  minWidth: 40,
  borderRadius: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bgColor
}));

const UploadedImages = ({ images, onDelete, inputRef }) => {
  const { t } = useTranslation();

  return (
    <ImagesContainer>
      {images.map((image, index) => (
        <ImageBox url={image.url} uploaded={image.completed} item key={index}>
          {!image.completed ? (
            <Box sx={{ width: 148, textAlign: 'center' }}>
              <Picture />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#646464'
                  }}
                >
                  {image.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#646464' }}>
                  {(image.size / (1024 * 1024)).toFixed(2)}MB
                </Typography>
              </Box>
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={image.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 0, 51, 0.06)',
                    border: '1px solid rgba(0, 0, 45, 0.09)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: '#1F2D5C'
                    }
                  }}
                />
              </Box>
            </Box>
          ) : image.type.startsWith('video/') ? (
            <video
              autoPlay
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            >
              <source src={image.url} type={image.type} />
            </video>
          ) : (
            <ImageComponent
              name="uploaded-image"
              src={image.url}
              alt="Uploaded"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
          <ImageActionsBox completed={image.completed}>
            <ActionButton onClick={() => onDelete(index)} bgColor="#E5484D">
              <Trash stroke="#fff" />
            </ActionButton>
          </ImageActionsBox>
        </ImageBox>
      ))}
      <ImageBox item>
        <Box sx={{ textAlign: 'center' }}>
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
            <ImageComponent name="logo" src={uploadIcon} height={30} alt="HOME AI Logo" />
          </Box>
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
              borderRadius: '4px',
              boxShadow: 'none'
            }}
            onClick={() => inputRef.current.click()}
          >
            {t('Upload Video')}
          </Button>
        </Box>
      </ImageBox>
    </ImagesContainer>
  );
};

export default UploadedImages;
