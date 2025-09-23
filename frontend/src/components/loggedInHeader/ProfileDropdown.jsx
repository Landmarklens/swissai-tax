import { Menu, MenuItem, ListItemIcon, ListItemText, styled, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { UserSquare } from '../../assets/svg/UserSquare';
import { SignOut } from '../../assets/svg/SignOut';
import { CreditCard } from '../../assets/svg/CreditCard';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { selectAccount } from '../../store/slices/accountSlice';
import { useTranslation } from 'react-i18next';
import { resetConversations } from '../../store/slices/conversationsSlice';
const StyledListItemText = styled(ListItemText)({
  '.MuiTypography-root': {
    color: '#C40006D3'
  }
});

const ProfileDropdown = ({ anchorEl, setAnchorEl, open, handleMouseLeave }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useSelector(selectAccount);
  const dispatch = useDispatch();
  
  // Debug log to check user type
  console.log('User data:', data);
  console.log('User type:', data?.user_type);

  function handleMenuClick(action) {
    switch(action) {
      case 'dashboard':
        navigate('/owner-account/dashboard');
        break;
      case 'my-properties':
        navigate('/owner-account/listing');
        break;
      case 'messages':
        navigate('/owner-account/communication');
        break;
      case 'owner-profile':
        navigate('/owner-account/profile');
        break;
      case 'my-searches':
        navigate('/my-account?section=searches');
        break;
      case 'saved-properties':
        navigate('/my-account?section=saved-properties');
        break;
      case 'subscription':
        navigate('/my-account?section=subscription');
        break;
      case 'tenant-profile':
        navigate('/edit-profile');
        break;
      case 'logout':
        authService.logout();
        dispatch(resetConversations());
        navigate('/');
        break;
      default:
        break;
    }
    setAnchorEl(null);
  }

  return (
    <Menu
      anchorEl={anchorEl}
      id="profile-menu"
      open={open}
      onClose={() => setAnchorEl(null)}
      MenuListProps={{
        onMouseLeave: handleMouseLeave
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 31,
            height: 32,
            ml: -0.5,
            mr: 1
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
      
      {/* Landlord/Owner specific items */}
      {data?.user_type === 'landlord' && (
        <>
          <MenuItem onClick={() => handleMenuClick('dashboard')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <DashboardIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Dashboard')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('my-properties')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <HomeIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('My Properties')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('messages')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <ChatIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Messages')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('owner-profile')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <PersonIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Profile')}</ListItemText>
          </MenuItem>
        </>
      )}
      
      {/* Tenant specific items */}
      {data?.user_type === 'tenant' && (
        <>
          <MenuItem onClick={() => handleMenuClick('my-searches')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <SearchIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('My Searches')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('saved-properties')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <BookmarkIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Saved Properties')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('subscription')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <CreditCard />
            </ListItemIcon>
            <ListItemText>{t('Subscription')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick('tenant-profile')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <PersonIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Profile')}</ListItemText>
          </MenuItem>
        </>
      )}
      
      {/* Default/Fallback items if user_type is not set or recognized */}
      {(!data?.user_type || (data?.user_type !== 'landlord' && data?.user_type !== 'tenant')) && (
        <>
          <MenuItem onClick={() => handleMenuClick('tenant-profile')}>
            <ListItemIcon sx={{ minWidth: '28px!important' }}>
              <PersonIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>{t('Profile')}</ListItemText>
          </MenuItem>
        </>
      )}
      
      {/* Divider before logout */}
      <Divider sx={{ my: 1 }} />
      
      {/* Logout - Common for both */}
      <MenuItem onClick={() => handleMenuClick('logout')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <SignOut />
        </ListItemIcon>
        <StyledListItemText>{t('Log Out')}</StyledListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ProfileDropdown;
