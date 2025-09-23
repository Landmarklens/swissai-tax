import Home from '../pages/Home/Home';
import { Navigate, useLocation } from 'react-router-dom';
import HomeDetails from '../pages/HomeDetails/HomeDetails';
import Payment from '../pages/Payment/Payment';
import Plan from '../pages/Plan/Plan';
import HowItWorks from '../pages/HowItWork/HowItWork';
import FeatureBox from '../pages/Features/Features';
import About from '../pages/About/About';
import Contact from '../pages/Contact/Contact';
import FAQ from '../pages/FAQ/FAQ';
import BlogList from '../pages/BlogList/BlogList';
import BlogItemPage from '../pages/BlogList/BlogItemPage';
import Tenants from '../pages/Tenants/Tenants';
import Owners from '../pages/Owners/Owners';
import PaymentSuccessful from '../pages/PaymentSuccess/Payment';
import Welcome from '../pages/Welcome/Welcome';
import EditProfile from '../pages/EditProfile/EditProfile';
import MyAccount from '../pages/MyAccount/MyAccount';
import OwnerAccount from '../pages/OwnerAccount/OwnerAccount';
import OnboardingArticle from '../components/sections/OwnerAccount/Onboarding/OnboardingArticle';
import authService from '../services/authService';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword/ResetPassword';
import SearchProperty from '../pages/SearchProperty/SearchProperty';
import Support from '../pages/Support/Support';
import Terms from '../pages/Terms/Terms';
import Policy from '../pages/Policy/Policy';
import Chat from '../pages/Chat/Chat';
import TenantSelection from '../pages/TenantSelection';
import DocumentSigningPage from '../components/pages/DocumentSigningPage';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export const NAVIGATION_ROUTE = [
  { path: '/', element: <Home /> },
  { path: '/google-redirect', element: <Home /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  {
    path: '/tenants',
    element: (
      <ProtectedRoute>
        <Tenants />
      </ProtectedRoute>
    )
  },
  // { path: "/owners", element: <Owners /> },
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
    path: '/owner-account/dashboard',
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
    path: '/owner-account/onboarding/article/:id',
    element: (
      <ProtectedRoute>
        <OnboardingArticle />
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
  {
    path: '/search-property',
    element: (
        <SearchProperty />
    )
  },
  {
    path: '/privacy-policy',
    element: (
        <Policy />
    )
  },
  {
    path: '/terms-and-conditions',
    element: (
        <Terms />
    )
  },
  {
    path: '/support',
    element: (
        <Support />
    )
  },
  {
    path: '/sign/:documentId',
    element: <DocumentSigningPage />
  }
];
