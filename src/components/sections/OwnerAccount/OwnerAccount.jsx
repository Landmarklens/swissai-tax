import React, { useState } from 'react';
import { Box, Typography, Divider, Breadcrumbs, Link, IconButton, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Dashboard from './Dashboard/DashboardNew';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import InsightsIcon from '@mui/icons-material/Insights';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Badge from '@mui/material/Badge';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchProperties } from '../../../store/slices/propertiesSlice';
import { fetchLeads } from '../../../store/slices/tenantSelectionSlice';
import ListingManagement from './Managment/ListingManagement';
import MessageLog from './Communications/MessageHistory/MessageLog';
import DocumentManagementNew from './Document/DocumentManagementNew';
import Onboarding from './Onboarding/Onboarding';
import MarketAnalytics from './MarketAnalytics/MarketAnalyticsNew';
import TenantApplicationsEnhanced from './TenantApplications/TenantApplicationsEnhanced';
import OwnerProfile from './Profile/OwnerProfile';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const Sidebar = styled(Box)(({ theme }) => ({
  width: 250,
  minWidth: '250px',
  padding: theme.spacing(3),
  borderRight: `1px solid #E0E7FD`,
  backgroundColor: '#FAFBFF',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    minWidth: 'auto'
  }
}));

const MainNavigation = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto'
});

const BottomNavigation = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(2)
}));

const NavItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  marginBottom: '10px',
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['background-color', 'font-weight'], {
    duration: theme.transitions.duration.shortest
  }),
  ...(active && {
    backgroundColor: '#E0E7FD',
    fontWeight: 'bold',
    borderLeft: '3px solid #3E63DD'
  }),
  '&:hover': {
    backgroundColor: '#AEC2FF20',
    fontWeight: 'bold'
  }
}));

const NavItemText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ theme, active }) => ({
  marginLeft: theme.spacing(1),
  fontSize: '14px',
  fontWeight: active ? '700' : '500'
}));

const GroupDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0)
}));

const OwnerAccount = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams();
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = section || queryParams.get('section') || 'dashboard';
  const propertyIdParam = queryParams.get('property');

  // Debug logging for routing issue
  console.log('[OwnerAccount] Debug Info:', {
    pathname: location.pathname,
    section: section,
    searchTerm: searchTerm,
    queryParams: location.search
  });
  
  // Get data from Redux for badges
  const properties = useSelector(state => state.properties?.properties?.data) || [];
  const leadsData = useSelector(state => state.tenantSelection?.leads) || {};
  const leads = React.useMemo(() => {
    // Handle both old array format and new entity adapter format
    if (Array.isArray(leadsData)) {
      return leadsData;
    } else if (leadsData.ids && leadsData.entities) {
      return leadsData.ids.map(id => leadsData.entities[id]).filter(Boolean);
    }
    return [];
  }, [leadsData]);
  
  // Fetch data for badges
  useEffect(() => {
    // Only fetch properties if we don't have them
    if (!properties || properties.length === 0) {
      dispatch(fetchProperties());
    }
  }, [dispatch, properties.length]);
  
  useEffect(() => {
    // Only fetch leads if we have at least one property AND not on tenant-applications page
    // The tenant-applications page handles its own lead fetching
    const currentPath = window.location.pathname;
    const isTenantApplicationsPage = currentPath.includes('tenant-applications');

    if (properties && properties.length > 0 && !isTenantApplicationsPage) {
      // Fetch leads for all properties by not specifying a property_id
      // The backend will return all leads for all properties owned by the user
      dispatch(fetchLeads({})).catch(() => {
        // Silently fail if no leads endpoint or error
        console.log('Could not fetch leads - this is normal for new users');
      });
    }
  }, [dispatch, properties]);
  
  // Calculate badge counts safely
  const pendingApplications = leads.filter(a => 
    a && (a.status === 'pending' || a.status === 'viewing_requested')
  ).length;
  const draftProperties = properties.filter(p => p && (!p.status || p.status === 'draft')).length;

  const handleClick = (link) => {
    navigate(`/owner-account/${link}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const mainNavGroups = [
    {
      title: 'Property Management',
      items: [
        {
          name: t('Dashboard'),
          icon: <DashboardIcon />,
          link: 'dashboard'
        },
        {
          name: t('My Properties'),
          icon: <HomeIcon />,
          link: 'listing',
          badge: draftProperties > 0 ? draftProperties : null
        },
        {
          name: t('Tenant Applications'),
          icon: <GroupIcon />,
          link: 'tenant-applications',
          badge: pendingApplications > 0 ? pendingApplications : null
        }
      ]
    },
    {
      title: 'Analytics & Communication',
      items: [
        {
          name: t('Analytics'),
          icon: <InsightsIcon />,
          link: 'analytics'
        },
        {
          name: t('Messages'),
          icon: <ChatIcon />,
          link: 'communication'
        },
        {
          name: t('Documents'),
          icon: <DescriptionIcon />,
          link: 'dms'
        }
      ]
    },
    {
      title: 'Resources',
      items: [
        {
          name: t('Onboarding Guide'),
          icon: <PersonAddIcon />,
          link: 'onboarding'
        }
      ]
    }
  ];

  const accountNavGroup = {
    items: [
      {
        name: t('My Profile'),
        icon: <PersonIcon />,
        link: 'profile'
      },
      {
        name: t('Help'),
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none">
            <path
              d="M15.7727 4.27031C15.025 3.51514 14.1357 2.91486 13.1558 2.50383C12.1758 2.09281 11.1244 1.87912 10.0617 1.875H10C7.84512 1.875 5.77849 2.73102 4.25476 4.25476C2.73102 5.77849 1.875 7.84512 1.875 10V14.375C1.875 14.8723 2.07254 15.3492 2.42417 15.7008C2.77581 16.0525 3.25272 16.25 3.75 16.25H5C5.49728 16.25 5.97419 16.0525 6.32583 15.7008C6.67746 15.3492 6.875 14.8723 6.875 14.375V11.25C6.875 10.7527 6.67746 10.2758 6.32583 9.92417C5.97419 9.57254 5.49728 9.375 5 9.375H3.15313C3.27366 8.07182 3.76315 6.83 4.56424 5.79508C5.36532 4.76016 6.44481 3.97502 7.67617 3.53169C8.90753 3.08836 10.2398 3.0052 11.5167 3.29196C12.7936 3.57872 13.9624 4.22352 14.8859 5.15078C16.0148 6.28539 16.7091 7.78052 16.8477 9.375H15C14.5027 9.375 14.0258 9.57254 13.6742 9.92417C13.3225 10.2758 13.125 10.7527 13.125 11.25V14.375C13.125 14.8723 13.3225 15.3492 13.6742 15.7008C14.0258 16.0525 14.5027 16.25 15 16.25H16.875C16.875 16.7473 16.6775 17.2242 16.3258 17.5758C15.9742 17.9275 15.4973 18.125 15 18.125H10.625C10.4592 18.125 10.3003 18.1908 10.1831 18.3081C10.0658 18.4253 10 18.5842 10 18.75C10 18.9158 10.0658 19.0747 10.1831 19.1919C10.3003 19.3092 10.4592 19.375 10.625 19.375H15C15.8288 19.375 16.6237 19.0458 17.2097 18.4597C17.7958 17.8737 18.125 17.0788 18.125 16.25V10C18.1291 8.93717 17.9234 7.88398 17.5197 6.90077C17.1161 5.91757 16.5224 5.02368 15.7727 4.27031ZM5 10.625C5.16576 10.625 5.32473 10.6908 5.44194 10.8081C5.55915 10.9253 5.625 11.0842 5.625 11.25V14.375C5.625 14.5408 5.55915 14.6997 5.44194 14.8169C5.32473 14.9342 5.16576 15 5 15H3.75C3.58424 15 3.42527 14.9342 3.30806 14.8169C3.19085 14.6997 3.125 14.5408 3.125 14.375V10.625H5ZM15 15C14.8342 15 14.6753 14.9342 14.5581 14.8169C14.4408 14.6997 14.375 14.5408 14.375 14.375V11.25C14.375 11.0842 14.4408 10.9253 14.5581 10.8081C14.6753 10.6908 14.8342 10.625 15 10.625H16.875V15H15Z"
              fill="#202020"
            />
          </svg>
        ),
        link: 'help'
      }
    ]
  };

  const renderNavGroup = (group, isActive) => (
    <React.Fragment key={group.title}>
      {group.title && (
        <Typography 
          variant="caption" 
          sx={{ 
            px: 2, 
            py: 1, 
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem'
          }}
        >
          {group.title}
        </Typography>
      )}
      {group.items.map((item) => {
        const isItemActive = isActive(item);
        return (
          <NavItem key={item.link} onClick={() => handleClick(item.link)} active={isItemActive}>
            {React.cloneElement(item.icon, {
              color: isItemActive ? 'primary' : 'action'
            })}
            <NavItemText variant="body2" active={isItemActive} sx={{ flexGrow: 1 }}>
              {item.name}
            </NavItemText>
            {item.badge && (
              <Badge 
                badgeContent={item.badge} 
                color="error" 
                sx={{ ml: 'auto' }}
              />
            )}
          </NavItem>
        );
      })}
    </React.Fragment>
  );

  const getBreadcrumbTitle = () => {
    switch (searchTerm) {
      case 'dashboard': return t('Dashboard');
      case 'listing': return t('My Properties');
      case 'tenant-applications': return t('Tenant Applications');
      case 'analytics': return t('Analytics');
      case 'communication': return t('Messages');
      case 'dms': return t('Documents');
      case 'onboarding': return t('Onboarding Guide');
      case 'profile': return t('My Profile');
      case 'help': return t('Help');
      default: return t('Dashboard');
    }
  };

  const renderContent = () => {
    switch (searchTerm) {
      case 'dashboard':
        return (
          <>
            <Helmet>
              <title>{t('Dashboard')}</title>
            </Helmet>
            <Dashboard />
          </>
        );
      case 'listing':
        return (
          <>
            <Helmet>
              <title>{t('Listing Management')}</title>
            </Helmet>
            <ListingManagement />
          </>
        );
      case 'tenant-applications':
        return (
          <>
            <Helmet>
              <title>{t('Tenant Applications')}</title>
            </Helmet>
            <TenantApplicationsEnhanced />
          </>
        );
      case 'analytics':
        return (
          <>
            <Helmet>
              <title>{t('Analytics and Insight')}</title>
            </Helmet>
            <MarketAnalytics />
          </>
        );
      case 'communication':
        return (
          <>
            <Helmet>
              <title>{t('Messages')}</title>
            </Helmet>
            <Box sx={{ p: 3 }}>
              <MessageLog />
            </Box>
          </>
        );
      case 'dms':
        return (
          <>
            <Helmet>
              <title>{t('Documents')}</title>
            </Helmet>
            <Box sx={{ p: 3 }}>
              <DocumentManagementNew />
            </Box>
          </>
        );
      case 'onboarding':
        return (
          <>
            <Helmet>
              <title>{t('Onboarding for Landlords')}</title>
            </Helmet>
            <Onboarding />
          </>
        );
      case 'profile':
        return (
          <>
            <Helmet>
              <title>{t('My Profile')}</title>
            </Helmet>
            <OwnerProfile />
          </>
        );
      case 'help':
        return (
          <>
            <Helmet>
              <title>{t('Help')}</title>
            </Helmet>
            <Box sx={{ p: 3 }}>
              <Typography variant="h4">{t('Help')}</Typography>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {t('Need assistance? Check our documentation or contact support.')}
              </Typography>
            </Box>
          </>
        );
      case 'settings':
        return (
          <>
            <Helmet>
              <title>{t('Settings')}</title>
            </Helmet>
            <Box sx={{ p: 3 }}>
              <Typography variant="h4">{t('Settings')}</Typography>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {t('Configure your account preferences and system settings here.')}
              </Typography>
            </Box>
          </>
        );
      default:
        return (
          <>
            <Helmet>
              <title>{t('Dashboard')}</title>
            </Helmet>
            <Dashboard />
          </>
        );
    }
  };

  const sidebarContent = (
    <Sidebar>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <MainNavigation>
        {mainNavGroups.map((group, index) => (
          <React.Fragment key={group.title || index}>
            {index > 0 && <GroupDivider />}
            {renderNavGroup(group, (item) => searchTerm === item.link)}
          </React.Fragment>
        ))}
      </MainNavigation>
      <BottomNavigation>
        <GroupDivider />
        {renderNavGroup(accountNavGroup, (item) => searchTerm === item.link)}
      </BottomNavigation>
    </Sidebar>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        sidebarContent
      )}
      {/* Content area */}
      <Box
        sx={{
          flexGrow: 1,
          background: '#FCFCFD',
          display: 'flex',
          flexDirection: 'column',
          width: isMobile ? '100%' : 'calc(100% - 250px)'
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <Box sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #E0E7FD',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white'
          }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {getBreadcrumbTitle()}
            </Typography>
          </Box>
        )}

        {/* Breadcrumb Navigation (Desktop only) */}
        {!isMobile && !['communication', 'dms', 'onboarding'].includes(searchTerm) && (
          <Box sx={{ px: 4, pt: 2 }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ mb: 2 }}
            >
              <Link
                underline="hover"
                color="inherit"
                href="/"
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                {t('Home')}
              </Link>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => handleClick('dashboard')}
                sx={{ cursor: 'pointer' }}
              >
                {t('Owner Account')}
              </Link>
              <Typography color="text.primary">
                {getBreadcrumbTitle()}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}
        
        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            px: !['communication', 'dms', 'onboarding'].includes(searchTerm) ? { xs: 2, sm: 3, md: 4 } : 0,
            py: !['communication', 'dms', 'onboarding'].includes(searchTerm) ? { xs: 1, sm: 2 } : 0,
            overflow: 'auto'
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default OwnerAccount;
