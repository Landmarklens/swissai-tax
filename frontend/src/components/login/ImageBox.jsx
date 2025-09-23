import { Box } from '@mui/material';
import gptChatIcon from '../../assets/login/gpt-chat.svg';
import dotBg from '../../assets/login/dot-bg.svg';

const ImageBox = () => {
  return (
    <Box
      sx={{
        width: '50%',
        backgroundColor: '#EDF2FE',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        '@media (max-width: 580px)': { width: '100%' }
      }}
    >
      <Box
        sx={{ position: 'relative', mt: '20px', zIndex: 2 }}
        component="img"
        src={gptChatIcon}
        alt="gptChatIcon"
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 33,
          zIndex: 1
        }}
        component="img"
        src={dotBg}
        alt="dotBg"
      />
      <Box
        sx={{
          position: 'absolute',
          top: 90,
          display: 'flex',
          gap: '20px',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: 115,
            height: 115,
            borderRadius: '9.843px',
            border: '1.23px solid #E0E7FD',
            background:
              'linear-gradient(180deg, rgba(202, 206, 255, 0.10) 0%, rgba(193, 188, 254, 0.10) 100%)',
            backdropFilter: 'blur(1.230347990989685px)'
          }}
        />
        <Box
          sx={{
            width: 115,
            height: 115,
            borderRadius: '9.843px',
            border: '1.23px solid #E0E7FD',
            background:
              'linear-gradient(180deg, rgba(202, 206, 255, 0.10) 0%, rgba(193, 188, 254, 0.10) 100%)',
            backdropFilter: 'blur(1.230347990989685px)'
          }}
        />
        <Box
          sx={{
            width: 115,
            height: 115,
            borderRadius: '9.843px',
            border: '1.23px solid #E0E7FD',
            background:
              'linear-gradient(180deg, rgba(202, 206, 255, 0.10) 0%, rgba(193, 188, 254, 0.10) 100%)',
            backdropFilter: 'blur(1.230347990989685px)'
          }}
        />
        <Box
          sx={{
            width: 115,
            height: 115,
            borderRadius: '9.843px',
            border: '1.23px solid #E0E7FD',
            background:
              'linear-gradient(180deg, rgba(202, 206, 255, 0.10) 0%, rgba(193, 188, 254, 0.10) 100%)',
            backdropFilter: 'blur(1.230347990989685px)'
          }}
        />
      </Box>
    </Box>
  );
};

export default ImageBox;
