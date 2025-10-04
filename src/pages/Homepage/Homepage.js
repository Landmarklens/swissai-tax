import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  List,
  ListItem,
  IconButton,
  Divider,
  Avatar,
  Stack,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  Check as CheckIcon,
  Security as SecurityIcon,
  QuestionAnswer as QuestionAnswerIcon,
  UploadFile as UploadFileIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Language as LanguageIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  ArrowForward as ArrowForwardIcon,
  Map as MapIcon,
  Calculate as CalculateIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoCarousel from '../../components/sections/videoSection/VideoCarousel';
import FAQSection from '../../components/sections/FAQ/FAQSection';

const Homepage = () => {
  const navigate = useNavigate();
  const [selectedCanton, setSelectedCanton] = React.useState('');

  const cantons = [
    'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft',
    'Basel-Stadt', 'Bern', 'Fribourg', 'Geneva', 'Glarus', 'Graubünden',
    'Jura', 'Lucerne', 'Neuchâtel', 'Nidwalden', 'Obwalden', 'Schaffhausen',
    'Schwyz', 'Solothurn', 'St. Gallen', 'Thurgau', 'Ticino', 'Uri',
    'Valais', 'Vaud', 'Zug', 'Zürich'
  ];

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: "AI-Powered Optimization",
      description: "Our AI automatically finds all possible deductions for maximum refunds"
    },
    {
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      title: "All 26 Cantons",
      description: "Complete support for every Swiss canton's tax requirements"
    },
    {
      icon: <LanguageIcon sx={{ fontSize: 40 }} />,
      title: "4 Languages",
      description: "Available in German, French, Italian and English"
    },
    {
      icon: <CalculateIcon sx={{ fontSize: 40 }} />,
      title: "Smart Deductions",
      description: "Automatic calculation of commute, insurance, and home office deductions"
    },
    {
      icon: <TimerIcon sx={{ fontSize: 40 }} />,
      title: "20 Minutes",
      description: "Complete your entire tax return in just 20 minutes"
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Swiss Security",
      description: "Your data stays in Switzerland, encrypted and secure"
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
    { value: "5M+", label: "Tax returns annually" },
    { value: "CHF 892", label: "Average refund" },
    { value: "26", label: "All cantons covered" },
    { value: "20 Min", label: "Completion time" }
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "CHF 0",
      description: "Try before you buy",
      features: [
        { included: true, text: "Tax interview & assessment" },
        { included: true, text: "Document checklist" },
        { included: true, text: "Basic tax calculation" },
        { included: true, text: "Deduction suggestions" },
        { included: false, text: "Document upload & OCR" },
        { included: false, text: "Official submission" }
      ],
      buttonText: "Start Free",
      buttonVariant: "outlined",
      featured: false
    },
    {
      name: "Standard",
      price: "CHF 49",
      description: "Complete tax filing",
      features: [
        { included: true, text: "Everything in Free Trial" },
        { included: true, text: "Unlimited document uploads" },
        { included: true, text: "OCR data extraction" },
        { included: true, text: "All canton forms" },
        { included: true, text: "Digital submission" },
        { included: true, text: "Email support" }
      ],
      buttonText: "Get Started",
      buttonVariant: "contained",
      featured: true
    },
    {
      name: "Professional",
      price: "CHF 99",
      description: "Complex returns + review",
      features: [
        { included: true, text: "Everything in Standard" },
        { included: true, text: "Securities & investments" },
        { included: true, text: "Real estate income" },
        { included: true, text: "Expert review" },
        { included: true, text: "Priority support" },
        { included: true, text: "Phone support" }
      ],
      buttonText: "Go Professional",
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
          background: 'linear-gradient(135deg, #003DA5 0%, #0052CC 100%)',
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
                    color: '#FFFFFF'
                  }}
                >
                  Ihre Steuererklärung.
                  <br />
                  <Box component="span" sx={{ color: '#FFD700' }}>
                    Einfach. Digital. Sicher.
                  </Box>
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    fontSize: { xs: '18px', md: '20px' },
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  Die intelligente Lösung für Ihre Schweizer Steuererklärung.
                  In nur 20 Minuten zur fertigen Steuererklärung.
                </Typography>

                {/* Canton Selector */}
                <FormControl sx={{ mb: 3, minWidth: 250 }}>
                  <Select
                    value={selectedCanton}
                    onChange={(e) => setSelectedCanton(e.target.value)}
                    displayEmpty
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '& .MuiSelect-select': {
                        py: 1.5,
                        fontSize: '16px'
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Wählen Sie Ihren Kanton...</em>
                    </MenuItem>
                    {cantons.map((canton) => (
                      <MenuItem key={canton} value={canton}>
                        {canton}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/register')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      bgcolor: '#FFD700',
                      color: '#003DA5',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#FFC700'
                      }
                    }}
                  >
                    Kostenlos starten
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      color: '#FFFFFF',
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    So funktioniert's
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip
                    icon={<CheckIcon />}
                    label="No credit card required"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      '& .MuiChip-icon': {
                        color: '#FFD700'
                      }
                    }}
                  />
                  <Chip
                    icon={<MapIcon />}
                    label="All 26 cantons"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      '& .MuiChip-icon': {
                        color: '#FFD700'
                      }
                    }}
                  />
                  <Chip
                    icon={<SecurityIcon />}
                    label="Swiss data protection"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      '& .MuiChip-icon': {
                        color: '#FFD700'
                      }
                    }}
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

      {/* Video Carousel Section */}
      <VideoCarousel />

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
            3 Simple Steps to Complete Your Tax Return
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
            Everything You Need for Tax Filing
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
            Simple, Transparent Pricing
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

      {/* FAQ Section */}
      <FAQSection />

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