import { useEffect } from 'react';

import authService from '../../../services/authService';
import './PricingPlans.scss';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCheckoutUrl,
  getPlans,
  getSubscription
} from '../../../store/slices/subscriptionsSlice';
import { PlanCard } from './PlanCard/PlanCard';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

// const features = [
//   'Ultimate Property Matching',
//   'Basic Property Matching',
//   'Real-Time Market Scan',
//   'Daily Market Scan',
//   'Expanded Search Scope',
//   'Limited Search Scope',
//   'In-Depth Analysis',
//   'Text-Based Analysis',
//   'VIP Support',
//   'Community Support',
//   'WhatsApp Notifications'
// ];

const PricingPlans = ({ handleOpenAuthModal, title, subtitle, className, userType = 'tenant' }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tenantFeatures = [
    t('pricing_feature_1', '5‑min smart interview → tailor‑made shortlist, like a real agent'),
    t('pricing_feature_2', 'Lifestyle match: Schools, cafés, transport—whatever fits your daily need'),
    t('pricing_feature_3', 'AI checks ad photos for your must-haves ( want a new kitchen? - no problem)'),
    t('pricing_feature_4', 'Commute time, local taxes & health‑insurance cost for every address'),
    t('pricing_feature_5', 'Noise, air, pollution  & neighbourhood vibe scores in one glance'),
    t('pricing_feature_6', 'No more surprises - See planned construction nearby before you rent'),
    t('pricing_feature_7', ' Price‑trend heat‑map shows if the rent is high, fair or a steal'),
    t('pricing_feature_8', 'One‑tap Apply‑for‑me—we auto‑fill and send your dossier'),
    t('pricing_feature_9', 'Give feedback, matches improve instantly')
  ];

  const landlordFeatures = [
    t('✓ Property Management Dashboard'),
    t('✓ Tenant Application Tracking'),
    t('✓ Message Center for all inquiries'),
    t('✓ Market Analytics & Insights'),
    t('✓ Property Listing Management'),
    t('✓ Document Storage & Management'),
    t('✓ Viewing Scheduler'),
    t('✓ Multi-platform property import'),
    t('✓ Email support included')
  ];

  const features = userType === 'landlord' ? landlordFeatures : tenantFeatures;


  const isAuthenticated = authService.isAuthenticated();
  const plansData = useSelector((state) => state.subscriptions.plans.data);
  const plansLoading = useSelector((state) => state.subscriptions.plans.isLoading);
  const isActiveSubscription = useSelector((state) => state.subscriptions.subscription.isActive);

  const isValidPlansData = Array.isArray(plansData) && plansData.length > 0;

  const handleClickCardButton = () => {
    if (!isAuthenticated) {
      handleOpenAuthModal?.();
    } else if (!isActiveSubscription) {
      dispatch(createCheckoutUrl({ plan: 'comprehensive' }));
    } else {
      navigate(userType === 'landlord' ? '/owner-account' : '/chat');
    }
  };

  useEffect(() => {
    dispatch(getSubscription());
    dispatch(getPlans());
  }, [dispatch]);

  const uniquePlans = isValidPlansData
    ? plansData.filter((plan, index, self) =>
        index === self.findIndex((p) => p.plan_name === plan.plan_name)
      )
    : [];

  return (
    <div className={clsx('plans', className)} style={{ display: 'block' }}>
      <h2 className="title">{title || (userType === 'landlord'
        ? t('Professional Property Management, Simplified')
        : t('pricing_title', 'Your next home, yours for about a franc a day!'))}</h2>
      <p className="subtitle">{subtitle || (userType === 'landlord'
        ? t('Join 2,000+ Swiss landlords • Save 10 hours/week • First week free')
        : t('pricing_subtitle', 'CHF 29.99 month • First day free • Cancel anytime'))}</p>

      {plansLoading || plansData === null ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {t('pricing_loading', 'Loading pricing plans...')}
        </div>
      ) : uniquePlans.length > 0 ? (
        <ul className="plans-list">
          {uniquePlans.map((plan) => {
            return (
              <PlanCard
                key={plan.plan_name}
                data={{ plan, features }}
                isAuthenticated={isAuthenticated}
                handleClickCardButton={handleClickCardButton}
                userType={userType}
              />
            );
          })}
        </ul>
      ) : (
        <ul className="plans-list">
          <PlanCard
            data={{ plan: null, features }}
            isAuthenticated={isAuthenticated}
            handleClickCardButton={handleClickCardButton}
            userType={userType}
          />
        </ul>
      )}
    </div>
  );
};

export { PricingPlans };

PricingPlans.propTypes = {
  handleOpenAuthModal: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string
};
