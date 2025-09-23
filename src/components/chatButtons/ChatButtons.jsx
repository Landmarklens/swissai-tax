import { Box, Button, styled } from '@mui/material';

const ButtonsBox = styled(Box)({
  width: 'calc(100% - 32px)',
  margin: '0 auto',
  height: 40,
  padding: '24px 0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  borderRadius: 8,
  border: '1px solid rgba(0, 0, 51, 0.06)'
});

const StyledButton = styled(Button)(({ bgColor }) => ({
  boxShadow: 'none',
  backgroundColor: bgColor === 'standard' ? 'rgba(0, 71, 241, 0.07)!important' : '#3E63DD',
  color: bgColor === 'standard' ? '#002BB7C5' : '#ffffff',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 40
}));

const ChatButtons = ({ buttons }) => {
  return (
    <ButtonsBox>
      {buttons.map(({ variant, icon, text, onClick }, index) => (
        <StyledButton onClick={onClick} bgColor={variant} key={index} variant="contained" >
          {icon} {text}
        </StyledButton>
      ))}
    </ButtonsBox>
  );
};

export default ChatButtons;
