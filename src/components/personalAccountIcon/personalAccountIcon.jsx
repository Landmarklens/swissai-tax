import React, { useMemo, useState } from 'react';
import { IconButton } from '@mui/material';
import Avatar from '../avatar/Avatar';
import { useSelector } from 'react-redux';
import { selectAccount } from '../../store/slices/accountSlice';
import ProfileDropdown from '../loggedInHeader/ProfileDropdown';
import { useLocation } from 'react-router-dom';
import authService from '../../services/authService'
export const PersonalAccountIcon = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isUserAuthenticated = authService.isAuthenticated();
  const { data: userData } = useSelector(selectAccount);
  const location = useLocation();
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.replace(/\s+/g, '')[0].toUpperCase() : '';
    const lastInitial = lastName ? lastName[0].toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const userInitials = useMemo(() => {
    return getInitials(userData?.firstname, userData?.lastname);
  }, [userData]);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const footerLink = ['search-property', 'privacy-policy', 'terms-and-conditions', 'support'];

  const currentPath = location.pathname.replace(/^\/+/, '');
  const isFooterRoute = footerLink.includes(currentPath);

  if (!isUserAuthenticated && isFooterRoute) {
    return null;
  }

  return (
      <>
        <IconButton
            onMouseEnter={handleMouseEnter}
            sx={{ cursor: 'pointer' }}
            size="small"
            aria-controls={open ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
        >
          <Avatar name={userInitials} />
        </IconButton>
        <ProfileDropdown
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            open={open}
            handleMouseLeave={handleMouseLeave}
        />
      </>
  );
};