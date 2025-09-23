import { getDataWithQuery, postData, putData, getData } from './apiClient';

// Tenant Questions API Service
export const tenantQuestionsAPI = {
  // Get all questions for a property (owner view)
  getPropertyQuestions: async (propertyId, params = {}) => {
    const queryParams = {
      question_type: params.questionType,
      include_answered: params.includeAnswered !== false, // default true
      limit: params.limit || 50
    };
    
    return getDataWithQuery(`/api/questions/properties/${propertyId}/questions`, queryParams);
  },

  // Get unanswered questions for the current user
  getUnansweredQuestions: async (limit = 50) => {
    return getDataWithQuery('/api/questions/unanswered', { limit });
  },

  // Submit a new question (public endpoint for applicants)
  submitQuestion: async (propertyId, questionData) => {
    return postData(`/api/questions/properties/${propertyId}/questions`, {
      question_text: questionData.questionText,
      lead_id: questionData.leadId,
      question_type: questionData.questionType
    });
  },

  // Triage a question (determine complexity and get AI response)
  triageQuestion: async (questionData) => {
    return postData('/api/questions/triage', {
      question_text: questionData.questionText,
      property_id: questionData.propertyId,
      lead_id: questionData.leadId,
      context: questionData.context
    });
  },

  // Respond to a question
  respondToQuestion: async (questionId, responseText) => {
    return postData(`/api/questions/${questionId}/respond`, {
      response_text: responseText
    });
  },

  // Escalate a question to human review
  escalateQuestion: async (questionId, escalationData = {}) => {
    return postData(`/api/questions/${questionId}/escalate`, {
      escalate_to_user_id: escalationData.escalateToUserId,
      escalation_reason: escalationData.escalationReason
    });
  },

  // Get a specific question
  getQuestion: async (questionId) => {
    return getDataWithQuery(`/api/questions/${questionId}`);
  },

  // Get questions for all properties owned by the user
  getOwnerQuestions: async (params = {}, existingProperties = null) => {
    try {
      let properties = existingProperties;
      
      // If properties weren't passed in, try to fetch them
      if (!properties) {
        console.log('[TenantQuestionsAPI] Fetching properties...');
        try {
          const propertiesResponse = await getData('/api/property');
          properties = propertiesResponse.data;
          console.log('[TenantQuestionsAPI] Properties found:', properties?.length || 0);
        } catch (fetchError) {
          console.error('[TenantQuestionsAPI] Failed to fetch properties:', fetchError);
          // Return empty if we can't get properties
          return { data: [], error: 'Failed to fetch properties' };
        }
      } else {
        console.log('[TenantQuestionsAPI] Using provided properties:', properties?.length || 0);
      }
      
      if (!properties || properties.length === 0) {
        console.log('[TenantQuestionsAPI] No properties found, returning empty data');
        return { data: [] };
      }

      // Fetch questions for all properties in parallel
      console.log('[TenantQuestionsAPI] Fetching questions for properties:', properties.map(p => p.id));
      const questionPromises = properties.map(property => 
        tenantQuestionsAPI.getPropertyQuestions(property.id, params)
          .then(response => {
            console.log(`[TenantQuestionsAPI] Questions for property ${property.id}:`, response.data?.length || 0);
            return {
              propertyId: property.id,
              propertyAddress: property.address || `Property ${property.id}`,
              questions: response.data || []
            };
          })
          .catch(error => {
            console.error(`[TenantQuestionsAPI] Error fetching questions for property ${property.id}:`, error);
            return {
              propertyId: property.id,
              propertyAddress: property.address || `Property ${property.id}`,
              questions: []
            };
          })
      );

      const results = await Promise.all(questionPromises);
      console.log('[TenantQuestionsAPI] All results:', results);
      
      // Flatten all questions and add property info
      const allQuestions = results.flatMap(result => 
        result.questions.map(q => ({
          ...q,
          propertyId: result.propertyId,
          propertyAddress: result.propertyAddress
        }))
      );

      console.log('[TenantQuestionsAPI] Total questions found:', allQuestions.length);
      console.log('[TenantQuestionsAPI] Questions:', allQuestions);

      return { 
        data: allQuestions,
        propertiesWithQuestions: results.filter(r => r.questions.length > 0)
      };
    } catch (error) {
      console.error('Error fetching owner questions:', error);
      throw error;
    }
  }
};

export default tenantQuestionsAPI;