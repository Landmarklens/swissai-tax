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
const BlogList = withSuspense(lazy(() => import('../pages/BlogList/BlogList')));
const BlogItemPage = withSuspense(lazy(() => import('../pages/BlogList/BlogItemPage')));
const ForgotPassword = withSuspense(lazy(() => import('../pages/ForgotPassword/ForgotPassword')));
const ResetPassword = withSuspense(lazy(() => import('../pages/ResetPassword/ResetPassword')));
const Terms = withSuspense(lazy(() => import('../pages/Terms/Terms')));
const Policy = withSuspense(lazy(() => import('../pages/Policy/Policy')));

// Dashboard and account pages
const Dashboard = withSuspense(lazy(() => import('../pages/Dashboard/Dashboard')));
const Profile = withSuspense(lazy(() => import('../pages/Profile/Profile')));
const Settings = withSuspense(lazy(() => import('../pages/Settings/Settings')));

// Tax filing pages
const FilingsListPage = withSuspense(lazy(() => import('../pages/TaxFiling/FilingsListPage')));
const TaxInterviewPage = withSuspense(lazy(() => import('../pages/TaxFiling/InterviewPage')));
const DocumentChecklistPage = withSuspense(lazy(() => import('../pages/TaxFiling/DocumentChecklistPage')));
const TaxResultsPage = withSuspense(lazy(() => import('../pages/TaxFiling/TaxResults')));
const ReviewPage = withSuspense(lazy(() => import('../pages/TaxFiling/ReviewPage')));
const PaymentPage = withSuspense(lazy(() => import('../pages/TaxFiling/PaymentPage')));
const SubmissionPage = withSuspense(lazy(() => import('../pages/TaxFiling/SubmissionPage')));

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
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
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

  // Tax filing workflow (protected)
  {
    path: '/tax-filing/filings',
    element: (
      <ProtectedRoute>
        <FilingsListPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/interview/:filingId',
    element: (
      <ProtectedRoute>
        <TaxInterviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/tax-filing/interview',
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

  // OAuth callback
  { path: '/google-redirect', element: <GoogleCallback /> },
  { path: '/auth/google/callback', element: <GoogleCallback /> },

  // Information pages
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/features', element: <FeatureBox /> },
  { path: '/about-us', element: <About /> },
  { path: '/contact-us', element: <Contact /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/plan', element: <Plan /> },

  // Blog
  { path: '/blog-list', element: <BlogList /> },
  { path: '/blog', element: <BlogItemPage /> },
  { path: '/blog/:id', element: <BlogItemPage /> },

  // Auth routes
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Legal
  { path: '/terms', element: <Terms /> },
  { path: '/privacy-policy', element: <Policy /> }
];
