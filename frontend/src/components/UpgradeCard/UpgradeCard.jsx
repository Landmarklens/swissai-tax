import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import { theme } from '../../theme/theme';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
const UpgradeCard = ({
  backgroundColor,
  title,
  text,
  buttonBackground,
  buttonTextColor,
  borderColor,
  textColor
}) => {
  return (
    <Box
      sx={{
        backgroundColor: backgroundColor,
        borderRadius: '10px',
        display: 'flex',
        px: 3,
        py: 4,
        flexWrap: 'wrap',
        border: borderColor && `1.5px solid ${borderColor}`
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '80%'
        }}
      >
        <Box>
          <BoltOutlinedIcon
            sx={{ mr: 0.5, color: textColor ? textColor : 'white', fontSize: '30px' }}
          />
        </Box>
        <Box>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: textColor ? textColor : 'white',
              fontSize: '18px',
              fontWeight: 450
            }}
          >
            {' '}
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              pt: 1,
              color: textColor ? textColor : 'white'
            }}
          >
            {text}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ width: '20%', position: 'relative' }}>
        <Button
          sx={{
            backgroundColor: buttonBackground && buttonBackground,
            px: 2,
            py: 0.5,
            borderRadius: '5px',
            fontWeight: 400,
            color: buttonTextColor && buttonTextColor,
            '&:hover': {
              backgroundColor: buttonBackground
            },
            position: 'absolute',
            right: 0
          }}
          variant="contianed"
        >
          Upgrade
        </Button>
      </Box>
    </Box>
  );
};

export default UpgradeCard;
