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

// Lazy load all route components
const Home = withSuspense(lazy(() => import('../pages/Home/Home')));
const GoogleCallback = withSuspense(lazy(() => import('../pages/GoogleCallback/GoogleCallback')));
const HomeDetails = withSuspense(lazy(() => import('../pages/HomeDetails/HomeDetails')));
const Payment = withSuspense(lazy(() => import('../pages/Payment/Payment')));
const Plan = withSuspense(lazy(() => import('../pages/Plan/Plan')));
const HowItWorks = withSuspense(lazy(() => import('../pages/HowItWork/HowItWork')));
const FeatureBox = withSuspense(lazy(() => import('../pages/Features/Features')));
const About = withSuspense(lazy(() => import('../pages/About/About')));
const Contact = withSuspense(lazy(() => import('../pages/Contact/Contact')));
const FAQ = withSuspense(lazy(() => import('../pages/FAQ/FAQ')));
const BlogList = withSuspense(lazy(() => import('../pages/BlogList/BlogList')));
const BlogItemPage = withSuspense(lazy(() => import('../pages/BlogList/BlogItemPage')));
const Tenants = withSuspense(lazy(() => import('../pages/Tenants/Tenants')));
const Owners = withSuspense(lazy(() => import('../pages/Owners/Owners')));
const PaymentSuccessful = withSuspense(lazy(() => import('../pages/PaymentSuccess/Payment')));
const Welcome = withSuspense(lazy(() => import('../pages/Welcome/Welcome')));
const EditProfile = withSuspense(lazy(() => import('../pages/EditProfile/EditProfile')));
const MyAccount = withSuspense(lazy(() => import('../pages/MyAccount/MyAccount')));
const OwnerAccount = withSuspense(lazy(() => import('../pages/OwnerAccount/OwnerAccount')));
const OnboardingArticle = withSuspense(lazy(() => import('../components/sections/OwnerAccount/Onboarding/OnboardingArticle')));
const ForgotPassword = withSuspense(lazy(() => import('../pages/ForgotPassword/ForgotPassword')));
const ResetPassword = withSuspense(lazy(() => import('../pages/ResetPassword/ResetPassword')));
const SearchProperty = withSuspense(lazy(() => import('../pages/SearchProperty/SearchProperty')));
const Support = withSuspense(lazy(() => import('../pages/Support/Support')));
const Terms = withSuspense(lazy(() => import('../pages/Terms/Terms')));
const Policy = withSuspense(lazy(() => import('../pages/Policy/Policy')));
const Chat = withSuspense(lazy(() => import('../pages/Chat/Chat')));
const TenantSelection = withSuspense(lazy(() => import('../pages/TenantSelection')));
const DocumentSigningPage = withSuspense(lazy(() => import('../components/pages/DocumentSigningPage')));
const ComponentShowcase = withSuspense(lazy(() => import('../pages/ComponentShowcase')));

// Protected Route wrapper remains the same
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Export the lazy loaded routes
export const LAZY_NAVIGATION_ROUTE = [
  { path: '/', element: <Home /> },
  { path: '/google-redirect', element: <GoogleCallback /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  {
    path: '/tenants',
    element: (
      <ProtectedRoute>
        <Tenants />
      </ProtectedRoute>
    )
  },
  { path: '/features', element: <FeatureBox /> },
  { path: '/about-us', element: <About /> },
  { path: '/contact-us', element: <Contact /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/blog-list', element: <BlogList /> },
  { path: '/blog', element: <BlogItemPage /> },
  { path: '/plan', element: <Plan /> },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/my-account',
    element: (
      <ProtectedRoute>
        <MyAccount />
      </ProtectedRoute>
    )
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    )
  },
  {
    path: '/home-details/:id',
    element: (
      <ProtectedRoute>
        <HomeDetails />
      </ProtectedRoute>
    )
  },
  {
    path: '/payment/:id',
    element: (
      <ProtectedRoute>
        <Payment />
      </ProtectedRoute>
    )
  },
  {
    path: '/payment-successful',
    element: (
      <ProtectedRoute>
        <PaymentSuccessful />
      </ProtectedRoute>
    )
  },
  {
    path: '/welcome',
    element: (
      <ProtectedRoute>
        <Welcome />
      </ProtectedRoute>
    )
  },
  {
    path: '/edit-profile',
    element: (
      <ProtectedRoute>
        <EditProfile />
      </ProtectedRoute>
    )
  },
  {
    path: '/owner-account',
    element: (
      <ProtectedRoute>
        <OwnerAccount />
      </ProtectedRoute>
    )
  },
  {
    path: '/owner-account/:section',
    element: (
      <ProtectedRoute>
        <OwnerAccount />
      </ProtectedRoute>
    )
  },
  {
    path: '/document-signing/:id',
    element: (
      <ProtectedRoute>
        <DocumentSigningPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OwnerAccount />
      </ProtectedRoute>
    )
  },
  {
    path: '/onboarding/article/:id',
    element: (
      <ProtectedRoute>
        <OnboardingArticle />
      </ProtectedRoute>
    )
  },
  {
    path: '/search-property',
    element: (
      <ProtectedRoute>
        <SearchProperty />
      </ProtectedRoute>
    )
  },
  {
    path: '/tenant-selection',
    element: (
      <ProtectedRoute>
        <TenantSelection />
      </ProtectedRoute>
    )
  },
  { path: '/support', element: <Support /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy-policy', element: <Policy /> },
  {
    path: '/showcase',
    element: (
      <ProtectedRoute>
        <ComponentShowcase />
      </ProtectedRoute>
    )
  }
];