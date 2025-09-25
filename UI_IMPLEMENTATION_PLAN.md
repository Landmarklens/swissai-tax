# SwissAI Tax - UI Implementation Plan

## Executive Summary
Comprehensive UI implementation strategy for SwissAI Tax platform, adapting the existing HomeAI interface structure with Swiss tax-specific content, branding, and user flows. The implementation maintains the proven component architecture while customizing for tax filing workflows.

## Brand Identity & Design System

### Color Palette
```javascript
// Swiss-inspired professional color scheme
palette: {
  primary: {
    main: '#DC0018',        // Swiss red (main brand color)
    light: '#FF3333',       // Light red for hover states
    lighter: '#FFE5E8',     // Very light red for backgrounds
    dark: '#A50014',        // Dark red for emphasis
    lightMain: '#DC001833', // Transparent red overlay
  },
  secondary: {
    main: '#FFFFFF',        // Swiss white
    grey: '#F5F5F5',        // Light grey backgrounds
  },
  accent: {
    green: '#00A651',       // Success/completed green
    blue: '#003DA5',        // Swiss federal blue
    gold: '#FFB81C',        // Warning/attention gold
    purple: '#6B46C1',      // Premium features
  },
  text: {
    primary: '#1A1A1A',     // Almost black for main text
    secondary: '#666666',   // Grey for secondary text
    muted: '#999999',       // Muted text
    white: '#FFFFFF',       // White text on dark backgrounds
  },
  background: {
    default: '#FAFAFA',     // Light grey page background
    paper: '#FFFFFF',       // White card backgrounds
    gradient: 'linear-gradient(135deg, #DC0018 0%, #A50014 100%)',
    lightRed: '#FFE5E8',    // Light red tint
    lightGrey: '#F8F8F8',   // Very light grey
  },
  status: {
    error: '#D32F2F',       // Error red
    warning: '#FFA726',     // Warning orange
    info: '#29B6F6',        // Info blue
    success: '#66BB6A',     // Success green
  }
}
```

### Typography
```javascript
typography: {
  fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
  h1: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '36px',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '16px',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '14px',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '12px',
    lineHeight: 1.4,
  },
}
```

---

## Page Structure & Navigation

### 1. Homepage / Landing Page
**Route**: `/`
**Purpose**: Convert visitors into users with clear value proposition

#### Hero Section
```jsx
<HeroSection>
  <Container maxWidth="lg">
    <Grid container spacing={4} alignItems="center">
      <Grid item xs={12} md={6}>
        <Typography variant="h1" color="primary">
          Ihre Steuererklärung.
          Einfach. Digital. Sicher.
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mt: 3 }}>
          Die intelligente Lösung für Ihre Schweizer Steuererklärung.
          In nur 20 Minuten zur fertigen Steuererklärung.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="contained" size="large" href="/register">
            Kostenlos starten
          </Button>
          <Button variant="outlined" size="large" href="#how-it-works">
            So funktioniert's
          </Button>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', gap: 3 }}>
          <Chip icon={<CheckIcon />} label="Keine Kreditkarte erforderlich" />
          <Chip icon={<SecurityIcon />} label="100% Datenschutz" />
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ position: 'relative' }}>
          <img src="/hero-illustration.svg" alt="Tax filing illustration" />
          <FloatingCard sx={{ position: 'absolute', top: 20, right: -20 }}>
            <Typography variant="h3" color="primary">CHF 389</Typography>
            <Typography variant="body2">Durchschnittliche Rückerstattung</Typography>
          </FloatingCard>
        </Box>
      </Grid>
    </Grid>
  </Container>
</HeroSection>
```

#### Trust Indicators
```jsx
<TrustSection>
  <Container maxWidth="lg">
    <Grid container spacing={4} justifyContent="center">
      <Grid item>
        <StatCard>
          <Typography variant="h3">50,000+</Typography>
          <Typography variant="body2">Zufriedene Nutzer</Typography>
        </StatCard>
      </Grid>
      <Grid item>
        <StatCard>
          <Typography variant="h3">4.8/5</Typography>
          <Typography variant="body2">Bewertung</Typography>
        </StatCard>
      </Grid>
      <Grid item>
        <StatCard>
          <Typography variant="h3">26</Typography>
          <Typography variant="body2">Alle Kantone</Typography>
        </StatCard>
      </Grid>
      <Grid item>
        <StatCard>
          <Typography variant="h3">20 Min</Typography>
          <Typography variant="body2">Durchschnittliche Zeit</Typography>
        </StatCard>
      </Grid>
    </Grid>
  </Container>
</TrustSection>
```

#### How It Works
```jsx
<ProcessSection id="how-it-works">
  <Container maxWidth="lg">
    <Typography variant="h2" align="center" gutterBottom>
      In 3 einfachen Schritten zur Steuererklärung
    </Typography>
    <Grid container spacing={4} sx={{ mt: 4 }}>
      <Grid item xs={12} md={4}>
        <ProcessStep number="1">
          <QuestionAnswerIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h4">Interview</Typography>
          <Typography variant="body1">
            Beantworten Sie einfache Fragen zu Ihrer Situation.
            Keine Steuerkenntnisse erforderlich.
          </Typography>
        </ProcessStep>
      </Grid>
      <Grid item xs={12} md={4}>
        <ProcessStep number="2">
          <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h4">Dokumente</Typography>
          <Typography variant="body1">
            Laden Sie Ihre Dokumente hoch. Wir extrahieren
            automatisch alle relevanten Daten.
          </Typography>
        </ProcessStep>
      </Grid>
      <Grid item xs={12} md={4}>
        <ProcessStep number="3">
          <SendIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h4">Einreichen</Typography>
          <Typography variant="body1">
            Überprüfen Sie Ihre Steuererklärung und reichen
            Sie sie digital ein.
          </Typography>
        </ProcessStep>
      </Grid>
    </Grid>
  </Container>
</ProcessSection>
```

#### Features Grid
```jsx
<FeaturesSection>
  <Container maxWidth="lg">
    <Typography variant="h2" align="center" gutterBottom>
      Alles was Sie brauchen
    </Typography>
    <Grid container spacing={3} sx={{ mt: 4 }}>
      {[
        {
          icon: <AutoAwesomeIcon />,
          title: "KI-gestützte Optimierung",
          description: "Unsere KI findet automatisch alle möglichen Abzüge"
        },
        {
          icon: <LanguageIcon />,
          title: "Mehrsprachig",
          description: "Verfügbar in Deutsch, Französisch, Italienisch und Englisch"
        },
        {
          icon: <SecurityIcon />,
          title: "Schweizer Datenschutz",
          description: "Ihre Daten bleiben in der Schweiz, verschlüsselt und sicher"
        },
        {
          icon: <SupportAgentIcon />,
          title: "Experten-Support",
          description: "Steuerexperten beantworten Ihre Fragen im Chat"
        },
        {
          icon: <UpdateIcon />,
          title: "Immer aktuell",
          description: "Automatische Updates für alle Gesetzesänderungen"
        },
        {
          icon: <DevicesIcon />,
          title: "Auf allen Geräten",
          description: "Arbeiten Sie am Computer, Tablet oder Smartphone"
        }
      ].map((feature, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <FeatureCard>
            <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
            <Typography variant="h5" gutterBottom>{feature.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </FeatureCard>
        </Grid>
      ))}
    </Grid>
  </Container>
</FeaturesSection>
```

#### Pricing Section
```jsx
<PricingSection>
  <Container maxWidth="lg">
    <Typography variant="h2" align="center" gutterBottom>
      Transparente Preise
    </Typography>
    <Grid container spacing={4} sx={{ mt: 4 }} justifyContent="center">
      <Grid item xs={12} md={4}>
        <PricingCard>
          <Typography variant="h5">Basic</Typography>
          <Typography variant="h2">Kostenlos</Typography>
          <Typography variant="body2" color="text.secondary">
            Perfekt zum Ausprobieren
          </Typography>
          <List>
            <ListItem>✓ Interview & Profilerstellung</ListItem>
            <ListItem>✓ Dokumenten-Checkliste</ListItem>
            <ListItem>✓ Basis-Steuerberechnung</ListItem>
            <ListItem>✗ Dokumenten-Upload</ListItem>
            <ListItem>✗ Digitale Einreichung</ListItem>
          </List>
          <Button variant="outlined" fullWidth>Kostenlos starten</Button>
        </PricingCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <PricingCard featured>
          <Chip label="Beliebteste Wahl" color="primary" />
          <Typography variant="h5">Standard</Typography>
          <Typography variant="h2">CHF 39</Typography>
          <Typography variant="body2" color="text.secondary">
            Komplette Steuererklärung
          </Typography>
          <List>
            <ListItem>✓ Alles aus Basic</ListItem>
            <ListItem>✓ Unbegrenzte Dokumente</ListItem>
            <ListItem>✓ OCR-Datenextraktion</ListItem>
            <ListItem>✓ Digitale Einreichung</ListItem>
            <ListItem>✓ E-Mail Support</ListItem>
          </List>
          <Button variant="contained" fullWidth>Jetzt kaufen</Button>
        </PricingCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <PricingCard>
          <Typography variant="h5">Premium</Typography>
          <Typography variant="h2">CHF 99</Typography>
          <Typography variant="body2" color="text.secondary">
            Mit Expertenprüfung
          </Typography>
          <List>
            <ListItem>✓ Alles aus Standard</ListItem>
            <ListItem>✓ Prioritäts-Support</ListItem>
            <ListItem>✓ Expertenprüfung</ListItem>
            <ListItem>✓ Optimierungsvorschläge</ListItem>
            <ListItem>✓ Telefon-Support</ListItem>
          </List>
          <Button variant="outlined" fullWidth>Jetzt kaufen</Button>
        </PricingCard>
      </Grid>
    </Grid>
  </Container>
</PricingSection>
```

#### Footer
```jsx
<Footer>
  <Container maxWidth="lg">
    <Grid container spacing={4}>
      <Grid item xs={12} md={3}>
        <Logo />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Die intelligente Lösung für Ihre Schweizer Steuererklärung.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <IconButton><FacebookIcon /></IconButton>
          <IconButton><LinkedInIcon /></IconButton>
          <IconButton><TwitterIcon /></IconButton>
        </Box>
      </Grid>
      <Grid item xs={12} md={3}>
        <Typography variant="h6" gutterBottom>Produkt</Typography>
        <Link href="/features">Funktionen</Link>
        <Link href="/pricing">Preise</Link>
        <Link href="/cantons">Kantone</Link>
        <Link href="/security">Sicherheit</Link>
      </Grid>
      <Grid item xs={12} md={3}>
        <Typography variant="h6" gutterBottom>Support</Typography>
        <Link href="/help">Hilfe-Center</Link>
        <Link href="/guides">Anleitungen</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Kontakt</Link>
      </Grid>
      <Grid item xs={12} md={3}>
        <Typography variant="h6" gutterBottom>Rechtliches</Typography>
        <Link href="/privacy">Datenschutz</Link>
        <Link href="/terms">AGB</Link>
        <Link href="/impressum">Impressum</Link>
      </Grid>
    </Grid>
    <Divider sx={{ my: 4 }} />
    <Typography variant="body2" align="center" color="text.secondary">
      © 2024 SwissAI Tax. Alle Rechte vorbehalten. Made with ❤️ in Switzerland
    </Typography>
  </Container>
</Footer>
```

---

### 2. Dashboard (After Login)
**Route**: `/dashboard`
**Purpose**: Central hub for all tax filing activities

#### Layout Structure
```jsx
<DashboardLayout>
  <AppBar position="fixed">
    <Toolbar>
      <Logo />
      <Box sx={{ flexGrow: 1 }} />
      <LanguageSelector />
      <NotificationBell />
      <UserMenu />
    </Toolbar>
  </AppBar>
  
  <Drawer variant="permanent">
    <List>
      <ListItem button selected>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Übersicht" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><AssignmentIcon /></ListItemIcon>
        <ListItemText primary="Steuererklärung 2024" />
        <Chip label="In Bearbeitung" size="small" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><HistoryIcon /></ListItemIcon>
        <ListItemText primary="Frühere Jahre" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><FolderIcon /></ListItemIcon>
        <ListItemText primary="Dokumente" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><CalculateIcon /></ListItemIcon>
        <ListItemText primary="Steuerrechner" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText primary="Einstellungen" />
      </ListItem>
    </List>
  </Drawer>
  
  <Main>
    {/* Page content */}
  </Main>
</DashboardLayout>
```

#### Dashboard Content
```jsx
<Container maxWidth="xl">
  {/* Welcome Section */}
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4">Willkommen zurück, {userName}</Typography>
    <Typography variant="body1" color="text.secondary">
      Ihre Steuererklärung 2024 ist zu 65% fertiggestellt
    </Typography>
  </Box>

  {/* Progress Overview */}
  <Grid container spacing={3}>
    <Grid item xs={12} lg={8}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Steuererklärung 2024
          </Typography>
          <LinearProgress variant="determinate" value={65} sx={{ mb: 2, height: 8 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <StatusCard complete>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">Interview</Typography>
                <Typography variant="caption">Abgeschlossen</Typography>
              </StatusCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatusCard active>
                <RadioButtonUncheckedIcon color="primary" />
                <Typography variant="body2">Dokumente</Typography>
                <Typography variant="caption">8 von 12</Typography>
              </StatusCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatusCard>
                <RadioButtonUncheckedIcon color="disabled" />
                <Typography variant="body2">Prüfung</Typography>
                <Typography variant="caption">Ausstehend</Typography>
              </StatusCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatusCard>
                <RadioButtonUncheckedIcon color="disabled" />
                <Typography variant="body2">Einreichung</Typography>
                <Typography variant="caption">Ausstehend</Typography>
              </StatusCard>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained">Weiter bearbeiten</Button>
            <Button variant="outlined">Dokumente hochladen</Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} lg={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Geschätzte Rückerstattung
          </Typography>
          <Typography variant="h3" color="success.main">
            CHF 1,234
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Basierend auf Ihren bisherigen Angaben
          </Typography>
          <Divider sx={{ my: 2 }} />
          <List dense>
            <ListItem>
              <ListItemText primary="Einkommen" secondary="CHF 85,000" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Abzüge" secondary="CHF 12,500" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Steuersatz" secondary="18.5%" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Grid>
  </Grid>

  {/* Quick Actions */}
  <Grid container spacing={3} sx={{ mt: 2 }}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fehlende Dokumente
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText 
                primary="Lohnausweis 2024" 
                secondary="Arbeitgeber: TechCorp AG" 
              />
              <Button size="small">Hochladen</Button>
            </ListItem>
            <ListItem>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText 
                primary="3a Vorsorgebescheinigung" 
                secondary="Bank: UBS" 
              />
              <Button size="small">Hochladen</Button>
            </ListItem>
            <ListItem>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText 
                primary="Krankenkassen-Übersicht" 
                secondary="CSS Versicherung" 
              />
              <Button size="small">Hochladen</Button>
            </ListItem>
          </List>
          <Button variant="text" fullWidth>Alle anzeigen</Button>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hilfreiche Tipps
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Tipp des Tages</AlertTitle>
            Vergessen Sie nicht, Ihre Weiterbildungskosten als Abzug geltend zu machen!
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon><LightbulbIcon /></ListItemIcon>
              <ListItemText 
                primary="Homeoffice-Pauschale" 
                secondary="Neu: CHF 600 pro Jahr abziehbar" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><LightbulbIcon /></ListItemIcon>
              <ListItemText 
                primary="Kinderbetreuungskosten" 
                secondary="Bis CHF 10,000 pro Kind" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Container>
```

---

### 3. Tax Interview Page
**Route**: `/interview`
**Purpose**: Guide users through tax questionnaire

#### Interview Layout
```jsx
<InterviewLayout>
  {/* Progress Header */}
  <InterviewHeader>
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, mx: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestion / totalQuestions) * 100} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {currentQuestion} von {totalQuestions}
        </Typography>
      </Box>
      <Breadcrumbs>
        <Link>Persönliche Daten</Link>
        <Typography color="text.primary">Zivilstand</Typography>
      </Breadcrumbs>
    </Container>
  </InterviewHeader>

  {/* Question Content */}
  <Container maxWidth="md">
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Was ist Ihr Zivilstand am 31. Dezember 2024?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Ihr Zivilstand beeinflusst Ihren Steuertarif und mögliche Abzüge.
          </Typography>
          
          <RadioGroup value={civilStatus} onChange={handleChange}>
            <FormControlLabel 
              value="single" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Ledig</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nie verheiratet gewesen
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="married" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Verheiratet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    In eingetragener Ehe oder Partnerschaft
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="divorced" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Geschieden</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rechtskräftig geschieden
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="widowed" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Verwitwet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Partner/in verstorben
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          {civilStatus === 'married' && (
            <Collapse in={true}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Als Verheiratete/r benötigen wir zusätzliche Informationen über Ihren Partner.
              </Alert>
              <TextField
                fullWidth
                label="Name des Partners"
                variant="outlined"
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                label="AHV-Nummer des Partners"
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </Collapse>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />}>
              Zurück
            </Button>
            <Button 
              variant="contained" 
              endIcon={<ArrowForwardIcon />}
              disabled={!civilStatus}
            >
              Weiter
            </Button>
          </Box>
        </Card>
      </Grid>

      {/* Help Sidebar */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3, position: 'sticky', top: 20 }}>
          <Typography variant="h6" gutterBottom>
            <HelpOutlineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Hilfe
          </Typography>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Was bedeutet "Zivilstand"?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Der Zivilstand bezeichnet Ihren familienrechtlichen Status...
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Welches Datum zählt?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Massgebend ist Ihr Zivilstand am 31. Dezember des Steuerjahres...
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Brauchen Sie Hilfe?
          </Typography>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<ChatIcon />}
            sx={{ mt: 1 }}
          >
            Mit Experten chatten
          </Button>
        </Card>
      </Grid>
    </Grid>
  </Container>
</InterviewLayout>
```

---

### 4. Document Upload Page
**Route**: `/documents`
**Purpose**: Manage and upload tax documents

#### Document Management Interface
```jsx
<DocumentsPage>
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>
      Dokumente für Steuererklärung 2024
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Laden Sie die erforderlichen Dokumente hoch. Wir extrahieren automatisch alle relevanten Daten.
    </Typography>

    {/* Upload Zone */}
    <Card sx={{ mb: 4, p: 3, border: '2px dashed', borderColor: 'primary.main' }}>
      <DropzoneArea
        acceptedFiles={['.pdf', '.jpg', '.png']}
        dropzoneText="Dokumente hier ablegen oder klicken zum Auswählen"
        filesLimit={10}
        maxFileSize={10000000}
        showAlerts={false}
      />
    </Card>

    {/* Document Categories */}
    <Grid container spacing={3}>
      {documentCategories.map(category => (
        <Grid item xs={12} key={category.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: category.color, mr: 2 }}>
                  {category.icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{category.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </Box>
                <Chip 
                  label={`${category.uploaded}/${category.required}`}
                  color={category.uploaded === category.required ? 'success' : 'default'}
                />
              </Box>

              <Grid container spacing={2}>
                {category.documents.map(doc => (
                  <Grid item xs={12} sm={6} md={4} key={doc.id}>
                    <DocumentCard elevated={doc.status === 'uploaded'}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {doc.status === 'uploaded' ? (
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        ) : doc.status === 'processing' ? (
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : (
                          <RadioButtonUncheckedIcon color="disabled" sx={{ mr: 1 }} />
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">{doc.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.status === 'uploaded' ? doc.fileName : 'Nicht hochgeladen'}
                          </Typography>
                        </Box>
                        {doc.status === 'uploaded' ? (
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        ) : (
                          <Button size="small" variant="outlined">
                            Hochladen
                          </Button>
                        )}
                      </Box>
                      {doc.status === 'uploaded' && doc.extractedData && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Extrahierte Daten:
                          </Typography>
                          <Typography variant="body2">
                            Bruttolohn: CHF {doc.extractedData.grossSalary}
                          </Typography>
                        </Box>
                      )}
                    </DocumentCard>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Action Buttons */}
    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
      <Button variant="outlined" startIcon={<ArrowBackIcon />}>
        Zurück zum Interview
      </Button>
      <Button 
        variant="contained" 
        endIcon={<ArrowForwardIcon />}
        disabled={!allRequiredDocumentsUploaded}
      >
        Zur Steuerberechnung
      </Button>
    </Box>
  </Container>
</DocumentsPage>
```

---

### 5. Tax Calculation Results Page
**Route**: `/results`
**Purpose**: Display calculated taxes and optimization suggestions

#### Results Dashboard
```jsx
<ResultsPage>
  <Container maxWidth="lg">
    {/* Summary Hero */}
    <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <CardContent sx={{ p: 4, color: 'white' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Ihre Steuerberechnung 2024
            </Typography>
            <Typography variant="h2" sx={{ mb: 2 }}>
              CHF 12,456
            </Typography>
            <Typography variant="body1">
              Geschätzte Gesamtsteuerbelastung
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3 }}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                Rückerstattung
              </Typography>
              <Typography variant="h3" color="success.main">
                + CHF 1,234
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basierend auf Ihren Vorauszahlungen
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* Detailed Breakdown */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Steueraufschlüsselung
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Steuerbares Einkommen</TableCell>
                    <TableCell align="right">CHF 72,500</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bundessteuer</TableCell>
                    <TableCell align="right">CHF 2,456</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Kantonssteuer (ZH)</TableCell>
                    <TableCell align="right">CHF 6,234</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gemeindesteuer (Zürich)</TableCell>
                    <TableCell align="right">CHF 3,766</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>CHF 12,456</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Abzüge im Detail
            </Typography>
            <List>
              {deductions.map(deduction => (
                <ListItem key={deduction.id}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={deduction.name}
                    secondary={deduction.description}
                  />
                  <Typography variant="body1">
                    CHF {deduction.amount}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider />
            <ListItem>
              <ListItemText primary={<strong>Totale Abzüge</strong>} />
              <Typography variant="h6" color="primary">
                CHF 15,500
              </Typography>
            </ListItem>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        {/* Optimization Suggestions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TipsAndUpdatesIcon sx={{ mr: 1 }} />
              Optimierungsmöglichkeiten
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>3a Säule</AlertTitle>
              Sie könnten noch CHF 3,056 einzahlen und CHF 612 Steuern sparen.
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Weiterbildung</AlertTitle>
              Berufliche Weiterbildungskosten sind voll abzugsfähig.
            </Alert>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Nächste Schritte
            </Typography>
            <Stack spacing={2}>
              <Button variant="contained" fullWidth startIcon={<DownloadIcon />}>
                PDF herunterladen
              </Button>
              <Button variant="outlined" fullWidth startIcon={<PrintIcon />}>
                Drucken
              </Button>
              <Button variant="contained" color="success" fullWidth startIcon={<SendIcon />}>
                Digital einreichen
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
</ResultsPage>
```

---

### 6. User Profile & Settings
**Route**: `/settings`
**Purpose**: Manage user account and preferences

#### Settings Layout
```jsx
<SettingsPage>
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>
      Einstellungen
    </Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <List>
            <ListItem button selected>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Profil" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><SecurityIcon /></ListItemIcon>
              <ListItemText primary="Sicherheit" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText primary="Benachrichtigungen" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><PaymentIcon /></ListItemIcon>
              <ListItemText primary="Zahlungen" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><LanguageIcon /></ListItemIcon>
              <ListItemText primary="Sprache" />
            </ListItem>
          </List>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={9}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Persönliche Informationen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vorname"
                  defaultValue="Max"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nachname"
                  defaultValue="Mustermann"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  defaultValue="max.mustermann@example.com"
                  variant="outlined"
                  type="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  defaultValue="+41 79 123 45 67"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="AHV-Nummer"
                  defaultValue="756.1234.5678.90"
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Adresse
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Strasse und Hausnummer"
                  defaultValue="Bahnhofstrasse 1"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="PLZ"
                  defaultValue="8001"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Ort"
                  defaultValue="Zürich"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Kanton</InputLabel>
                  <Select defaultValue="ZH" label="Kanton">
                    <MenuItem value="ZH">Zürich</MenuItem>
                    <MenuItem value="BE">Bern</MenuItem>
                    <MenuItem value="LU">Luzern</MenuItem>
                    {/* More cantons */}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" sx={{ mr: 2 }}>Abbrechen</Button>
              <Button variant="contained">Speichern</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
</SettingsPage>
```

---

## Component Library

### Reusable Components

#### 1. QuestionCard Component
```jsx
const QuestionCard = ({ question, value, onChange, onNext, onBack }) => {
  const getInputComponent = () => {
    switch(question.type) {
      case 'single_choice':
        return (
          <RadioGroup value={value} onChange={onChange}>
            {question.options.map(option => (
              <FormControlLabel 
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        );
      case 'multiple_choice':
        return (
          <FormGroup>
            {question.options.map(option => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox 
                    checked={value?.includes(option.value) || false}
                    onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        );
      case 'text':
        return (
          <TextField
            fullWidth
            value={value || ''}
            onChange={onChange}
            variant="outlined"
            placeholder={question.placeholder}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={value || ''}
            onChange={onChange}
            variant="outlined"
            InputProps={{
              startAdornment: question.prefix && (
                <InputAdornment position="start">{question.prefix}</InputAdornment>
              ),
              endAdornment: question.suffix && (
                <InputAdornment position="end">{question.suffix}</InputAdornment>
              ),
            }}
          />
        );
      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={onChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {question.title}
        </Typography>
        {question.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {question.description}
          </Typography>
        )}
        <Box sx={{ mt: 3 }}>
          {getInputComponent()}
        </Box>
        {question.helpText && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {question.helpText}
          </Alert>
        )}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={onBack}
            disabled={!question.canGoBack}
          >
            Zurück
          </Button>
          <Button 
            variant="contained" 
            onClick={onNext}
            disabled={!value && question.required}
          >
            Weiter
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
```

#### 2. Document Upload Component
```jsx
const DocumentUploader = ({ 
  documentType, 
  onUpload, 
  onSuccess, 
  maxSize = 10000000,
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png']
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.size > maxSize) {
      toast.error('Datei ist zu gross. Maximum: 10MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const response = await uploadDocument(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      toast.success('Dokument erfolgreich hochgeladen');
      onSuccess(response.data);
    } catch (error) {
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card 
      sx={{ 
        p: 3, 
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'grey.300',
        bgcolor: dragActive ? 'primary.lighter' : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.lighter'
        }
      }}
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        hidden
        accept={acceptedFormats.join(',')}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%' }}>
        <Box sx={{ textAlign: 'center' }}>
          {uploading ? (
            <>
              <CircularProgress variant="determinate" value={progress} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Hochladen... {progress}%
              </Typography>
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6">
                Dokument hierher ziehen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                oder klicken zum Auswählen
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Unterstützte Formate: PDF, JPG, PNG (max. 10MB)
              </Typography>
            </>
          )}
        </Box>
      </label>
    </Card>
  );
};
```

#### 3. Progress Tracker Component
```jsx
const ProgressTracker = ({ steps, currentStep }) => {
  return (
    <Stepper activeStep={currentStep} alternativeLabel>
      {steps.map((step, index) => (
        <Step key={step.id}>
          <StepLabel
            StepIconComponent={() => (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 
                    index < currentStep ? 'success.main' :
                    index === currentStep ? 'primary.main' :
                    'grey.300',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {index < currentStep ? <CheckIcon /> : index + 1}
              </Box>
            )}
          >
            <Typography 
              variant="body2" 
              color={index === currentStep ? 'text.primary' : 'text.secondary'}
            >
              {step.label}
            </Typography>
            {step.description && (
              <Typography variant="caption" color="text.secondary">
                {step.description}
              </Typography>
            )}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};
```

---

## Mobile Responsiveness

### Responsive Design Patterns
```jsx
// Mobile-first breakpoints
const mobileStyles = {
  // Mobile Navigation
  '.MobileNav': {
    display: { xs: 'block', md: 'none' },
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    bgcolor: 'background.paper',
    borderTop: '1px solid',
    borderColor: 'divider',
    zIndex: 1000
  },

  // Responsive Typography
  '.ResponsiveTitle': {
    fontSize: { xs: '24px', sm: '32px', md: '48px' },
    lineHeight: { xs: 1.2, md: 1.1 }
  },

  // Responsive Spacing
  '.ResponsiveContainer': {
    px: { xs: 2, sm: 3, md: 4 },
    py: { xs: 3, sm: 4, md: 6 }
  },

  // Responsive Grid
  '.ResponsiveGrid': {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)'
    },
    gap: { xs: 2, md: 3 }
  }
};
```

### Mobile-Specific Components
```jsx
// Mobile Bottom Navigation
const MobileBottomNav = () => (
  <BottomNavigation
    sx={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0,
      display: { xs: 'flex', md: 'none' }
    }}
  >
    <BottomNavigationAction label="Dashboard" icon={<HomeIcon />} />
    <BottomNavigationAction label="Interview" icon={<AssignmentIcon />} />
    <BottomNavigationAction label="Dokumente" icon={<FolderIcon />} />
    <BottomNavigationAction label="Profil" icon={<PersonIcon />} />
  </BottomNavigation>
);

// Mobile Drawer Menu
const MobileDrawer = ({ open, onClose }) => (
  <SwipeableDrawer
    anchor="left"
    open={open}
    onClose={onClose}
    onOpen={() => {}}
    sx={{ display: { xs: 'block', md: 'none' } }}
  >
    <Box sx={{ width: 280 }}>
      {/* Mobile menu content */}
    </Box>
  </SwipeableDrawer>
);
```

---

## Animations & Transitions

### Page Transitions
```jsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const PageTransition = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

### Micro-interactions
```css
/* Button hover effects */
.interactive-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(220, 0, 24, 0.2);
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* Progress animations */
@keyframes progressPulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.progress-active {
  animation: progressPulse 2s ease-in-out infinite;
}
```

---

## Implementation Status

### ✅ Completed Components

1. **Theme System** (src/theme/theme.js)
   - Swiss-inspired color palette (Red/White)
   - Professional typography with Inter font
   - Material-UI component theming
   - Custom button styles with hover effects

2. **Homepage/Landing Page** (src/pages/Homepage/Homepage.js)
   - Hero section with value proposition
   - Trust indicators (50,000+ users, 4.8/5 rating)
   - 3-step process explanation
   - Features grid (6 key features)
   - Pricing section with 3 tiers
   - Footer with links

3. **Dashboard Page** (src/pages/Dashboard/Dashboard.js)
   - Sidebar navigation with icons
   - Progress overview card (65% complete)
   - Estimated refund display
   - Missing documents list
   - Helpful tips section
   - Responsive layout with drawer

4. **Reusable Components**
   - **QuestionCard** (src/components/QuestionCard/QuestionCard.js)
     - Multiple input types (radio, checkbox, text, number, date, yes/no)
     - Validation support
     - Help text and examples
     - Motion animations

   - **DocumentUploader** (src/components/DocumentUploader/DocumentUploader.js)
     - Drag & drop support
     - Progress tracking
     - File validation
     - Upload history

   - **ProgressTracker** (src/components/ProgressTracker/ProgressTracker.js)
     - Desktop stepper
     - Mobile progress bar
     - Step navigation

5. **Interview Page** (src/pages/Interview/InterviewPage.js)
   - Question flow with branching logic
   - Progress tracking header
   - Help sidebar with FAQs
   - Save progress functionality
   - Breadcrumb navigation

6. **Routing Structure** (src/constants/lazyRoutes.js)
   - Updated with new pages
   - Lazy loading implementation
   - Protected routes

### 🚧 In Progress

- Documents Upload Page
- Tax Results Page
- Settings Page
- Layout components refinement

## Implementation Timeline

### Phase 1: Foundation (Week 1) ✅
- ✅ Set up theme with Swiss color palette
- ✅ Create main page components
- ✅ Implement responsive grid system
- ✅ Set up routing structure

### Phase 2: Landing Page (Week 2)
- Hero section with CTAs
- Features showcase
- Pricing cards
- Trust indicators
- Contact form

### Phase 3: Authentication (Week 3)
- Login/Register pages
- Password reset flow
- Two-factor authentication UI
- Social login integration

### Phase 4: Dashboard (Week 4)
- Main dashboard layout
- Progress tracking widgets
- Quick action cards
- Notifications panel

### Phase 5: Interview Flow (Week 5-6)
- Question card components
- Progress indicator
- Branching logic UI
- Answer validation feedback
- Help sidebar

### Phase 6: Document Management (Week 7)
- Upload interface with drag-drop
- Document categorization
- OCR status indicators
- Document preview

### Phase 7: Results & Calculations (Week 8)
- Tax calculation display
- Breakdown visualizations
- Optimization suggestions
- PDF generation UI

### Phase 8: Polish & Testing (Week 9)
- Cross-browser testing
- Mobile responsiveness
- Performance optimization
- Accessibility audit
- User testing feedback

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance
```jsx
// Semantic HTML
<nav role="navigation" aria-label="Hauptnavigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/interview" aria-current="page">Interview</a></li>
  </ul>
</nav>

// ARIA labels
<Button 
  aria-label="Nächste Frage"
  aria-describedby="question-help"
>
  Weiter
</Button>

// Keyboard navigation
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleSubmit();
  }
  if (event.key === 'Escape') {
    handleCancel();
  }
};

// Focus management
useEffect(() => {
  if (questionRef.current) {
    questionRef.current.focus();
  }
}, [currentQuestion]);

// Screen reader announcements
<div role="status" aria-live="polite" aria-atomic="true">
  {uploadStatus === 'success' && 'Dokument erfolgreich hochgeladen'}
</div>
```

---

## Performance Optimization

### Code Splitting
```javascript
// Lazy load heavy components
const TaxCalculator = lazy(() => import('./features/TaxCalculator'));
const DocumentProcessor = lazy(() => import('./features/DocumentProcessor'));

// Route-based splitting
const routes = [
  {
    path: '/interview',
    component: lazy(() => import('./pages/Interview'))
  },
  {
    path: '/documents',
    component: lazy(() => import('./pages/Documents'))
  }
];
```

### Image Optimization
```jsx
// Responsive images
<picture>
  <source 
    media="(max-width: 768px)" 
    srcSet="/hero-mobile.webp" 
    type="image/webp"
  />
  <source 
    media="(min-width: 769px)" 
    srcSet="/hero-desktop.webp" 
    type="image/webp"
  />
  <img 
    src="/hero-fallback.jpg" 
    alt="SwissAI Tax Hero" 
    loading="lazy"
  />
</picture>
```

---

## Conclusion

This comprehensive UI implementation plan provides:

1. **Complete page designs** for all major sections
2. **Reusable component library** for consistency
3. **Swiss-themed branding** with appropriate colors and imagery
4. **Mobile-responsive layouts** for all screen sizes
5. **Accessibility features** for inclusive design
6. **Performance optimizations** for fast loading
7. **Clear implementation timeline** for development

The design maintains the proven structure of the existing HomeAI application while adapting content, colors, and workflows specifically for Swiss tax filing. All components are built with Material-UI for consistency and can be implemented incrementally following the provided timeline.