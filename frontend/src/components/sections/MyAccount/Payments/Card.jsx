import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Paper,
  ClickAwayListener
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { BigMasterCard } from '../../../../assets/svg/BigMasterCard';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Trash } from '../../../../assets/svg/Trash';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#6366f1',
  color: 'white',
  borderRadius: theme.spacing(2),
  width: '329px',
  height: '172px',
  position: 'relative',
  overflow: 'visible' // Allow dropdown to overflow
}));

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

const CardNumber = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 500
}));

const CustomDropdown = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '60px',
  right: '-131px', // Adjust this value to control how much of the dropdown is outside the card
  backgroundColor: 'white',
  borderRadius: theme.spacing(1),
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  width: '151px',
  cursor: 'pointer',
  zIndex: 1,
  '&:hover': {
    backgroundColor: '#f5f5f5'
  }
}));

const CardSection = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  const handleDelete = () => {
    setDropdownOpen(false);
  };

  return (
    <Box>
      <Box sx={{ marginTop: '32px' }}>
        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '16px' }} gutterBottom>
          Saved Card
        </Typography>
        <ClickAwayListener onClickAway={handleClickAway}>
          <StyledCard>
            <CardContent>
              <CardHeader>
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 500
                  }}
                  variant="h6"
                >
                  Credit Card
                </Typography>
                <IconButton
                  onClick={handleMenuClick}
                  sx={{ color: 'white', position: 'relative', zIndex: 2 }}
                >
                  <MoreVertIcon />
                </IconButton>
              </CardHeader>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <BigMasterCard />
              </Box>
              <CardNumber variant="h6">XXXX XXX XXXX 1234</CardNumber>
              {dropdownOpen && (
                <CustomDropdown onClick={handleDelete}>
                  <Box sx={{ paddingRight: '8px', paddingLeft: '14px' }}>
                    <Trash />
                  </Box>
                  <Typography
                    color="textPrimary"
                    sx={{ fontWeight: 400, fontSize: '14px', mt: '-2px' }}
                  >
                    Delete{' '}
                  </Typography>
                </CustomDropdown>
              )}
            </CardContent>
          </StyledCard>
        </ClickAwayListener>
      </Box>
    </Box>
  );
};

export default CardSection;
