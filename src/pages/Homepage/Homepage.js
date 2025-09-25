import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack
} from '@mui/material';
import {
  Check as CheckIcon,
  Security as SecurityIcon,
  QuestionAnswer as QuestionAnswerIcon,
  UploadFile as UploadFileIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Language as LanguageIcon,
  SupportAgent as SupportAgentIcon,
  Update as UpdateIcon,
  Devices as DevicesIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Homepage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: "KI-gestützte Optimierung",
      description: "Unsere KI findet automatisch alle möglichen Abzüge"
    },
    {
      icon: <LanguageIcon sx={{ fontSize: 40 }} />,
      title: "Mehrsprachig",
      description: "Verfügbar in Deutsch, Französisch, Italienisch und Englisch"
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Schweizer Datenschutz",
      description: "Ihre Daten bleiben in der Schweiz, verschlüsselt und sicher"
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
      title: "Experten-Support",
      description: "Steuerexperten beantworten Ihre Fragen im Chat"
    },
    {
      icon: <UpdateIcon sx={{ fontSize: 40 }} />,
      title: "Immer aktuell",
      description: "Automatische Updates für alle Gesetzesänderungen"
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40 }} />,
      title: "Auf allen Geräten",
      description: "Arbeiten Sie am Computer, Tablet oder Smartphone"
    }
  ];

  const steps = [
    {
      number: "1",
      icon: <QuestionAnswerIcon sx={{ fontSize: 48 }} />,
      title: "Interview",
      description: "Beantworten Sie einfache Fragen zu Ihrer Situation. Keine Steuerkenntnisse erforderlich."
    },
    {
      number: "2",
      icon: <UploadFileIcon sx={{ fontSize: 48 }} />,
      title: "Dokumente",
      description: "Laden Sie Ihre Dokumente hoch. Wir extrahieren automatisch alle relevanten Daten."
    },
    {
      number: "3",
      icon: <SendIcon sx={{ fontSize: 48 }} />,
      title: "Einreichen",
      description: "Überprüfen Sie Ihre Steuererklärung und reichen Sie sie digital ein."
    }
  ];

  const stats = [
    { value: "50,000+", label: "Zufriedene Nutzer" },
    { value: "4.8/5", label: "Bewertung" },
    { value: "26", label: "Alle Kantone" },
    { value: "20 Min", label: "Durchschnittliche Zeit" }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "Kostenlos",
      description: "Perfekt zum Ausprobieren",
      features: [
        { included: true, text: "Interview & Profilerstellung" },
        { included: true, text: "Dokumenten-Checkliste" },
        { included: true, text: "Basis-Steuerberechnung" },
        { included: false, text: "Dokumenten-Upload" },
        { included: false, text: "Digitale Einreichung" }
      ],
      buttonText: "Kostenlos starten",
      buttonVariant: "outlined",
      featured: false
    },
    {
      name: "Standard",
      price: "CHF 39",
      description: "Komplette Steuererklärung",
      features: [
        { included: true, text: "Alles aus Basic" },
        { included: true, text: "Unbegrenzte Dokumente" },
        { included: true, text: "OCR-Datenextraktion" },
        { included: true, text: "Digitale Einreichung" },
        { included: true, text: "E-Mail Support" }
      ],
      buttonText: "Jetzt kaufen",
      buttonVariant: "contained",
      featured: true
    },
    {
      name: "Premium",
      price: "CHF 99",
      description: "Mit Expertenprüfung",
      features: [
        { included: true, text: "Alles aus Standard" },
        { included: true, text: "Prioritäts-Support" },
        { included: true, text: "Expertenprüfung" },
        { included: true, text: "Optimierungsvorschläge" },
        { included: true, text: "Telefon-Support" }
      ],
      buttonText: "Jetzt kaufen",
      buttonVariant: "outlined",
      featured: false
    }
  ];

  const footerLinks = [
    {
      title: "Produkt",
      links: [
        { text: "Funktionen", href: "/features" },
        { text: "Preise", href: "/pricing" },
        { text: "Kantone", href: "/cantons" },
        { text: "Sicherheit", href: "/security" }
      ]
    },
    {
      title: "Support",
      links: [
        { text: "Hilfe-Center", href: "/help" },
        { text: "Anleitungen", href: "/guides" },
        { text: "FAQ", href: "/faq" },
        { text: "Kontakt", href: "/contact" }
      ]
    },
    {
      title: "Rechtliches",
      links: [
        { text: "Datenschutz", href: "/privacy" },
        { text: "AGB", href: "/terms" },
        { text: "Impressum", href: "/impressum" }
      ]
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE5E8 100%)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '32px', md: '48px' },
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary'
                  }}
                >
                  Ihre Steuererklärung.
                  <br />
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    Einfach. Digital. Sicher.
                  </Box>
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    fontSize: { xs: '18px', md: '20px' },
                    lineHeight: 1.6
                  }}
                >
                  Die intelligente Lösung für Ihre Schweizer Steuererklärung.
                  In nur 20 Minuten zur fertigen Steuererklärung.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/register')}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Kostenlos starten
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    So funktioniert's
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Chip
                    icon={<CheckIcon />}
                    label="Keine Kreditkarte erforderlich"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                  <Chip
                    icon={<SecurityIcon />}
                    label="100% Datenschutz"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box sx={{ position: 'relative' }}>
                  <img
                    src="/images/tax-hero-illustration.svg"
                    alt="Tax filing illustration"
                    style={{ width: '100%', height: 'auto' }}
                  />
                  <Card
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: -20,
                      p: 2,
                      boxShadow: 3,
                      display: { xs: 'none', md: 'block' }
                    }}
                  >
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      CHF 389
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Durchschnittliche Rückerstattung
                    </Typography>
                  </Card>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Indicators */}
      <Box sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ p: 3, textAlign: 'center', minWidth: 150 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: 8, bgcolor: 'background.lightGrey' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontSize: { xs: '28px', md: '36px' } }}
          >
            In 3 einfachen Schritten zur Steuererklärung
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      textAlign: 'center',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        transition: 'transform 0.3s ease'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      {step.number}
                    </Avatar>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>{step.icon}</Box>
                    <Typography variant="h4" gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontSize: { xs: '28px', md: '36px' } }}
          >
            Alles was Sie brauchen
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      p: 3,
                      height: '100%',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: 8, bgcolor: 'background.lightGrey' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontSize: { xs: '28px', md: '36px' } }}
          >
            Transparente Preise
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      position: 'relative',
                      border: plan.featured ? '2px solid' : '1px solid',
                      borderColor: plan.featured ? 'primary.main' : 'border.grey',
                      transform: plan.featured ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {plan.featured && (
                      <Chip
                        label="Beliebteste Wahl"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)'
                        }}
                      />
                    )}
                    <Typography variant="h5" gutterBottom align="center">
                      {plan.name}
                    </Typography>
                    <Typography
                      variant="h2"
                      color="primary.main"
                      align="center"
                      sx={{ my: 2, fontWeight: 'bold' }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" paragraph>
                      {plan.description}
                    </Typography>
                    <List sx={{ mb: 3 }}>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <CheckIcon
                            sx={{
                              mr: 1,
                              color: feature.included ? 'success.main' : 'text.muted',
                              fontSize: 20
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: feature.included ? 'text.primary' : 'text.muted',
                              textDecoration: feature.included ? 'none' : 'line-through'
                            }}
                          >
                            {feature.text}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant={plan.buttonVariant}
                      fullWidth
                      size="large"
                      onClick={() => navigate('/register')}
                    >
                      {plan.buttonText}
                    </Button>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.footer', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                SwissAI Tax
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Die intelligente Lösung für Ihre Schweizer Steuererklärung.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton color="inherit" size="small">
                  <FacebookIcon />
                </IconButton>
                <IconButton color="inherit" size="small">
                  <LinkedInIcon />
                </IconButton>
                <IconButton color="inherit" size="small">
                  <TwitterIcon />
                </IconButton>
              </Stack>
            </Grid>
            {footerLinks.map((section, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Typography variant="h6" gutterBottom>
                  {section.title}
                </Typography>
                {section.links.map((link, idx) => (
                  <Box key={idx}>
                    <Typography
                      variant="body2"
                      component="a"
                      href={link.href}
                      sx={{
                        color: 'inherit',
                        textDecoration: 'none',
                        display: 'block',
                        py: 0.5,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {link.text}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Typography variant="body2" align="center">
            © 2024 SwissAI Tax. Alle Rechte vorbehalten. Made with ❤️ in Switzerland
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;