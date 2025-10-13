/**
 * FeatureGate component
 *
 * Conditionally renders children based on feature availability.
 * Shows upgrade prompt if user doesn't have access to the feature.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import UpgradePrompt from './UpgradePrompt';

/**
 * Gate that restricts access to features based on subscription plan.
 *
 * @param {Object} props
 * @param {string} props.feature - Feature name to check
 * @param {string} [props.requiredPlan] - Minimum plan required
 * @param {React.ReactNode} [props.fallback] - Custom fallback to show if no access
 * @param {React.ReactNode} props.children - Content to show if user has access
 * @param {boolean} [props.showUpgradePrompt=true] - Whether to show upgrade prompt
 */
const FeatureGate = ({
  feature,
  requiredPlan,
  fallback,
  children,
  showUpgradePrompt = true
}) => {
  const { hasFeature, planType, getRequiredPlan } = usePlanFeatures();

  // Check if user has access to the feature
  const hasAccess = hasFeature(feature);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If no upgrade prompt requested, render nothing
  if (!showUpgradePrompt) {
    return null;
  }

  // Determine required plan
  const minimumPlan = requiredPlan || getRequiredPlan(feature);

  // Show upgrade prompt
  return (
    <UpgradePrompt
      feature={feature}
      currentPlan={planType}
      requiredPlan={minimumPlan}
    />
  );
};

FeatureGate.propTypes = {
  feature: PropTypes.string.isRequired,
  requiredPlan: PropTypes.oneOf(['free', 'basic', 'pro', 'premium']),
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
  showUpgradePrompt: PropTypes.bool
};

export default FeatureGate;
