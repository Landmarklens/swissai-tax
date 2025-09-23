import { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { Note } from '../../../assets/svg/Note';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProfileAvatar } from '../../../store/slices/accountSlice';
import { useTranslation } from 'react-i18next';
import { Close } from '@mui/icons-material';
import { useTheme } from '@emotion/react';
import { useGetAccountNavigation } from '../../../constants/my-account';
import { Helmet } from 'react-helmet-async';
import { Gallery } from '../../gallery/Gallery';
import Subscription from './Subscription/Subscription';
import BillingHistory from './BillingHistory/BillingHistory';
import SavedProperties from './SavedProperties/SavedProperties';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { selectSubscriptions } from '../../../store/slices/subscriptionsSlice';
import UpgradeModal from '../../modals/upgradeModal';
import { jsonData } from '../../../db';
import { getRecommendationsByConversationId } from '../../../store/slices/recomandationsSlice';
import { getConversationProfiles } from '../../../store/slices/conversationsSlice';
import EnhancedChatHistory from './ChatHistoryGrid/EnhancedChatHistory';

const Sidebar = styled(Box)(({ theme }) => ({
  width: 250,
  minWidth: '250px',
  padding: theme.spacing(3),
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper
}));

const NavItem = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  cursor: 'pointer',
  '&:hover': {
    color: theme.palette.primary.main
  }
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 80,
  height: 80,
  margin: 'auto',
  marginBottom: theme.spacing(1),
  '&:hover .avatarOverlay': {
    opacity: 1
  }
}));

const AvatarOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  opacity: 0,
  transition: 'opacity 0.3s'
}));

const MyAccount = ({ data, opened, setOpened }) => {
  const navigationItems = useGetAccountNavigation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dispatch = useDispatch();
  const searchTerm = queryParams.get('section') || 'property';
  const avatarRef = useRef();
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [open, setOpen] = useState(false);

  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);
  const { recommendations } = useSelector((state) => state.recommendations);
  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);
  const conversationsLoading = useSelector((state) => state.conversations.loading);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { subscription } = useSelector(selectSubscriptions);
  const activePlan = subscription.data?.[0];

  useEffect(() => {
    dispatch(getConversationProfiles());
    // dispatch(getRecommendationsByConversationId({ conversationId: activeConversationId }));
  }, [dispatch]);

  // if (!recommendations) {
  //   return (
  //     <Box
  //       sx={{
  //         display: 'flex',
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         minHeight: '100vh'
  //       }}>
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  const handleClick = (link) => {
    navigate(link);
    if (isMobile) setOpened(false);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleNewChatClick = () => {
    navigate('/chat');
  };

  const onAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      dispatch(updateProfileAvatar(file));
    }
  };

  const renderWithHelmet = (title, Component) => {
    return (
      <>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        {Component}
      </>
    );
  };

  const renderContent = () => {
    switch (searchTerm) {
      case 'searches':
        return renderWithHelmet(
          t('My Searches'),
          <Box sx={{ p: 3, flex: 1 }}>
            <EnhancedChatHistory
              conversations={conversationProfiles}
              loading={conversationsLoading}
              onNewChat={handleNewChatClick}
              onChatSelect={(id) => navigate(`/chat?conversation=${id}`)}
            />
          </Box>
        );
      case 'saved-properties':
        return renderWithHelmet(t('Saved Properties'), <SavedProperties />);
      case 'subscription':
        return renderWithHelmet(t('Subscription'), <Subscription />);
      case 'billing-history':
        return renderWithHelmet(t('Billing History'), <BillingHistory />);
      default:
        return renderWithHelmet(t('My Viewings'), <Gallery recommendations={recommendations} />);
    }
  };

  const modalVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    closed: {
      x: '-100%',
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const firstName = data?.firstname?.trim() || '';
  const lastName = data?.lastname?.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const visibleName = fullName || data?.email || 'User';

  const avatarUrl = data?.avatar_url || 'https://via.placeholder.com/100';
  const country = data?.country;

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {opened && (
          <Box
            component={motion.div}
            initial="closed"
            animate="open"
            exit="closed"
            variants={modalVariants}
            sx={{
              width: '100%',
              height: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1000,
              background: '#fff',
              padding: 3
            }}>
            <Box
              onClick={() => setOpened(false)}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
              <Close />
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3, mt: 4 }}>
              <AvatarWrapper
                onMouseEnter={() => setAvatarHovered(true)}
                onMouseLeave={() => setAvatarHovered(false)}>
                <IconButton
                  sx={{
                    width: '100%',
                    height: '100%',
                    padding: 0
                  }}
                  onClick={() => avatarRef.current.click()}>
                  <Avatar
                    src={avatarUrl}
                    sx={{
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <AvatarOverlay className="avatarOverlay">
                    <CameraAltIcon sx={{ color: 'white' }} />
                  </AvatarOverlay>
                </IconButton>
              </AvatarWrapper>
              <input
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={onAvatarUpload}
                ref={avatarRef}
                type="file"
                hidden
              />
              <Box
                onClick={() => handleClick('/edit-profile')}
                sx={{
                  textAlign: 'center',
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                <Typography variant="h6">{visibleName}</Typography>
                <Box sx={{ marginLeft: '12px', marginTop: '8px' }}>
                  <Note />
                </Box>
              </Box>
              {country && (
                <Typography variant="body2" color="text.secondary">
                  {country}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              fullWidth
              color="primary"
              sx={{
                backgroundColor: 'transparent',
                color: '#1C2024',
                borderColor: '#ddd',
                marginBottom: '40px'
              }}
              onClick={handleNewChatClick}>
              {t('New chat')}
            </Button>
            {navigationItems.map((item) => (
              <NavItem
                key={item.name}
                onClick={() => handleClick(`/my-account?section=${item.name}`)}
                variant="body1"
                color={searchTerm.includes(item.name) ? 'primary' : ''}>
                {item.title}
              </NavItem>
            ))}
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Box
            onClick={() => setOpened(true)}
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              pt: 1,
              px: 3,
              justifyContent: 'end'
            }}>
            <MenuIcon />
          </Box>
          {renderContent()}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar>
        <Box sx={{ mt: '25px' }}>
          <Typography sx={{ color: '#202020', fontWeight: 500, fontSize: '16px' }}>
            {t('Search Property')}
          </Typography>
          <Box
            sx={{
              marginTop: '32px',
              marginBottom: '32px',
              border: '1px solid #ddd'
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <AvatarWrapper
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}>
            <IconButton
              sx={{
                width: '100%',
                height: '100%',
                padding: 0
              }}
              onClick={() => avatarRef.current.click()}>
              <Avatar
                src={avatarUrl}
                sx={{
                  width: '100%',
                  height: '100%'
                }}
              />
              <AvatarOverlay className="avatarOverlay">
                <CameraAltIcon sx={{ color: 'white' }} />
              </AvatarOverlay>
            </IconButton>
          </AvatarWrapper>
          <input
            accept="image/png, image/jpeg, image/svg+xml"
            onChange={onAvatarUpload}
            ref={avatarRef}
            type="file"
            hidden
          />
          <Box
            onClick={() => handleClick('/edit-profile')}
            sx={{
              textAlign: 'center',
              mb: 2,
              display: 'flex',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
            <Typography
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              variant="h6">
              {visibleName}
            </Typography>
            <Box sx={{ marginLeft: '12px', marginTop: '8px' }}>
              <Note />
            </Box>
          </Box>
          {country && (
            <Typography variant="body2" color="text.secondary">
              {country}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          fullWidth
          color="primary"
          sx={{
            backgroundColor: 'transparent',
            color: '#1C2024',
            borderColor: '#ddd',
            marginBottom: '40px'
          }}
          onClick={handleNewChatClick}>
          {t('New chat')}
        </Button>
        {navigationItems.map((item) => (
          <NavItem
            key={item.name}
            onClick={() => handleClick(`/my-account?section=${item.name}`)}
            variant="body1"
            color={searchTerm.includes(item.name) ? 'primary' : ''}>
            {item.title}
          </NavItem>
        ))}
      </Sidebar>
      {renderContent()}

      {/* <UpgradeModal
        translate
        currentPlan={jsonData.currentPlan}
        upgradePlan={jsonData.upgradePlan}
        open={open}
        onClose={handleClose}
      /> */}
    </Box>
  );
};

export default MyAccount;
