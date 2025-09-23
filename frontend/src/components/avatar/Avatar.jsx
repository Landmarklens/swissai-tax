import { Box, Typography } from '@mui/material';

const Avatar = ({ name }) => {
  return (
    <Box
      sx={{
        width: '32px',
        height: '32px',
        borderRadius: '32px',
        backgroundColor: '#8B8D98',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Typography variant="body2" sx={{ color: '#fff' }}>
        {name || 'BW'}
      </Typography>
    </Box>
  );
};

export default Avatar;
