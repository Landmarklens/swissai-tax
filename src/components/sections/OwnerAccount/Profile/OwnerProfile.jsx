import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Card,
  CardContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../../../store/slices/authSlice';
import { getApiUrl } from '../../../../utils/api/getApiUrl';
import authService from '../../../../services/authService';

const OwnerProfile = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const accountData = useSelector(state => state.account?.data);
  const authState = useSelector(state => state.auth);
  
  // Get user data from account slice (primary source) or auth state
  const user = accountData || authState?.user || {};
  
  // Form states
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Profile data - simplified without address
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'en',
    company: '',
    notificationEmail: true,
    notificationSMS: false,
    marketingEmails: false
  });
  
  // Password change dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstname || user.first_name || user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastname || user.last_name || user.lastName || user.name?.split(' ')[1] || '',
        email: user.email || '',
        phone: user.phone || '',
        language: user.language || i18n.language || 'en',
        company: user.company || '',
        notificationEmail: user.notification_email !== false,
        notificationSMS: user.notification_sms === true,
        marketingEmails: user.marketing_emails === true
      });
    }
  }, [user, i18n.language]);
  
  const handleChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value
    });
    // Clear error for this field
    setErrors({
      ...errors,
      [field]: null
    });
  };
  
  const handleSwitchChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.checked
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.firstName) {
      newErrors.firstName = t('First name is required');
    }
    if (!profileData.lastName) {
      newErrors.lastName = t('Last name is required');
    }
    if (!profileData.email) {
      newErrors.email = t('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = t('Invalid email format');
    }
    if (profileData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(profileData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('Invalid phone format');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          firstname: profileData.firstName,
          lastname: profileData.lastName,
          phone: profileData.phone,
          language: profileData.language,
          company: profileData.company || '',
          country: '',
          state: '',
          city: '',
          zip_code: '',
          address: ''
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(updateUserProfile(updatedUser));
        setSaveSuccess(true);
        setEditMode(false);
        
        // Change language if updated
        if (profileData.language !== i18n.language) {
          i18n.changeLanguage(profileData.language);
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ general: t('Failed to update profile. Please try again.') });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Reset to original data
    setProfileData({
      firstName: user?.firstname || user?.first_name || user?.firstName || '',
      lastName: user?.lastname || user?.last_name || user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      language: user?.language || 'en',
      company: user?.company || '',
      notificationEmail: user?.notification_email !== false,
      notificationSMS: user?.notification_sms === true,
      marketingEmails: user?.marketing_emails === true
    });
    setErrors({});
    setEditMode(false);
  };
  
  const handlePasswordChange = async () => {
    // Validate password fields
    if (!passwordData.currentPassword) {
      setErrors({ password: t('Current password is required') });
      return;
    }
    if (!passwordData.newPassword) {
      setErrors({ password: t('New password is required') });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setErrors({ password: t('Password must be at least 8 characters') });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: t('Passwords do not match') });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/user/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        setErrors({ password: error.detail || t('Failed to change password') });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setErrors({ password: t('Failed to change password. Please try again.') });
    } finally {
      setLoading(false);
    }
  };
  
  const getInitials = () => {
    const first = profileData.firstName?.charAt(0) || '';
    const last = profileData.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        {t('My Profile')}
      </Typography>
      
      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.email}
              </Typography>
              
              {profileData.company && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {profileData.company}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('Personal Information')}
              </Typography>
              {!editMode ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  variant="outlined"
                >
                  {t('Edit Profile')}
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : t('Save Changes')}
                  </Button>
                </Box>
              )}
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('First Name')}
                  value={profileData.firstName}
                  onChange={handleChange('firstName')}
                  disabled={!editMode}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('Last Name')}
                  value={profileData.lastName}
                  onChange={handleChange('lastName')}
                  disabled={!editMode}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('Email')}
                  value={profileData.email}
                  onChange={handleChange('email')}
                  disabled={!editMode}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('Phone')}
                  value={profileData.phone}
                  onChange={handleChange('phone')}
                  disabled={!editMode}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>{t('Language')}</InputLabel>
                  <Select
                    value={profileData.language}
                    onChange={handleChange('language')}
                    label={t('Language')}
                    startAdornment={
                      <InputAdornment position="start">
                        <LanguageIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="it">Italiano</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('Company')}
                  value={profileData.company}
                  onChange={handleChange('company')}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* Security Settings */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              {t('Security')}
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <LockIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('Password')}
                  secondary={t('Secure your account with a strong password')}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPasswordDialog(true)}
                  >
                    {t('Change Password')}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
          
          {/* Notification Settings */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              {t('Notifications')}
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('Email Notifications')}
                  secondary={t('Receive updates about your properties and applications')}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={profileData.notificationEmail}
                    onChange={handleSwitchChange('notificationEmail')}
                    disabled={!editMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('SMS Notifications')}
                  secondary={t('Get instant updates via SMS')}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={profileData.notificationSMS}
                    onChange={handleSwitchChange('notificationSMS')}
                    disabled={!editMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('Marketing Emails')}
                  secondary={t('Receive tips and updates about new features')}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={profileData.marketingEmails}
                    onChange={handleSwitchChange('marketingEmails')}
                    disabled={!editMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Change Password')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {errors.password && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.password}
              </Alert>
            )}
            
            <TextField
              fullWidth
              type={showPasswords.current ? 'text' : 'password'}
              label={t('Current Password')}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              type={showPasswords.new ? 'text' : 'password'}
              label={t('New Password')}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              sx={{ mb: 2 }}
              helperText={t('Minimum 8 characters')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              type={showPasswords.confirm ? 'text' : 'password'}
              label={t('Confirm New Password')}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : t('Change Password')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {t('Profile updated successfully!')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OwnerProfile;