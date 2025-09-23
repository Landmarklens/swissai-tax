import { Box, Typography } from '@mui/material';
import React from 'react';
import ChatDots from '../../assets/svg/ChatDots';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';

const NotesCard = ({ item, openFeedback }) => {
  const { t } = useTranslation();

  const ImagePlaceholder = () => (
    <Box
      sx={{
        height: '140px',
        width: '100%',
        maxWidth: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f0f0f0'
      }}
    >
      <ImageIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />{' '}
    </Box>
  );
  return (
    <Box
      sx={{
        display: 'flex',
        height: '122px',
        borderRadius: '8px',
        border: '1px solid #C1D0FF',
        background: '#fff',
        width: '100%',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onClick={() => openFeedback()}
    >
      {item?.image ? (
        <Box
          component="img"
          sx={{
            height: '100%',
            width: '200px'
          }}
          src={item.image}
        />
      ) : (
        <ImagePlaceholder />
      )}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ px: 2, py: '12px', borderBottom: '1px solid #C1D0FF' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between'
            }}
          >
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: 0
              }}
              variant="h6"
              gutterBottom
            >
              {item.price}{' '}
              <span
                style={{
                  fontSize: '14px',
                  color: '#646464',
                  fontWeight: 300
                }}
              >
                {t('per month')}
              </span>
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#646464',
                gap: '12px',
                display: 'flex'
              }}
              variant="p"
            >
              <span>
                {item.bathrooms} {t('bathrooms')}
              </span>
              <span>
                {item.bedrooms} {t('bedrooms')}
              </span>
            </Typography>
          </Box>
          <Typography sx={{ mt: '3px' }} variant="body1">
            {item.address}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 2,
            py: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ChatDots />
          <Typography sx={{ color: '#3E63DD', fontSize: 16 }} variant="body2">
            {item.feedback_count}
          </Typography>
          <Typography sx={{ color: '#000000', fontSize: 16 }} variant="body1">
            {t('Notes')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default NotesCard;
