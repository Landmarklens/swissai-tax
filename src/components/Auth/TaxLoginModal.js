import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
  Link,
  Alert,
  Divider,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { motion } from 'framer-motion';

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[5],
  borderRadius: 16,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflow: 'auto',
  outline: 'none'
}));

const ImageSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  padding: theme.spacing(4),
  color: 'white',
  textAlign: 'center',
  borderRadius: '16px 16px 0 0'
}));

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4)
}));

const SocialButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: '1px solid',
  borderColor: theme.palette.divider,
  marginBottom: theme.spacing(2),
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const TaxLoginModal = ({ open, onClose, mode: initialMode = 'choice' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // 'choice', 'login', 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }
    
    // Additional validations for signup
    if (mode === 'signup') {
      if (!formData.firstName) {
        newErrors.firstName = 'Vorname ist erforderlich';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Nachname ist erforderlich';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);
      if (response.access_token) {
        toast.success('Erfolgreich angemeldet!');
        onClose();
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: 'taxpayer'
      };
      
      const response = await authService.register(userData);
      if (response.id) {
        toast.success('Konto erfolgreich erstellt!');
        // Auto-login after signup
        await handleLogin();
      }
    } catch (error) {
      toast.error(error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const googleAuthUrl = await authService.initiateGoogleLogin('taxpayer');
      if (googleAuthUrl && googleAuthUrl.authorization_url) {
        window.location.href = googleAuthUrl.authorization_url;
      }
    } catch (error) {
      toast.error('Google-Anmeldung fehlgeschlagen');
    }
  };

  const renderChoiceMode = () => (
    <>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Willkommen bei SwissAI Tax
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Melden Sie sich an oder erstellen Sie ein Konto, um Ihre Steuererklärung zu starten
      </Typography>
      
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={() => setMode('login')}
        sx={{ mb: 2 }}
      >
        Anmelden
      </Button>
      
      <Button
        variant="outlined"
        fullWidth
        size="large"
        onClick={() => setMode('signup')}
        sx={{ mb: 3 }}
      >
        Konto erstellen
      </Button>
      
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          ODER
        </Typography>
      </Divider>
      
      <SocialButton
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
      >
        Mit Google fortfahren
      </SocialButton>
    </>
  );

  const renderLoginMode = () => (
    <>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Anmelden
      </Typography>
      
      <TextField
        fullWidth
        label="E-Mail"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        fullWidth
        label="Passwort"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange('password')}
        error={!!errors.password}
        helperText={errors.password}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/forgot-password')}
          sx={{ textDecoration: 'none' }}
        >
          Passwort vergessen?
        </Link>
      </Box>
      
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleLogin}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Anmeldung...' : 'Anmelden'}
      </Button>
      
      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Noch kein Konto?{' '}
        <Link
          component="button"
          onClick={() => setMode('signup')}
          sx={{ textDecoration: 'none', fontWeight: 500 }}
        >
          Jetzt registrieren
        </Link>
      </Typography>
    </>
  );

  const renderSignupMode = () => (
    <>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Konto erstellen
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Vorname"
          value={formData.firstName}
          onChange={handleChange('firstName')}
          error={!!errors.firstName}
          helperText={errors.firstName}
        />
        <TextField
          fullWidth
          label="Nachname"
          value={formData.lastName}
          onChange={handleChange('lastName')}
          error={!!errors.lastName}
          helperText={errors.lastName}
        />
      </Box>
      
      <TextField
        fullWidth
        label="E-Mail"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        fullWidth
        label="Passwort"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange('password')}
        error={!!errors.password}
        helperText={errors.password}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        fullWidth
        label="Passwort bestätigen"
        type={showPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Ihre Daten sind bei uns sicher und werden verschlüsselt übertragen.
      </Alert>
      
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSignup}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
      </Button>
      
      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Bereits registriert?{' '}
        <Link
          component="button"
          onClick={() => setMode('login')}
          sx={{ textDecoration: 'none', fontWeight: 500 }}
        >
          Jetzt anmelden
        </Link>
      </Typography>
    </>
  );

  return (
    <StyledModal open={open} onClose={onClose}>
      <ModalContent>
        <ImageSection>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            {mode !== 'choice' && (
              <IconButton
                onClick={() => setMode('choice')}
                sx={{ color: 'white' }}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton
              onClick={onClose}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            SwissAI Tax
          </Typography>
          <Typography variant="body2">
            Ihre digitale Steuererklärung - einfach und sicher
          </Typography>
        </ImageSection>
        
        <FormSection>
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'choice' && renderChoiceMode()}
            {mode === 'login' && renderLoginMode()}
            {mode === 'signup' && renderSignupMode()}
          </motion.div>
        </FormSection>
      </ModalContent>
    </StyledModal>
  );
};

export default TaxLoginModal;