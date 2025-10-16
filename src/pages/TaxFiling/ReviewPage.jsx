import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  NavigateNext as NavigateNextIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import EditableField from './components/EditableField';
import TaxCalculationBreakdown from './components/TaxCalculationBreakdown';
import { api } from '../../services/api';

// Helper component for fields with explanations
const FieldWithHelp = ({ label, explanation, children }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
      <Typography variant="body2" fontWeight={500} color="text.secondary">
        {label}
      </Typography>
      {explanation && (
        <Tooltip
          title={explanation}
          arrow
          placement="top"
          sx={{ maxWidth: 400 }}
        >
          <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
        </Tooltip>
      )}
    </Box>
    {children}
  </Box>
);

const ReviewPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { filingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Explanation texts
  const explanations = {
    fullName: "Your legal name as it appears on official documents. This must match your passport or ID card exactly for tax filing purposes.",
    ahvNumber: "Your Swiss social security number (AHV/AVS). This 13-digit number uniquely identifies you in Switzerland's social security system and is required for all tax filings.",
    canton: "Your canton of residence determines which cantonal tax rates apply to you. Different cantons have different tax rates and deductions.",
    postalCode: "Your postal code helps determine your exact municipality for calculating municipal tax rates, which can vary significantly even within the same canton.",
    maritalStatus: "Your civil status on December 31st of the tax year. Married couples can benefit from joint taxation (Splitting), which often results in lower taxes.",
    spouseName: "Your spouse's legal name. When filing jointly, both spouses' information is required on the tax declaration.",
    spouseAHV: "Your spouse's AHV number. Required for joint taxation to link both individuals' income and deductions.",
    numChildren: "The number of dependent children gives you child deductions (CHF 6,600 per child federally in 2024), significantly reducing your taxable income.",
    numEmployers: "The number of employers affects how your income is taxed. Multiple employers may require additional documentation and affect your tax withholding.",
    employmentType: "Whether you're employed, self-employed, or both affects which deductions you can claim and how your income is calculated for tax purposes.",
    employmentCertificate: "Your employment certificate (Lohnausweis) is the official document showing your annual income, tax withholdings, and benefits. It's required for filing.",
    commuteDistance: "Daily commute costs are tax-deductible in Switzerland. The distance determines the deduction amount (up to CHF 3,000 for public transport).",
    mealExpenses: "If you can't eat at home due to work, meal costs may be deductible (typically CHF 15 per day, CHF 3,200 annually).",
    pillar3a: "Private pension contributions (Pillar 3a) are fully tax-deductible up to CHF 7,056 for employees with a pension fund (2024 limit).",
    pillar2Buyback: "Voluntary contributions to your pension fund (Pillar 2) to fill gaps are fully tax-deductible and reduce your taxable income.",
    healthInsurance: "Mandatory health insurance premiums are tax-deductible. Maximum deductions vary by canton (e.g., ZH: CHF 2,600 single, CHF 5,200 married in 2024).",
    alimony: "Alimony payments to former spouses are fully tax-deductible for the payer and taxable for the recipient.",
    donations: "Charitable donations to recognized organizations are tax-deductible, typically between 20-100% depending on the organization and canton.",
    medicalExpenses: "Medical and dental expenses exceeding 5% of your net income are tax-deductible (illness and accident costs not covered by insurance).",
    propertyType: "Whether you own a primary residence, rental property, or vacation home affects taxation. Rental income is taxable, but related expenses are deductible.",
    rentalIncome: "Rental income from properties you own is fully taxable but you can deduct maintenance costs, mortgage interest, and depreciation.",
    securitiesAccount: "Securities accounts and investment income must be declared. Swiss residents pay wealth tax on securities and income tax on dividends/interest.",
    dividendsInterest: "Dividend and interest income is taxable. Switzerland applies partial taxation relief on dividends to avoid double taxation.",
    crypto: "Cryptocurrency holdings are subject to wealth tax in Switzerland, and crypto trading profits may be taxable income (except for private wealth management)."
  };

  const loadReviewData = useCallback(async () => {
    try {
      setLoading(true);
      // Get filing ID from URL params, location state, or localStorage
      const effectiveFilingId = filingId || location.state?.session_id || localStorage.getItem('currentSessionId');

      if (!effectiveFilingId) {
        navigate(`/${i18n.language}/filings`);
        return;
      }

      // Fetch review data from new comprehensive endpoint
      const reviewResponse = await api.get(`/api/interview/filings/${effectiveFilingId}/review`);

      if (!reviewResponse.data.success || !reviewResponse.data.review_data) {
        throw new Error('Failed to load review data');
      }

      const reviewData = reviewResponse.data.review_data;
      const personal = reviewData.personal || {};
      const employment = reviewData.employment || {};
      const deductions = reviewData.deductions || {};

      // Build session data from review data
      const sessionDataObj = {
        session_id: effectiveFilingId,
        taxYear: reviewData.tax_year,
        canton: reviewData.canton,
        status: reviewData.status,
        personal: {
          fullName: personal.full_name || '',
          ahvNumber: personal.ahv_number || '',
          maritalStatus: personal.marital_status || '',
          canton: personal.canton || reviewData.canton || '',
          municipality: personal.municipality || '',
          postalCode: personal.postal_code || '',
          spouse: personal.spouse || null,
          otherCantons: personal.other_cantons || [],
          children: personal.children || null
        },
        employment: {
          numEmployers: employment.num_employers || 0,
          employmentType: employment.employment_type || '',
          employerDetails: employment.employer_details || [],
          hasEmploymentCertificate: employment.has_employment_certificate || false,
          selfEmployment: employment.self_employment || null
        },
        property: reviewData.property || {},
        investments: reviewData.investments || {},
        deductions: {
          commuteDistance: deductions.commute_distance || '',
          hasMealExpenses: deductions.has_meal_expenses || false,
          pillar3a: deductions.has_pillar3a || false,
          pillar2Buyback: deductions.has_pillar2_buyback || false,
          healthInsurance: deductions.health_insurance || null,
          paysAlimony: deductions.pays_alimony || false,
          alimonyAmount: deductions.alimony_amount || 0,
          hasDonations: deductions.has_donations || false,
          hasMedicalExpenses: deductions.has_medical_expenses || false
        },
        otherIncome: reviewData.other_income || {},
        rawAnswers: reviewData.raw_answers || {}
      };

      setSessionData(sessionDataObj);
      // Set calculation to null since we don't have it yet
      // TODO: Add calculation fetching or trigger calculation
      setCalculation(null);
      setError(null);
    } catch (err) {
      setError(t('review.error_load'));
      if (process.env.NODE_ENV === 'development') {
        console.error('Review load error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filingId, location.state?.session_id, navigate, i18n.language, t]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleFieldUpdate = async (section, field, value) => {
    try {
      const sessionId = sessionData.session_id;
      await api.put(`/api/interview/${sessionId}/update`, {
        section,
        field,
        value
      });

      // Reload data to get updated calculation
      await loadReviewData();
    } catch (err) {
      console.error('Failed to update field:', err);
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const sessionId = sessionData.session_id;
      const response = await api.get(`/api/interview/${sessionId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax-filing-${sessionData.taxYear}-preview.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF download failed:', err);
      }
      setError(t('review.error_pdf'));
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleContinue = () => {
    // Navigate to payment or submission based on plan
    if (sessionData?.requiresPayment) {
      navigate(`/${i18n.language}/tax-filing/payment`, {
        state: {
          session_id: sessionData.session_id,
          calculation: calculation
        }
      });
    } else {
      navigate(`/${i18n.language}/tax-filing/submit`, {
        state: {
          session_id: sessionData.session_id,
          calculation: calculation
        }
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <MuiLink component={Link} to={`/${i18n.language}/filings`} underline="hover" color="inherit">
            {t('Tax Filings')}
          </MuiLink>
          <MuiLink component={Link} to={`/${i18n.language}/tax-filing/interview`} underline="hover" color="inherit">
            {t('Interview')}
          </MuiLink>
          <Typography color="text.primary">{t('review.title')}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {t('review.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('review.subtitle')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={downloadingPDF ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {t('Download PDF Preview')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Personal & Income Info */}
          <Grid item xs={12} md={7}>
            {/* Personal Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {t('review.personal_info')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/${i18n.language}/tax-filing/interview`, { state: { section: 'personal' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <FieldWithHelp label={t('filing.full_name')} explanation={explanations.fullName}>
                    <EditableField
                      label=""
                      value={sessionData?.personal?.fullName || ''}
                      onSave={(value) => handleFieldUpdate('personal', 'fullName', value)}
                    />
                  </FieldWithHelp>

                  <FieldWithHelp label="AHV Number" explanation={explanations.ahvNumber}>
                    <EditableField
                      label=""
                      value={sessionData?.personal?.ahvNumber || ''}
                      onSave={(value) => handleFieldUpdate('personal', 'ahvNumber', value)}
                    />
                  </FieldWithHelp>

                  <FieldWithHelp label={t('filing.canton')} explanation={explanations.canton}>
                    <EditableField
                      label=""
                      value={sessionData?.personal?.canton || ''}
                      onSave={(value) => handleFieldUpdate('personal', 'canton', value)}
                    />
                  </FieldWithHelp>

                  <FieldWithHelp label="Postal Code" explanation={explanations.postalCode}>
                    <EditableField
                      label=""
                      value={sessionData?.personal?.postalCode || ''}
                      onSave={(value) => handleFieldUpdate('personal', 'postalCode', value)}
                    />
                  </FieldWithHelp>

                  <FieldWithHelp label={t('filing.filing_status')} explanation={explanations.maritalStatus}>
                    <EditableField
                      label=""
                      value={sessionData?.personal?.maritalStatus || ''}
                      onSave={(value) => handleFieldUpdate('personal', 'maritalStatus', value)}
                    />
                  </FieldWithHelp>

                  {sessionData?.personal?.spouse && (
                    <>
                      <Divider />
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>Spouse Information</Typography>
                        <Tooltip
                          title="When married, Swiss tax law allows joint taxation (Splitting system), which can significantly reduce your tax burden compared to individual taxation."
                          arrow
                          placement="top"
                        >
                          <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                        </Tooltip>
                      </Box>

                      <FieldWithHelp label="Spouse Name" explanation={explanations.spouseName}>
                        <EditableField
                          label=""
                          value={sessionData?.personal?.spouse?.name || ''}
                          onSave={(value) => handleFieldUpdate('personal', 'spouse.name', value)}
                        />
                      </FieldWithHelp>

                      <FieldWithHelp label="Spouse AHV" explanation={explanations.spouseAHV}>
                        <EditableField
                          label=""
                          value={sessionData?.personal?.spouse?.ahv_number || ''}
                          onSave={(value) => handleFieldUpdate('personal', 'spouse.ahv_number', value)}
                        />
                      </FieldWithHelp>
                    </>
                  )}

                  {sessionData?.personal?.children && (
                    <>
                      <Divider />
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>Children</Typography>
                        <Tooltip
                          title="Children provide significant tax deductions. Each child gives you CHF 6,600 federally plus additional cantonal deductions. Children in education may qualify for even higher deductions."
                          arrow
                          placement="top"
                        >
                          <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                        </Tooltip>
                      </Box>

                      <FieldWithHelp label={t('filing.dependents')} explanation={explanations.numChildren}>
                        <EditableField
                          label=""
                          value={sessionData?.personal?.children?.count || 0}
                          type="number"
                          onSave={(value) => handleFieldUpdate('personal', 'children.count', value)}
                        />
                      </FieldWithHelp>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="h6" fontWeight={600}>
                      Employment
                    </Typography>
                    <Tooltip
                      title="Employment information is crucial for calculating your income tax. Your employment certificate (Lohnausweis) shows your gross income, social security contributions, and any benefits."
                      arrow
                      placement="top"
                    >
                      <HelpOutlineIcon sx={{ fontSize: 18, color: 'primary.main', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/${i18n.language}/tax-filing/interview`, { state: { section: 'employment' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <FieldWithHelp label="Number of Employers" explanation={explanations.numEmployers}>
                    <EditableField
                      label=""
                      value={sessionData?.employment?.numEmployers || 0}
                      type="number"
                      onSave={(value) => handleFieldUpdate('employment', 'numEmployers', value)}
                    />
                  </FieldWithHelp>

                  {sessionData?.employment?.employmentType && (
                    <FieldWithHelp label="Employment Type" explanation={explanations.employmentType}>
                      <EditableField
                        label=""
                        value={sessionData?.employment?.employmentType || ''}
                        onSave={(value) => handleFieldUpdate('employment', 'employmentType', value)}
                      />
                    </FieldWithHelp>
                  )}

                  {sessionData?.employment?.hasEmploymentCertificate !== undefined && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Employment Certificate: {sessionData?.employment?.hasEmploymentCertificate ? 'Yes' : 'No'}
                      </Typography>
                      <Tooltip
                        title={explanations.employmentCertificate}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Property & Investments */}
            {(sessionData?.property?.owns_property || sessionData?.investments?.has_securities_account) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Property & Investments
                    </Typography>
                    <Tooltip
                      title="Real estate and investment assets are subject to wealth tax in Switzerland, and income from these sources is taxable. Proper documentation helps maximize deductions."
                      arrow
                      placement="top"
                    >
                      <HelpOutlineIcon sx={{ fontSize: 18, color: 'primary.main', cursor: 'help' }} />
                    </Tooltip>
                  </Box>

                  <Box display="flex" flexDirection="column" gap={2}>
                    {sessionData?.property?.owns_property && (
                      <>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>Property</Typography>
                          <Tooltip
                            title={explanations.propertyType}
                            arrow
                            placement="top"
                          >
                            <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body2">Type: {sessionData?.property?.property_type || 'N/A'}</Typography>
                        <Typography variant="body2">Usage: {sessionData?.property?.uses_property || 'N/A'}</Typography>
                        {sessionData?.property?.has_rental_income && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2">
                              Rental Income: CHF {sessionData?.property?.rental_amount || 0}
                            </Typography>
                            <Tooltip
                              title={explanations.rentalIncome}
                              arrow
                              placement="top"
                            >
                              <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                            </Tooltip>
                          </Box>
                        )}
                      </>
                    )}
                    {sessionData?.investments?.has_securities_account && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>Investments</Typography>
                          <Tooltip
                            title={explanations.securitiesAccount}
                            arrow
                            placement="top"
                          >
                            <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body2">
                          Securities Account: Yes
                        </Typography>
                        {sessionData?.investments?.has_dividend_interest && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2">
                              Has Dividends/Interest: Yes
                            </Typography>
                            <Tooltip
                              title={explanations.dividendsInterest}
                              arrow
                              placement="top"
                            >
                              <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                            </Tooltip>
                          </Box>
                        )}
                        {sessionData?.investments?.has_crypto && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2">
                              Has Cryptocurrency: Yes
                            </Typography>
                            <Tooltip
                              title={explanations.crypto}
                              arrow
                              placement="top"
                            >
                              <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                            </Tooltip>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Deductions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="h6" fontWeight={600}>
                      {t('Deductions')}
                    </Typography>
                    <Tooltip
                      title="Deductions reduce your taxable income, lowering your tax bill. Switzerland offers generous deductions for work expenses, insurance, pension contributions, and family costs."
                      arrow
                      placement="top"
                    >
                      <HelpOutlineIcon sx={{ fontSize: 18, color: 'primary.main', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/${i18n.language}/tax-filing/interview`, { state: { section: 'deductions' } })}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  {sessionData?.deductions?.commuteDistance && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Commute Distance: {sessionData?.deductions?.commuteDistance}
                      </Typography>
                      <Tooltip
                        title={explanations.commuteDistance}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}

                  {sessionData?.deductions?.hasMealExpenses && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Has Meal Expenses: Yes
                      </Typography>
                      <Tooltip
                        title={explanations.mealExpenses}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}

                  {sessionData?.deductions?.pillar3a && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Pillar 3a Contributions: Yes
                      </Typography>
                      <Tooltip
                        title={explanations.pillar3a}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}

                  {sessionData?.deductions?.pillar2Buyback && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Pillar 2 Buy-back: Yes
                      </Typography>
                      <Tooltip
                        title={explanations.pillar2Buyback}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}

                  {sessionData?.deductions?.healthInsurance && (
                    <>
                      <Divider />
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>Health Insurance</Typography>
                        <Tooltip
                          title={explanations.healthInsurance}
                          arrow
                          placement="top"
                        >
                          <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                      <Typography variant="body2">
                        Basic Premium: CHF {sessionData?.deductions?.healthInsurance?.basic_premium || 0}
                      </Typography>
                      {sessionData?.deductions?.healthInsurance?.has_supplementary && (
                        <Typography variant="body2">
                          Supplementary: CHF {sessionData?.deductions?.healthInsurance?.supplementary_amount || 0}
                        </Typography>
                      )}
                    </>
                  )}

                  {sessionData?.deductions?.paysAlimony && (
                    <>
                      <Divider />
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2">
                          Alimony: CHF {sessionData?.deductions?.alimonyAmount || 0}
                        </Typography>
                        <Tooltip
                          title={explanations.alimony}
                          arrow
                          placement="top"
                        >
                          <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                    </>
                  )}

                  {sessionData?.deductions?.hasDonations && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Has Charitable Donations: Yes
                      </Typography>
                      <Tooltip
                        title={explanations.donations}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}

                  {sessionData?.deductions?.hasMedicalExpenses && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        Has Medical Expenses: Yes
                      </Typography>
                      <Tooltip
                        title={explanations.medicalExpenses}
                        arrow
                        placement="top"
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'primary.main', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Tax Calculation */}
          <Grid item xs={12} md={5}>
            <TaxCalculationBreakdown calculation={calculation} />
          </Grid>
        </Grid>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/${i18n.language}/tax-filing/documents`)}
          >
            {t('review.back_to_documents')}
          </Button>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
          >
            {sessionData?.requiresPayment ? t('review.continue_payment') : t('review.continue_submit')}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ReviewPage;
