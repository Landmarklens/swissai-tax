/**
 * Feature definitions and access control for subscription plans.
 *
 * Phase 0: All features enabled for all plans during development.
 * This allows us to test the infrastructure without restricting users.
 *
 * To enforce limits, update PLAN_FEATURES and use hasFeature() in components.
 */

// Feature matrix: maps plan types to their feature limits
// Phase 0: All features unlimited/enabled for all plans
export const PLAN_FEATURES = {
  free: {
    // Filing limits
    filings_per_year: 999, // Unlimited (temporary)
    filing_amendments: true,

    // Document management
    document_uploads: null, // Unlimited (temporary)
    document_storage_mb: 999999, // Unlimited (temporary)
    document_ocr: true,

    // AI features
    ai_questions_limit: null, // Unlimited (temporary)
    ai_optimization: true, // Enabled (temporary)
    ai_tax_assistant: true,
    ai_document_analysis: true,

    // Export features
    pdf_export: 'professional', // Full access (temporary)
    csv_export: true,
    bulk_export: true,

    // Comparison & analysis
    canton_comparison: 999, // Unlimited (temporary)
    tax_scenarios: true,
    multi_year_comparison: true,

    // Support features
    expert_review: true, // Enabled (temporary)
    priority_support: true,
    email_support: true,
    phone_support: true,

    // Advanced features
    multi_property: true,
    joint_filing: true,
    business_income: true,
    investment_income: true,
    foreign_income: true,

    // API access
    api_access: true,
    api_rate_limit: 999999, // Unlimited (temporary)
  },
  basic: {
    // Same as free for Phase 0
    filings_per_year: 999,
    filing_amendments: true,
    document_uploads: null,
    document_storage_mb: 999999,
    document_ocr: true,
    ai_questions_limit: null,
    ai_optimization: true,
    ai_tax_assistant: true,
    ai_document_analysis: true,
    pdf_export: 'professional',
    csv_export: true,
    bulk_export: true,
    canton_comparison: 999,
    tax_scenarios: true,
    multi_year_comparison: true,
    expert_review: true,
    priority_support: true,
    email_support: true,
    phone_support: true,
    multi_property: true,
    joint_filing: true,
    business_income: true,
    investment_income: true,
    foreign_income: true,
    api_access: true,
    api_rate_limit: 999999,
  },
  pro: {
    // Same as free for Phase 0
    filings_per_year: 999,
    filing_amendments: true,
    document_uploads: null,
    document_storage_mb: 999999,
    document_ocr: true,
    ai_questions_limit: null,
    ai_optimization: true,
    ai_tax_assistant: true,
    ai_document_analysis: true,
    pdf_export: 'professional',
    csv_export: true,
    bulk_export: true,
    canton_comparison: 999,
    tax_scenarios: true,
    multi_year_comparison: true,
    expert_review: true,
    priority_support: true,
    email_support: true,
    phone_support: true,
    multi_property: true,
    joint_filing: true,
    business_income: true,
    investment_income: true,
    foreign_income: true,
    api_access: true,
    api_rate_limit: 999999,
  },
  premium: {
    // Same as free for Phase 0
    filings_per_year: 999,
    filing_amendments: true,
    document_uploads: null,
    document_storage_mb: 999999,
    document_ocr: true,
    ai_questions_limit: null,
    ai_optimization: true,
    ai_tax_assistant: true,
    ai_document_analysis: true,
    pdf_export: 'professional',
    csv_export: true,
    bulk_export: true,
    canton_comparison: 999,
    tax_scenarios: true,
    multi_year_comparison: true,
    expert_review: true,
    priority_support: true,
    email_support: true,
    phone_support: true,
    multi_property: true,
    joint_filing: true,
    business_income: true,
    investment_income: true,
    foreign_income: true,
    api_access: true,
    api_rate_limit: 999999,
  }
};

/**
 * Get all features for a specific plan type.
 *
 * @param {string} planType - One of 'free', 'basic', 'pro', 'premium'
 * @returns {Object} Dictionary of feature names to their values/limits
 */
export function getPlanFeatures(planType) {
  return PLAN_FEATURES[planType] || PLAN_FEATURES.free;
}

/**
 * Check if a plan has access to a specific feature.
 *
 * Phase 0: Always returns true (all features enabled).
 *
 * @param {string} planType - User's current plan type
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} True if plan has access, false otherwise
 */
export function hasFeature(planType, featureName) {
  const features = getPlanFeatures(planType);
  const featureValue = features[featureName];

  // Undefined features default to false
  if (featureValue === undefined) {
    return false;
  }

  // Boolean features: return the value directly
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  // Numeric limits: if null (unlimited) or > 0, return true
  if (featureValue === null || (typeof featureValue === 'number' && featureValue > 0)) {
    return true;
  }

  // String features (like pdf_export): if not empty, return true
  if (typeof featureValue === 'string' && featureValue) {
    return true;
  }

  return false;
}

/**
 * Get the usage limit for a specific feature.
 *
 * @param {string} planType - User's current plan type
 * @param {string} featureName - Name of the feature to check
 * @returns {number|null} The numeric limit, or null if unlimited
 */
export function getFeatureLimit(planType, featureName) {
  const features = getPlanFeatures(planType);
  const featureValue = features[featureName];

  // Return numeric limits
  if (typeof featureValue === 'number') {
    // Return null for "unlimited" values (999+)
    if (featureValue >= 999) {
      return null;
    }
    return featureValue;
  }

  // Non-numeric features have no limit concept
  return null;
}

/**
 * Compare features between two plans.
 *
 * @param {string} currentPlan - Current plan type
 * @param {string} targetPlan - Target plan type
 * @returns {Object} Object with 'upgrades', 'downgrades', and 'unchanged' features
 */
export function comparePlans(currentPlan, targetPlan) {
  const currentFeatures = getPlanFeatures(currentPlan);
  const targetFeatures = getPlanFeatures(targetPlan);

  const upgrades = {};
  const downgrades = {};
  const unchanged = {};

  // Get all feature names from both plans
  const allFeatures = new Set([
    ...Object.keys(currentFeatures),
    ...Object.keys(targetFeatures)
  ]);

  allFeatures.forEach(feature => {
    const currentValue = currentFeatures[feature];
    const targetValue = targetFeatures[feature];

    if (currentValue === targetValue) {
      unchanged[feature] = currentValue;
    } else if (isUpgrade(currentValue, targetValue)) {
      upgrades[feature] = {
        from: currentValue,
        to: targetValue
      };
    } else {
      downgrades[feature] = {
        from: currentValue,
        to: targetValue
      };
    }
  });

  return {
    upgrades,
    downgrades,
    unchanged
  };
}

/**
 * Helper to determine if a feature change is an upgrade.
 *
 * @param {*} currentValue - Current feature value
 * @param {*} targetValue - Target feature value
 * @returns {boolean} True if it's an upgrade
 */
function isUpgrade(currentValue, targetValue) {
  // Boolean: false -> true is upgrade
  if (typeof currentValue === 'boolean' && typeof targetValue === 'boolean') {
    return !currentValue && targetValue;
  }

  // Numeric: higher is better (null means unlimited)
  if (typeof currentValue === 'number' && typeof targetValue === 'number') {
    return targetValue > currentValue;
  }
  if (currentValue !== null && targetValue === null) {
    return true; // Limited -> Unlimited
  }

  // String: any change to non-empty is upgrade
  if (!currentValue && targetValue) {
    return true;
  }

  return false;
}

/**
 * Get user-friendly display name for a feature.
 *
 * @param {string} featureName - Internal feature name
 * @returns {string} Human-readable feature name
 */
export function getFeatureDisplayName(featureName) {
  const displayNames = {
    filings_per_year: 'Tax Filings per Year',
    filing_amendments: 'Filing Amendments',
    document_uploads: 'Document Uploads',
    document_storage_mb: 'Document Storage',
    document_ocr: 'Document OCR',
    ai_questions_limit: 'AI Questions',
    ai_optimization: 'AI Tax Optimization',
    ai_tax_assistant: 'AI Tax Assistant',
    ai_document_analysis: 'AI Document Analysis',
    pdf_export: 'PDF Export',
    csv_export: 'CSV Export',
    bulk_export: 'Bulk Export',
    canton_comparison: 'Canton Comparisons',
    tax_scenarios: 'Tax Scenarios',
    multi_year_comparison: 'Multi-Year Comparison',
    expert_review: 'Expert Review',
    priority_support: 'Priority Support',
    email_support: 'Email Support',
    phone_support: 'Phone Support',
    multi_property: 'Multiple Properties',
    joint_filing: 'Joint Filing',
    business_income: 'Business Income',
    investment_income: 'Investment Income',
    foreign_income: 'Foreign Income',
    api_access: 'API Access',
    api_rate_limit: 'API Rate Limit'
  };

  return displayNames[featureName] || featureName;
}

/**
 * Format feature value for display.
 *
 * @param {string} featureName - Feature name
 * @param {*} featureValue - Feature value
 * @returns {string} Formatted display string
 */
export function formatFeatureValue(featureName, featureValue) {
  // Boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue ? 'Enabled' : 'Disabled';
  }

  // Null means unlimited
  if (featureValue === null) {
    return 'Unlimited';
  }

  // Numeric features >= 999 are treated as unlimited
  if (typeof featureValue === 'number' && featureValue >= 999) {
    return 'Unlimited';
  }

  // Storage in MB
  if (featureName.includes('storage_mb')) {
    if (featureValue >= 1000) {
      return `${(featureValue / 1000).toFixed(1)} GB`;
    }
    return `${featureValue} MB`;
  }

  // Rate limits
  if (featureName.includes('rate_limit')) {
    return `${featureValue.toLocaleString()} requests/hour`;
  }

  // Default: return as-is
  return String(featureValue);
}

export default {
  PLAN_FEATURES,
  getPlanFeatures,
  hasFeature,
  getFeatureLimit,
  comparePlans,
  getFeatureDisplayName,
  formatFeatureValue
};
