import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/system';
import { theme } from '../../theme/theme';

const StyledButton = styled(Button)({
  color: theme.palette.aiCard.blue,
  borderColor: theme.palette.aiCard.blue,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.aiCard.blue,
    color: theme.palette.background.paper,
    borderColor: theme.palette.background.paper
  }
});

function CustomButton({ text, icon, onClick }) {
  return (
    <StyledButton onClick={onClick} variant="outlined" startIcon={icon}>
      {text}
    </StyledButton>
  );
}

export default CustomButton;
