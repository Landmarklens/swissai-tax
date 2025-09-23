import axios from 'axios';
import authService from '../services/authService';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_URL || config.API_BASE_URL || 'https://api.homeai.ch';

// Create a custom axios instance for recommendations with better error handling
const recommendationAxios = axios.create ? axios.create({
  timeout: 120000,
  validateStatus: function (status) {
    // Accept any status code to prevent axios from throwing
    return true;
  }
}) : axios;

// Add request interceptor to suppress CORS preflight errors
if (recommendationAxios && recommendationAxios.interceptors) {
  recommendationAxios.interceptors.request.use(
    config => config,
    error => {
      // Silently handle request errors
      return Promise.resolve({ 
        data: { status: 'pending', progress_percentage: 0 },
        status: 0 
      });
    }
  );

  // Add response interceptor to handle errors gracefully
  recommendationAxios.interceptors.response.use(
    response => {
      // For 5xx errors, return a pending status instead of failing
      if (response.status >= 500) {
        return {
          data: { status: 'pending', progress_percentage: 0 },
          status: response.status
        };
      }
      return response;
    },
    error => {
      // Handle network errors silently
      if (error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNABORTED' ||
          error.message?.includes('CORS') ||
          error.message?.includes('Network Error')) {
        // Return a pending status for retriable errors
        return Promise.resolve({
          data: { status: 'pending', progress_percentage: 0 },
          status: 0
        });
      }
      // For other errors, still handle gracefully
      return Promise.resolve({
        data: { status: 'pending', progress_percentage: 0, error: error.message },
        status: error.response?.status || 0
      });
    }
  );
}

// Polling configuration
const POLLING_INTERVAL = 5000; // 5 seconds between polls
const MAX_POLLING_ATTEMPTS = 60; // 5 minutes max (60 * 5s)
const INITIAL_DELAY = 2000; // 2 second initial delay

/**
 * Create an async recommendation job
 * @param {string} profileId - The conversation profile ID
 * @param {boolean} enriched - Whether to get enriched recommendations
 * @returns {Promise<Object>} Job creation response with job_id
 */
const createRecommendationJob = async (profileId, enriched = true) => {
  const user = authService.getCurrentUser();
  
  // Log only essential info for debugging
  console.log('[API-V2] Creating recommendation job for profile:', profileId);
  
  try {
    const requestPayload = {
      profile_id: parseInt(profileId),
      enriched: enriched
    };
    
    // Silent request - no need to log every detail
    
    const response = await recommendationAxios.post(
      `${API_URL}/api/recommendations/async/v2/async`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    console.log('[API-V2] Job created:', response.data?.job_id);
    return response.data;
  } catch (error) {
    console.error('[API-V2] Failed to create job:', error.message);
    throw error;
  }
};

/**
 * Check the status of a recommendation job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Job status response
 */
const checkJobStatus = async (jobId) => {
  const user = authService.getCurrentUser();
  
  // Silent status check - no logging needed
  
  try {
    const response = await recommendationAxios.get(
      `${API_URL}/api/recommendations/async/v2/async/${jobId}/status`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    // Check if we got a pending status from interceptor (5xx errors)
    if (response.status >= 500 || response.status === 0) {
      // Silently continue polling without logging to console
      return response.data || { status: 'pending', progress_percentage: 0 };
    }
    
    // Return status without verbose logging
    return response.data;
  } catch (error) {
    // Log the error for debugging but don't throw for CORS/network/timeout errors
    // as the system will retry and often succeeds
    const isRetriableError = 
      error.message?.includes('CORS') || 
      error.message?.includes('Network Error') ||
      error.response?.status === 504 || // Gateway Timeout
      error.response?.status === 502 || // Bad Gateway
      error.response?.status === 503 || // Service Unavailable
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED';
    
    if (isRetriableError) {
      // Silently return pending status for retriable errors
      return { status: 'pending', progress_percentage: 0 };
    }
    
    // Log only non-retriable errors
    console.error('[API-V2] Job status check failed:', error.message);
    
    throw error;
  }
};

/**
 * Get the results of a completed recommendation job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Job results
 */
const getJobResults = async (jobId) => {
  const user = authService.getCurrentUser();
  
  console.log('[API-V2] 📥 === GETTING JOB RESULTS ===', {
    jobId,
    url: `${API_URL}/api/recommendations/async/v2/async/${jobId}/result`,
    timestamp: new Date().toISOString()
  });
  
  try {
    const response = await recommendationAxios.get(
      `${API_URL}/api/recommendations/async/v2/async/${jobId}/result`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`
        }
      }
    );
    
    const count = response.data?.recommendations?.length || response.data?.properties?.length || 0;
    console.log('[API-V2] 🎉 === JOB RESULTS RECEIVED ===', {
      statusCode: response.status,
      recommendationCount: response.data?.recommendations?.length || 0,
      propertyCount: response.data?.properties?.length || 0,
      hasRecommendations: !!response.data?.recommendations,
      hasProperties: !!response.data?.properties,
      dataStructure: Object.keys(response.data || {}),
      timestamp: new Date().toISOString()
    });
    
    // Log first recommendation in detail to check metadata
    if (response.data?.recommendations?.[0]) {
      console.log('[API-V2] 🔍 === FIRST RECOMMENDATION DETAILS ===', {
        recommendation: response.data.recommendations[0],
        hasProperty: !!response.data.recommendations[0].property,
        hasEnrichment: !!response.data.recommendations[0].enrichment,
        enrichmentData: response.data.recommendations[0].enrichment,
        propertyKeys: response.data.recommendations[0].property ? Object.keys(response.data.recommendations[0].property) : [],
        aiConfidence: response.data.recommendations[0].ai_confidence,
        aiExplanation: response.data.recommendations[0].ai_explanation,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log last recommendation to verify metadata
    const lastIndex = (response.data?.recommendations?.length || 0) - 1;
    if (lastIndex >= 0 && response.data?.recommendations?.[lastIndex]) {
      console.log('[API-V2] 🔍 === LAST RECOMMENDATION DETAILS ===', {
        index: lastIndex,
        recommendation: response.data.recommendations[lastIndex],
        hasProperty: !!response.data.recommendations[lastIndex].property,
        hasEnrichment: !!response.data.recommendations[lastIndex].enrichment,
        enrichmentData: response.data.recommendations[lastIndex].enrichment,
        propertyKeys: response.data.recommendations[lastIndex].property ? Object.keys(response.data.recommendations[lastIndex].property) : [],
        aiConfidence: response.data.recommendations[lastIndex].ai_confidence,
        aiExplanation: response.data.recommendations[lastIndex].ai_explanation,
        timestamp: new Date().toISOString()
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('[API-V2] Failed to get results:', error.message);
    throw error;
  }
};

/**
 * Poll for job completion
 * @param {string} jobId - The job ID
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Final job status
 */
const pollForCompletion = async (jobId, onProgress = null) => {
  let attempts = 0;
  let lastStatus = 'pending';
  
  console.log('[API-V2] Starting polling for job:', jobId);
  
  // Initial delay
  await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));
  
  while (attempts < MAX_POLLING_ATTEMPTS) {
    try {
      const status = await checkJobStatus(jobId);
      
      // Update progress if status changed
      if (status.status !== lastStatus || status.progress_percentage > 0) {
        lastStatus = status.status;
        console.log(`[API-V2] Status: ${status.status} | Progress: ${status.progress_percentage || 0}% | ${status.progress_message || ''}`); 
      }
      
      // Call progress callback
      if (onProgress) {
        onProgress({
          status: status.status,
          progress: status.progress_percentage || 0,
          message: status.progress_message || 'Processing...'
        });
      }
      
      // Handle different statuses
      switch (status.status) {
        case 'completed':
          console.log('[API-V2] ✅ Job completed successfully');
          return status;
          
        case 'failed':
          // Job definitively failed - stop polling
          const errorMessage = status.error || 'Job failed';
          console.error('[API-V2] ❌ Job failed:', errorMessage);
          
          // Check if it's a "no properties" scenario
          if (errorMessage.includes('No properties match the search criteria') || 
              errorMessage.includes('No recommendations found')) {
            return {
              status: 'failed',
              error: errorMessage,
              errorType: 'NO_PROPERTIES_FOUND',
              userMessage: 'No properties currently match your search criteria in the selected area. Try expanding your search or adjusting your preferences.'
            };
          }
          
          // Other failures - throw error
          throw new Error(errorMessage);
          
        case 'pending':
        case 'processing':
          // Job still running - continue polling
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          break;
          
        default:
          // Unknown status - treat as pending
          console.warn('[API-V2] Unknown job status:', status.status);
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
      
      attempts++;
    } catch (error) {
      // Network/transient errors - continue polling with backoff
      console.warn(`[API-V2] Polling error (attempt ${attempts + 1}/${MAX_POLLING_ATTEMPTS}):`, error.message);
      
      // Exponential backoff for network errors
      const backoffDelay = Math.min(POLLING_INTERVAL * Math.pow(1.5, attempts / 10), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      attempts++;
      if (attempts >= MAX_POLLING_ATTEMPTS) {
        throw new Error('The recommendation service is taking longer than expected. Please try again in a few minutes.');
      }
    }
  }
  
  throw new Error('The recommendation service is taking longer than expected. Please try again in a few minutes.');
};

/**
 * Get enriched recommendations with metadata (ASYNC VERSION)
 * @param {string} conversationProfileId - The conversation profile ID
 * @param {boolean} forceRefresh - Force refresh bypassing cache
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} Array of enriched recommendations
 */
export const getEnrichedRecommendations = async (
  conversationProfileId, 
  forceRefresh = false,
  onProgress = null
) => {
  console.log('[API-V2] Getting recommendations for profile:', conversationProfileId);
  
  try {
    // Step 1: Create async job
    if (onProgress) {
      onProgress({
        status: 'creating',
        progress: 0,
        message: 'Creating recommendation job...'
      });
    }
    
    const jobResponse = await createRecommendationJob(conversationProfileId, true);
    const jobId = jobResponse.job_id;
    
    // Job created, proceed to polling
    
    if (!jobId) {
      throw new Error('Failed to create recommendation job');
    }
    
    // Step 2: Poll for completion
    const finalStatus = await pollForCompletion(jobId, onProgress);
    
    // Step 3: Handle results based on status
    if (finalStatus.status === 'completed') {
      const results = await getJobResults(jobId);
      
      console.log('[API-V2] 📊 === PROCESSING JOB RESULTS ===', {
        hasRecommendations: !!results.recommendations,
        recommendationCount: results.recommendations?.length || 0,
        hasProperties: !!results.properties,
        propertyCount: results.properties?.length || 0,
        resultKeys: Object.keys(results || {}),
        timestamp: new Date().toISOString()
      });
      
      // Log all recommendations to check metadata completeness
      if (results.recommendations && results.recommendations.length > 0) {
        console.log('[API-V2] 📋 === ALL RECOMMENDATIONS METADATA CHECK ===');
        results.recommendations.forEach((rec, index) => {
          const hasMetadata = rec.enrichment?.data || rec.enrichment_scores;
          const metadataFields = rec.enrichment?.data ? Object.keys(rec.enrichment.data) : [];
          console.log(`[API-V2] Rec #${index + 1}:`, {
            id: rec.property?.id || rec.id,
            title: rec.property?.title || rec.title,
            hasEnrichment: !!rec.enrichment,
            hasEnrichmentData: !!rec.enrichment?.data,
            hasEnrichmentScores: !!rec.enrichment_scores,
            metadataFields: metadataFields,
            aiConfidence: rec.ai_confidence || rec.confidence,
            aiExplanation: rec.ai_explanation || rec.explanation,
            missingFields: rec.enrichment?.missing_fields || [],
            hasMetadata: hasMetadata
          });
        });
      }
      
      // Transform to expected format
      if (results.recommendations) {
        console.log('[API-V2] ✅ === RETURNING RECOMMENDATIONS ===', {
          count: results.recommendations.length,
          firstRecommendation: results.recommendations[0],
          lastRecommendation: results.recommendations[results.recommendations.length - 1],
          timestamp: new Date().toISOString()
        });
        return results.recommendations;
      } else if (results.properties) {
        // Handle legacy format
        console.log('[API-V2] ✅ === RETURNING PROPERTIES (LEGACY) ===', {
          count: results.properties.length,
          firstProperty: results.properties[0],
          lastProperty: results.properties[results.properties.length - 1],
          timestamp: new Date().toISOString()
        });
        return results.properties;
      } else {
        return [];
      }
    } else if (finalStatus.status === 'failed' && finalStatus.errorType === 'NO_PROPERTIES_FOUND') {
      // Handle "No properties found" scenario gracefully
      console.log('[API-V2] No properties found - returning empty array with metadata');
      
      // Return empty array with metadata that the UI can use
      return {
        recommendations: [],
        errorType: 'NO_PROPERTIES_FOUND',
        userMessage: finalStatus.userMessage,
        suggestions: [
          'Try expanding your search area',
          'Adjust your budget range',
          'Modify your property preferences',
          'Consider different property types'
        ]
      };
    }
    
    throw new Error('Failed to get recommendations');
  } catch (error) {
    console.error('[API-V2] Error getting recommendations:', error.message);
    
    // Fallback to synchronous endpoint for backward compatibility
    // Remove this fallback after confirming async works
    if (error.message.includes('async')) {
      return getEnrichedRecommendationsSync(conversationProfileId, forceRefresh);
    }
    
    throw error;
  }
};

/**
 * Legacy synchronous version (DEPRECATED - will timeout)
 */
const getEnrichedRecommendationsSync = async (conversationProfileId, forceRefresh = false) => {
  const user = authService.getCurrentUser();
  const params = new URLSearchParams({
    conversation_profile_id: conversationProfileId,
    ...(forceRefresh && { force_refresh: true })
  });

  const response = await recommendationAxios.get(`${API_URL}/recommendations/v2/enriched?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.access_token}`
    }
  });

  return response.data;
};

/**
 * Get saved enriched recommendations
 * @param {string} conversationProfileId - The conversation profile ID
 * @param {boolean} forceRefresh - Force refresh bypassing cache
 * @returns {Promise<Array>} Array of saved enriched recommendations
 */
export const getSavedEnrichedRecommendations = async (
  conversationProfileId,
  forceRefresh = false
) => {
  const user = authService.getCurrentUser();
  const params = new URLSearchParams({
    conversation_profile_id: conversationProfileId,
    ...(forceRefresh && { force_refresh: true })
  });

  const response = await recommendationAxios.get(`${API_URL}/recommendations/v2/saved/enriched?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.access_token}`
    }
  });

  return response.data;
};

/**
 * Get enriched recommendations by conversation ID (ASYNC VERSION)
 * @param {string} conversationProfileId - The conversation profile ID
 * @param {string} conversationId - The conversation ID
 * @param {boolean} forceRefresh - Force refresh bypassing cache
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} Array of enriched recommendations
 */
export const getEnrichedRecommendationsByConversationId = async (
  conversationProfileId,
  conversationId,
  forceRefresh = false,
  onProgress = null
) => {
  // Use the async version
  return getEnrichedRecommendations(conversationProfileId, forceRefresh, onProgress);
};

/**
 * Transform enriched recommendation to match existing format
 * This helper ensures backward compatibility
 */
export const transformEnrichedToLegacyFormat = (enrichedRecommendation) => {
  console.log('[API-V2] 🔄 === TRANSFORMING ENRICHED DATA ===', {
    inputType: typeof enrichedRecommendation,
    inputKeys: enrichedRecommendation ? Object.keys(enrichedRecommendation) : null,
    hasProperty: !!enrichedRecommendation?.property,
    hasEnrichment: !!enrichedRecommendation?.enrichment,
    enrichmentData: enrichedRecommendation?.enrichment,
    aiConfidence: enrichedRecommendation?.ai_confidence,
    aiExplanation: enrichedRecommendation?.ai_explanation,
    timestamp: new Date().toISOString()
  });
  
  // Handle both enriched format and direct property format
  const property = enrichedRecommendation.property || enrichedRecommendation;
  
  // Extract property data
  console.log('[API-V2] 🏠 === EXTRACTING PROPERTY DATA ===', {
    hasPropertyField: !!enrichedRecommendation.property,
    hasDirectId: !!enrichedRecommendation.id,
    propertyKeys: enrichedRecommendation.property ? Object.keys(enrichedRecommendation.property) : Object.keys(enrichedRecommendation),
    timestamp: new Date().toISOString()
  });
  
  if (!property || !property.id) {
    return null;
  }
  
  const transformed = {
    ...property,
    enrichment_scores: enrichedRecommendation.enrichment?.data || {},
    enrichment_metadata: enrichedRecommendation.enrichment?.metadata || {},
    missing_enrichment_fields: enrichedRecommendation.enrichment?.missing_fields || [],
    // Preserve recommendation metadata if it exists
    recommendation: enrichedRecommendation.recommendation || null,
    // Try to find AI confidence and explanation from multiple possible locations
    ai_confidence: enrichedRecommendation.ai_confidence || 
                  enrichedRecommendation.confidence || 
                  enrichedRecommendation.recommendation?.confidence ||
                  enrichedRecommendation.recommendation?.ai_confidence ||
                  enrichedRecommendation.recommendation?.match_score ||
                  enrichedRecommendation.enrichment?.confidence ||
                  enrichedRecommendation.enrichment?.ai_confidence ||
                  null,
    ai_explanation: enrichedRecommendation.ai_explanation || 
                   enrichedRecommendation.explanation || 
                   enrichedRecommendation.recommendation?.explanation ||
                   enrichedRecommendation.recommendation?.ai_explanation ||
                   enrichedRecommendation.recommendation?.why_good_fit ||
                   enrichedRecommendation.recommendation?.reasoning ||
                   enrichedRecommendation.enrichment?.explanation ||
                   enrichedRecommendation.enrichment?.ai_explanation ||
                   null
  };
  
  // Log final transformed data
  console.log('[API-V2] ✅ === TRANSFORMATION COMPLETE ===', {
    transformedId: transformed.id,
    hasEnrichmentScores: !!transformed.enrichment_scores && Object.keys(transformed.enrichment_scores).length > 0,
    enrichmentScoreKeys: transformed.enrichment_scores ? Object.keys(transformed.enrichment_scores) : [],
    hasEnrichmentMetadata: !!transformed.enrichment_metadata && Object.keys(transformed.enrichment_metadata).length > 0,
    enrichmentMetadataKeys: transformed.enrichment_metadata ? Object.keys(transformed.enrichment_metadata) : [],
    hasMissingFields: transformed.missing_enrichment_fields?.length > 0,
    missingFieldsCount: transformed.missing_enrichment_fields?.length || 0,
    hasAiConfidence: transformed.ai_confidence !== null && transformed.ai_confidence !== undefined,
    aiConfidenceValue: transformed.ai_confidence,
    hasAiExplanation: !!transformed.ai_explanation,
    timestamp: new Date().toISOString()
  });
  
  return transformed;
};

/**
 * Check if enrichment data needs refresh based on age
 * @param {string} computedAt - ISO timestamp of when data was computed
 * @param {number} maxAgeMinutes - Maximum age in minutes before considering stale
 * @returns {boolean} True if data should be refreshed
 */
export const shouldRefreshEnrichment = (computedAt, maxAgeMinutes = 120) => {
  if (!computedAt) return true;

  const computedTime = new Date(computedAt);
  const ageMinutes = Math.floor((Date.now() - computedTime) / 60000);

  return ageMinutes > maxAgeMinutes;
};

/**
 * Get required fields for missing enrichment data
 * @param {Array} missingFields - Array of missing field objects
 * @returns {Set} Set of unique required data fields
 */
export const getRequiredProfileFields = (missingFields = []) => {
  const requiredFields = new Set();

  missingFields.forEach((field) => {
    if (field.reason === 'missing_user_data' && field.required_data) {
      field.required_data.forEach((dataField) => requiredFields.add(dataField));
    }
  });

  return requiredFields;
};

/**
 * Save a property recommendation
 * @param {number} propertyId - The property ID to save
 * @param {number} conversationId - The conversation ID
 * @param {number} conversationProfileId - The conversation profile ID
 * @returns {Promise<Object>} Save status response
 */
export const saveRecommendation = async (propertyId, conversationId, conversationProfileId) => {
  const user = authService.getCurrentUser();
  const response = await recommendationAxios.post(
    `${API_URL}/recommendations/save`,
    {
      property_id: propertyId,
      conversation_id: conversationId,
      conversation_profile_id: conversationProfileId
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.access_token}`
      }
    }
  );
  return response.data;
};

/**
 * Remove a saved property recommendation
 * @param {number} propertyId - The property ID to remove
 * @param {number} conversationId - The conversation ID
 * @param {number} conversationProfileId - The conversation profile ID
 * @returns {Promise<Object>} Remove status response
 */
export const removeSavedRecommendation = async (
  propertyId,
  conversationId,
  conversationProfileId
) => {
  const user = authService.getCurrentUser();
  const params = new URLSearchParams({
    conversation_id: conversationId,
    conversation_profile_id: conversationProfileId
  });

  const response = await recommendationAxios.delete(
    `${API_URL}/recommendations/saved/${propertyId}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${user?.access_token}`
      }
    }
  );
  return response.data;
};

// Export async helpers for direct use
export const asyncRecommendations = {
  createJob: createRecommendationJob,
  checkStatus: checkJobStatus,
  getResults: getJobResults,
  pollForCompletion
};