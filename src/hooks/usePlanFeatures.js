/**
 * React hook for accessing subscription plan features.
 *
 * Provides access to:
 * - Feature availability checks
 * - Feature limits
 * - Current plan information
 * - Plan comparison utilities
 */

import { useSelector } from 'react-redux';
import {
  PLAN_FEATURES,
  hasFeature as checkHasFeature,
  getFeatureLimit as checkFeatureLimit,
  getPlanFeatures,
  comparePlans,
  getFeatureDisplayName,
  formatFeatureValue
} from '../utils/planFeatures';

/**
 * Hook to access subscription plan features and limits.
 *
 * @returns {Object} Plan features utilities
 */
export const usePlanFeatures = () => {
  // Get subscription from Redux store
  const subscription = useSelector(state => state.account?.subscription);
  const user = useSelector(state => state.account?.user);

  // Determine current plan type
  const planType = subscription?.plan_type || 'free';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  /**
   * Check if current user has access to a feature.
   *
   * @param {string} featureName - Name of feature to check
   * @returns {boolean} True if user has access
   */
  const hasFeature = (featureName) => {
    return checkHasFeature(planType, featureName);
  };

  /**
   * Get the limit for a usage-based feature.
   *
   * @param {string} featureName - Name of feature
   * @returns {number|null} Limit or null if unlimited
   */
  const getLimit = (featureName) => {
    return checkFeatureLimit(planType, featureName);
  };

  /**
   * Check if a feature is unlimited.
   *
   * @param {string} featureName - Name of feature
   * @returns {boolean} True if unlimited
   */
  const isUnlimited = (featureName) => {
    const limit = getLimit(featureName);
    return limit === null || limit === undefined || limit >= 999;
  };

  /**
   * Get all features for current plan.
   *
   * @returns {Object} All features and their values
   */
  const getAllFeatures = () => {
    return getPlanFeatures(planType);
  };

  /**
   * Compare current plan with another plan.
   *
   * @param {string} targetPlan - Plan to compare with
   * @returns {Object} Comparison result with upgrades/downgrades
   */
  const compareWithPlan = (targetPlan) => {
    return comparePlans(planType, targetPlan);
  };

  /**
   * Check if user can upgrade to a specific plan.
   *
   * @param {string} targetPlan - Plan to check
   * @returns {boolean} True if upgrade is possible
   */
  const canUpgradeTo = (targetPlan) => {
    const planOrder = ['free', 'basic', 'pro', 'premium'];
    const currentIndex = planOrder.indexOf(planType);
    const targetIndex = planOrder.indexOf(targetPlan);
    return targetIndex > currentIndex;
  };

  /**
   * Check if user needs to upgrade for a feature.
   *
   * @param {string} featureName - Name of feature
   * @returns {boolean} True if upgrade is needed
   */
  const needsUpgrade = (featureName) => {
    return !hasFeature(featureName);
  };

  /**
   * Get the minimum plan required for a feature.
   *
   * @param {string} featureName - Name of feature
   * @returns {string} Minimum plan type
   */
  const getRequiredPlan = (featureName) => {
    const planOrder = ['free', 'basic', 'pro', 'premium'];

    for (const plan of planOrder) {
      const features = PLAN_FEATURES[plan] || {};
      const featureValue = features[featureName];

      if (featureValue) {
        if (typeof featureValue === 'boolean' && featureValue) return plan;
        if (typeof featureValue === 'number' && featureValue > 0) return plan;
        if (featureValue === null) return plan;
        if (typeof featureValue === 'string' && featureValue) return plan;
      }
    }

    return 'premium';
  };

  /**
   * Get user-friendly display name for a feature.
   *
   * @param {string} featureName - Feature name
   * @returns {string} Display name
   */
  const getDisplayName = (featureName) => {
    return getFeatureDisplayName(featureName);
  };

  /**
   * Format feature value for display.
   *
   * @param {string} featureName - Feature name
   * @param {*} featureValue - Feature value
   * @returns {string} Formatted value
   */
  const formatValue = (featureName, featureValue) => {
    return formatFeatureValue(featureName, featureValue);
  };

  /**
   * Check if user is on trial.
   *
   * @returns {boolean} True if on trial
   */
  const isOnTrial = () => {
    return subscription?.status === 'trialing';
  };

  /**
   * Get trial days remaining.
   *
   * @returns {number|null} Days remaining or null if not on trial
   */
  const getTrialDaysRemaining = () => {
    if (!isOnTrial() || !subscription?.trial_end) {
      return null;
    }

    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  /**
   * Check if subscription is active or trialing.
   *
   * @returns {boolean} True if active
   */
  const hasActiveSubscription = () => {
    return isActive;
  };

  /**
   * Get plan price in CHF.
   *
   * @param {string} plan - Plan type
   * @returns {number} Price in CHF
   */
  const getPlanPrice = (plan) => {
    const prices = {
      free: 0,
      basic: 49,
      pro: 99,
      premium: 149
    };
    return prices[plan] || 0;
  };

  /**
   * Calculate upgrade cost (prorated).
   *
   * @param {string} targetPlan - Plan to upgrade to
   * @returns {number} Prorated cost in CHF
   */
  const calculateUpgradeCost = (targetPlan) => {
    if (!canUpgradeTo(targetPlan)) {
      return 0;
    }

    const currentPrice = getPlanPrice(planType);
    const targetPrice = getPlanPrice(targetPlan);
    const priceDiff = targetPrice - currentPrice;

    // If on trial, full price
    if (isOnTrial()) {
      return targetPrice;
    }

    // If active, calculate prorated amount
    // Simplified: return full difference (actual proration would require billing date)
    return priceDiff;
  };

  return {
    // Plan information
    planType,
    isActive,
    subscription,
    user,

    // Feature checks
    hasFeature,
    getLimit,
    isUnlimited,
    getAllFeatures,
    needsUpgrade,
    getRequiredPlan,

    // Plan comparison
    compareWithPlan,
    canUpgradeTo,
    calculateUpgradeCost,
    getPlanPrice,

    // Trial information
    isOnTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,

    // Utilities
    getDisplayName,
    formatValue,

    // All features for current plan
    features: getAllFeatures()
  };
};

export default usePlanFeatures;
