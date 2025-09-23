import { Box, Typography, Avatar, styled } from '@mui/material';
import React from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';

const StyledImage = styled(Box)(({ url }) => ({
  width: '100%',
  height: 112,
  borderRadius: 6,
  backgroundImage: `url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}));

const MessageScreen = ({ chat, sx }) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        padding: '25px',
        ...sx
      }}>
      {chat?.map((message, index) => {
        const formattedText = message?.text?.split('\n').map((line, index) => (
          <span key={index}>
            {line}
            <br />
          </span>
        ));

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              flexDirection: 'row',
              borderRadius: '8px',
              maxWidth: '60%',
              alignSelf: 'flex-start'
            }}>
            <Avatar
              sx={{
                bgcolor: message.sender === 'User' ? '#4caf50' : '#3e63dd',
                height: '20px',
                width: '20px',
                fontSize: '12px',
                p: 1,
                color: 'white',
                mt: -1
              }}>
              {message.sender === 'User' ? t('Me') : <AutoAwesomeIcon sx={{ fontSize: '20px' }} />}
            </Avatar>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  color: 'black',
                  fontSize: '14px'
                }}>
                {message.sender === 'User' ? t('You') : t('AI Agent')}
              </Typography>
              <Typography id={message?.text} sx={{ fontSize: '12px' }}>
                {formattedText}
              </Typography>
              {message.images && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                  {message.images?.map((image, index) => (
                    <Box sx={{ width: 105, textAlign: 'center' }} key={index}>
                      <StyledImage url={image.url} />
                      <Typography
                        sx={{
                          fontSize: 12,
                          mt: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#646464'
                        }}>
                        {image.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default MessageScreen;
