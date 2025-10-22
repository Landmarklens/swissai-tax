import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { CircularProgress, Box } from '@mui/material';

// Loading component for lazy loaded routes
const RouteLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <CircularProgress />
  </Box>
);

// Wrap lazy components with Suspense
const withSuspense = (Component) => {
  return (props) => (
    <Suspense fallback={<RouteLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

// Lazy load SwissAI Tax route components
const Homepage = withSuspense(lazy(() => import('../pages/Homepage/Homepage')));
const GoogleCallback = withSuspense(lazy(() => import('../pages/GoogleCallback/GoogleCallback')));
const HowItWorks = withSuspense(lazy(() => import('../pages/HowItWork/HowItWork')));
const FeatureBox = withSuspense(lazy(() => import('../pages/Features/Features')));
const About = withSuspense(lazy(() => import('../pages/About/About')));
const Contact = withSuspense(lazy(() => import('../pages/Contact/Contact')));
const FAQ = withSuspense(lazy(() => import('../pages/FAQ/FAQ')));
const Plan = withSuspense(lazy(() => import('../pages/Plan/Plan')));
const ForgotPassword = withSuspense(lazy(() => import('../pages/ForgotPassword/ForgotPassword')));
const ResetPassword = withSuspense(lazy(() => import('../pages/ResetPassword/ResetPassword')));
const Terms = withSuspense(lazy(() => import('../pages/Terms/Terms')));
const Policy = withSuspense(lazy(() => import('../pages/Policy/Policy')));
const CookiePolicy = withSuspense(lazy(() => import('../pages/Policy/CookiePolicy')));
const StatusPage = withSuspense(lazy(() => import('../pages/Status/StatusPage')));
const Security = withSuspense(lazy(() => import('../pages/Security/Security')));
const SubscriptionPlans = withSuspense(lazy(() => import('../pages/SubscriptionPlans/SubscriptionPlans')));

// Canton-specific landing pages
const CantonPage = lazy(() => import('../pages/Canton/CantonPage'));
const ZurichPage = withSuspense(() => <CantonPage canton="zurich" />);
const AargauPage = withSuspense(() => <CantonPage canton="aargau" />);
const BernPage = withSuspense(() => <CantonPage canton="bern" />);

// Dashboard and account pages
const Profile = withSuspense(lazy(() => import('../pages/Profile/Profile')));
const Settings = withSuspense(lazy(() => import('../pages/Settings/Settings')));
const Documents = withSuspense(lazy(() => import('../pages/Documents/Documents')));
const Billing = withSuspense(lazy(() => import('../pages/Billing/Billing')));

// Tax filing pages
const FilingsListPage = withSuspense(lazy(() => import('../pages/TaxFiling/FilingsListPage')));
const PreInterviewPage = withSuspense(lazy(() => import('../pages/TaxFiling/PreInterviewPage')));
const TaxInterviewPage = withSuspense(lazy(() => import('../pages/TaxFiling/InterviewPage')));
const DocumentChecklistPage = withSuspense(lazy(() => import('../pages/TaxFiling/DocumentChecklistPage')));
const TaxResultsPage = withSuspense(lazy(() => import('../pages/TaxFiling/TaxResults')));
const ReviewPage = withSuspense(lazy(() => import('../pages/TaxFiling/ReviewPage')));
const PaymentPage = withSuspense(lazy(() => import('../pages/TaxFiling/PaymentPage')));
const SubmissionPage = withSuspense(lazy(() => import('../pages/TaxFiling/SubmissionPage')));

// Subscription pages
const SubscriptionCheckout = withSuspense(lazy(() => import('../pages/SubscriptionCheckout/SubscriptionCheckout')));
const ManageSubscription = withSuspense(lazy(() => import('../pages/ManageSubscription/ManageSubscription')));

// Referral pages
const ReferralDashboard = withSuspense(lazy(() => import('../pages/Referrals/ReferralDashboard')));

// Admin pages
const PromotionalCodeCreator = withSuspense(lazy(() => import('../pages/Admin/PromotionalCodeCreator')));

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// SwissAI Tax routes only
export const LAZY_NAVIGATION_ROUTE = [
  // Homepage
  { path: '/', element: <Homepage /> },

  // Dashboard and account pages (protected)
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    )
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    )
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute>
        <Documents />
      </ProtectedRoute>
    )
  },
  {
    path: '/billing',
    element: (
      <ProtectedRoute>
        <Billing />
      </ProtectedRoute>
    )
  },
  {
    path: '/referrals',
    element: (
      <ProtectedRoute>
        <ReferralDashboard />
      </ProtectedRoute>
    )
  },

  // Subscription management (protected)
  {
    path: '/subscription/checkout/:planType',
    element: (
      <ProtectedRoute>
        <SubscriptionCheckout />
      </ProtectedRoute>
    )
  },
  {
    path: '/subscription/manage',
    element: (
      <ProtectedRoute>
        <ManageSubscription />
      </ProtectedRoute>
    )
  },

  // Admin pages (protected - add role check later)
  {
    path: '/admin/promotional-codes',
    element: (
      <ProtectedRoute>
        <PromotionalCodeCreator />
      </ProtectedRoute>
    )
  },

  // Tax filing workflow (protected)
  {
    path: '/filings',
    element: (
      <ProtectedRoute>
        <FilingsListPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/filings',
    element: (
      <ProtectedRoute>
        <FilingsListPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/pre-interview/:filingId',
    element: (
      <ProtectedRoute>
        <PreInterviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/interview/:filingId?',
    element: (
      <ProtectedRoute>
        <TaxInterviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/document-checklist',
    element: (
      <ProtectedRoute>
        <DocumentChecklistPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/documents',
    element: (
      <ProtectedRoute>
        <DocumentChecklistPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/review/:filingId',
    element: (
      <ProtectedRoute>
        <ReviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/review',
    element: (
      <ProtectedRoute>
        <ReviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/payment',
    element: (
      <ProtectedRoute>
        <PaymentPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/submit',
    element: (
      <ProtectedRoute>
        <SubmissionPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/results',
    element: (
      <ProtectedRoute>
        <TaxResultsPage />
      </ProtectedRoute>
    )
  },

  // OAuth callback (language-aware routes + fallbacks)
  { path: '/:lang/google-redirect', element: <GoogleCallback /> },
  { path: '/google-redirect', element: <GoogleCallback /> },
  { path: '/:lang/auth/google/callback', element: <GoogleCallback /> },
  { path: '/auth/google/callback', element: <GoogleCallback /> },

  // Information pages
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/features', element: <FeatureBox /> },
  { path: '/about-us', element: <About /> },
  { path: '/contact-us', element: <Contact /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/plan', element: <Plan /> },
  { path: '/subscription-plans', element: <SubscriptionPlans /> },

  // Canton landing pages (SEO)
  { path: '/zurich', element: <ZurichPage /> },
  { path: '/aargau', element: <AargauPage /> },
  { path: '/bern', element: <BernPage /> },

  // Auth routes
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Legal
  { path: '/terms', element: <Terms /> },
  { path: '/privacy-policy', element: <Policy /> },
  { path: '/cookie-policy', element: <CookiePolicy /> },

  // Security
  { path: '/security', element: <Security /> },

  // System Status (public)
  { path: '/status', element: <StatusPage /> }
];
