import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  AlertTitle,
  Avatar,
  Stack,
  IconButton,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Folder as FolderIcon,
  Calculate as CalculateIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Description as DescriptionIcon,
  Lightbulb as LightbulbIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Language as LanguageIcon,
  ArrowForward as ArrowForwardIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  // Mock data - replace with real data from backend
  const userName = "Max Mustermann";
  const taxYear = 2024;
  const progressPercentage = 65;
  const estimatedRefund = 1234;
  const grossIncome = 85000;
  const deductions = 12500;
  const taxRate = 18.5;

  const navigationItems = [
    { id: 'dashboard', label: 'Übersicht', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'tax-filing', label: `Steuererklärung ${taxYear}`, icon: <AssignmentIcon />, path: '/interview', badge: 'In Bearbeitung' },
    { id: 'history', label: 'Frühere Jahre', icon: <HistoryIcon />, path: '/history' },
    { id: 'documents', label: 'Dokumente', icon: <FolderIcon />, path: '/documents' },
    { id: 'calculator', label: 'Steuerrechner', icon: <CalculateIcon />, path: '/calculator' },
    { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' }
  ];

  const statusCards = [
    {
      id: 'interview',
      title: 'Interview',
      status: 'completed',
      description: 'Abgeschlossen',
      icon: <CheckCircleIcon sx={{ fontSize: 30 }} />,
      color: 'success.main'
    },
    {
      id: 'documents',
      title: 'Dokumente',
      status: 'active',
      description: '8 von 12',
      icon: <RadioButtonUncheckedIcon sx={{ fontSize: 30 }} />,
      color: 'primary.main'
    },
    {
      id: 'review',
      title: 'Prüfung',
      status: 'pending',
      description: 'Ausstehend',
      icon: <RadioButtonUncheckedIcon sx={{ fontSize: 30 }} />,
      color: 'text.muted'
    },
    {
      id: 'submission',
      title: 'Einreichung',
      status: 'pending',
      description: 'Ausstehend',
      icon: <RadioButtonUncheckedIcon sx={{ fontSize: 30 }} />,
      color: 'text.muted'
    }
  ];

  const missingDocuments = [
    { id: 1, name: 'Lohnausweis 2024', employer: 'TechCorp AG', type: 'employment' },
    { id: 2, name: '3a Vorsorgebescheinigung', employer: 'Bank: UBS', type: 'pension' },
    { id: 3, name: 'Krankenkassen-Übersicht', employer: 'CSS Versicherung', type: 'insurance' }
  ];

  const tips = [
    { id: 1, title: 'Homeoffice-Pauschale', description: 'Neu: CHF 600 pro Jahr abziehbar' },
    { id: 2, title: 'Kinderbetreuungskosten', description: 'Bis CHF 10,000 pro Kind' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        SwissAI Tax
      </Typography>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.id}
            selected={selectedMenu === item.id}
            onClick={() => {
              setSelectedMenu(item.id);
              handleNavigate(item.path);
            }}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                '&:hover': {
                  bgcolor: 'primary.lighter'
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: selectedMenu === item.id ? 'primary.main' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
            {item.badge && (
              <Chip label={item.badge} size="small" color="primary" />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            SwissAI Tax
          </Typography>
          <IconButton>
            <LanguageIcon />
          </IconButton>
          <IconButton>
            <Badge badgeContent={3} color="primary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton>
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {!isMobile ? (
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              mt: 8,
              height: 'calc(100vh - 64px)',
              borderRight: '1px solid',
              borderColor: 'divider'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: !isMobile ? '280px' : 0
        }}
      >
        <Container maxWidth="xl">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Willkommen zurück, {userName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ihre Steuererklärung {taxYear} ist zu {progressPercentage}% fertiggestellt
              </Typography>
            </Box>
          </motion.div>

          {/* Progress Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Steuererklärung {taxYear}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        mb: 3,
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'background.lightGrey',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'primary.main',
                          borderRadius: 5
                        }
                      }}
                    />
                    <Grid container spacing={2}>
                      {statusCards.map((status) => (
                        <Grid item xs={6} sm={3} key={status.id}>
                          <Card
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              border: status.status === 'active' ? '2px solid' : '1px solid',
                              borderColor: status.status === 'active' ? 'primary.main' : 'border.grey',
                              bgcolor: status.status === 'completed' ? 'success.light' : 'background.paper'
                            }}
                          >
                            <Box sx={{ color: status.color }}>
                              {status.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                              {status.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {status.description}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/interview')}
                        sx={{ flex: 1 }}
                      >
                        Weiter bearbeiten
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => navigate('/documents')}
                        sx={{ flex: 1 }}
                      >
                        Dokumente hochladen
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card sx={{ height: '100%', bgcolor: 'primary.lighter' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Geschätzte Rückerstattung
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'success.main',
                        fontWeight: 'bold',
                        my: 2
                      }}
                    >
                      CHF {estimatedRefund.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Basierend auf Ihren bisherigen Angaben
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Einkommen"
                          secondary={`CHF ${grossIncome.toLocaleString()}`}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Abzüge"
                          secondary={`CHF ${deductions.toLocaleString()}`}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Steuersatz"
                          secondary={`${taxRate}%`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Fehlende Dokumente
                    </Typography>
                    <List>
                      {missingDocuments.map((doc) => (
                        <ListItem key={doc.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.lighter' }}>
                              <DescriptionIcon sx={{ color: 'primary.main' }} />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.name}
                            secondary={doc.employer}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate('/documents')}
                          >
                            Hochladen
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant="text"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={() => navigate('/documents')}
                    >
                      Alle anzeigen
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Hilfreiche Tipps
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>Tipp des Tages</AlertTitle>
                      Vergessen Sie nicht, Ihre Weiterbildungskosten als Abzug geltend zu machen!
                    </Alert>
                    <List>
                      {tips.map((tip) => (
                        <ListItem key={tip.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'accent.gold', width: 32, height: 32 }}>
                              <LightbulbIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={tip.title}
                            secondary={tip.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;