import { Menu, MenuItem, ListItemIcon, ListItemText, styled, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { SignOut } from '../../assets/svg/SignOut';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { selectAccount } from '../../store/slices/accountSlice';
import { useTranslation } from 'react-i18next';
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

  function handleMenuClick(action) {
    switch(action) {
      case 'tax-filings':
        navigate('/filings');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'documents':
        navigate('/documents');
        break;
      case 'billing':
        navigate('/billing');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        navigate('/faq');
        break;
      case 'logout':
        authService.logout();
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

      {/* Tax Filing Menu Items */}
      <MenuItem onClick={() => handleMenuClick('tax-filings')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <DescriptionIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('My Tax Filings')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleMenuClick('profile')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <PersonIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('Profile')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleMenuClick('documents')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <FolderIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('Documents')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleMenuClick('billing')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <ReceiptIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('Billing')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleMenuClick('settings')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <SettingsIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('Settings')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleMenuClick('help')}>
        <ListItemIcon sx={{ minWidth: '28px!important' }}>
          <HelpIcon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>{t('Help & Support')}</ListItemText>
      </MenuItem>

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
