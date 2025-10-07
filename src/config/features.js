// Feature flags for controlling application behavior
export const features = {
  // Enable v2 enriched recommendations API
  useEnrichedRecommendations: true,
  
  // Force refresh enrichment data after this many minutes
  enrichmentStaleMinutes: 120,
  
  // Show data completeness indicators
  showDataCompleteness: true,
  
  // Show missing data prompts
  showMissingDataPrompts: true,
  
  // Enable caching for enrichment data
  enableEnrichmentCache: true
};

// Helper to check if a feature is enabled
export const isFeatureEnabled = (featureName) => {
  const isEnabled = features[featureName] === true;
    exists: featureName in features,
    value: features[featureName],
    type: typeof features[featureName],
    isEnabled,
    allFeatures: features,
    timestamp: new Date().toISOString()
  });
  return isEnabled;
};