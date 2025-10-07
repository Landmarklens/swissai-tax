import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';
import documentStorageService from '../../services/documentStorageService';
import config from '../../config/environments';
import logger from '../../services/loggingService';
const API_URL = config.API_BASE_URL;

const initialState = {
  createDocument: {
    data: [],
    isLoading: false,
    error: null
  },
  documents: {
    data: [], // Changed from null to empty array
    isLoading: false,
    error: null
  },
  updateDocument: {
    data: null,
    isLoading: false,
    error: null
  },
  deleteDocument: {
    data: null,
    isLoading: false,
    error: null
  }
};


export const getDocuments = createAsyncThunk('documents/get-documents', async (_, thunkAPI) => {
  logger.info('DOCUMENTS_SLICE', 'Getting documents');
  
  try {
    const user = authService.getCurrentUser();
    if (!user || !user.access_token) {
      logger.warn('DOCUMENTS_SLICE', 'No authenticated user, using localStorage');
      // Still try to get documents from localStorage for demo purposes
      const localDocuments = documentStorageService.getDocuments();
      logger.debug('DOCUMENTS_SLICE', 'Retrieved documents from localStorage', {
        count: localDocuments.length
      });
      return { documents: localDocuments };
    }
    
    // Check for user ID in different possible locations
    const userId = user.id || user.user_id || user.userId;
    
    if (!userId) {
      logger.warn('DOCUMENTS_SLICE', 'User ID not found, using localStorage', {
        userKeys: Object.keys(user)
      });
      const localDocuments = documentStorageService.getDocuments();
      return { documents: localDocuments };
    }
    
    logger.debug('DOCUMENTS_SLICE', 'Attempting to fetch documents from API', {
      userId: userId,
      url: `${API_URL}/users/${userId}/documents`
    });
    
    // Try backend API first
    try {
      const response = await axios.get(`${API_URL}/api/user/${userId}/documents`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`
        }
      });
      
      logger.info('DOCUMENTS_SLICE', 'Documents fetched from API successfully', {
        count: response.data?.documents?.length || 0
      });
      
      // If successful, sync with localStorage
      if (response.data && response.data.documents) {
        documentStorageService.setDocuments(response.data.documents);
        logger.debug('DOCUMENTS_SLICE', 'Synced documents to localStorage');
      }
      
      return response.data;
    } catch (apiError) {
      // If API fails, fallback to localStorage
      const status = apiError.response?.status;
      
      if (status === 405) {
        logger.info('DOCUMENTS_SLICE', 'Documents API not implemented (405), using localStorage');
      } else {
        logger.warn('DOCUMENTS_SLICE', 'API request failed, falling back to localStorage', {
          error: apiError.message,
          status: status
        });
      }
      
      const localDocuments = documentStorageService.getDocuments();
      return { documents: localDocuments };
    }
  } catch (error) {
    logger.error('DOCUMENTS_SLICE', 'Error getting documents', {
      error: error.message
    });
    // Fallback to localStorage
    const localDocuments = documentStorageService.getDocuments();
    return { documents: localDocuments };
  }
});

export const createDocument = createAsyncThunk(
  'documents/create-document',
  async (body, thunkAPI) => {
    logger.info('DOCUMENTS_SLICE', 'Creating new document', {
      templateId: body.template_id,
      status: body.status
    });
    
    try {
      const user = authService.getCurrentUser();
      
      // Add user ID to document if available
      if (user) {
        const userId = user.id || user.user_id || user.userId;
        if (userId) {
          body.user_id = userId;
        }
      }
      
      // Try backend API first
      try {
        logger.debug('DOCUMENTS_SLICE', 'Attempting to create document via API', {
          url: `${API_URL}/api/documents/`,
          hasToken: !!(user.access_token || localStorage.getItem('token'))
        });
        
        const response = await axios.post(`${API_URL}/api/documents/`, body, {
          headers: {
            Authorization: `Bearer ${user.access_token || localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        logger.info('DOCUMENTS_SLICE', 'Document created via API', {
          documentId: response.data.document_id || response.data.id,
          responseKeys: Object.keys(response.data)
        });
        
        // Also save to localStorage with proper ID
        const documentWithId = {
          ...response.data,
          id: response.data.document_id || response.data.id
        };
        documentStorageService.addDocument(documentWithId);
        return documentWithId;
      } catch (apiError) {
        // If API fails, save to localStorage only
        logger.warn('DOCUMENTS_SLICE', 'API unavailable, saving to localStorage', {
          error: apiError.message,
          status: apiError.response?.status
        });
        const newDocument = documentStorageService.addDocument(body);
        logger.info('DOCUMENTS_SLICE', 'Document saved to localStorage', {
          documentId: newDocument.id
        });
        return newDocument;
      }
    } catch (error) {
      logger.error('DOCUMENTS_SLICE', 'Error creating document, using localStorage fallback', {
        error: error.message
      });
      // Fallback to localStorage
      const newDocument = documentStorageService.addDocument(body);
      return newDocument;
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/update-document',
  async ({ documentId, body }, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      
      // Try backend API first
      try {
        const response = await axios.put(`${API_URL}/api/documents/${documentId}`, body, {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        });
        
        // Also update in localStorage
        documentStorageService.updateDocument(documentId, response.data);
        return response.data;
      } catch (apiError) {
        // If API fails, update in localStorage only
        const updatedDocument = documentStorageService.updateDocument(documentId, body);
        return updatedDocument;
      }
    } catch (error) {
      // Fallback to localStorage
      const updatedDocument = documentStorageService.updateDocument(documentId, body);
      return updatedDocument;
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/delete-document',
  async (documentId, thunkAPI) => {
    try {
      const user = authService.getCurrentUser();
      
      // Try backend API first
      try {
        const response = await axios.delete(`${API_URL}/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`
          }
        });
        
        // Also delete from localStorage
        documentStorageService.deleteDocument(documentId);
        return { id: documentId, ...response.data };
      } catch (apiError) {
        // If API fails, delete from localStorage only
        documentStorageService.deleteDocument(documentId);
        return { id: documentId, success: true };
      }
    } catch (error) {
      // Fallback to localStorage
      documentStorageService.deleteDocument(documentId);
      return { id: documentId, success: true };
    }
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDocuments.pending, (state) => {
        state.documents.isLoading = true;
        state.documents.error = null;
      })
      .addCase(getDocuments.fulfilled, (state, action) => {
        state.documents.isLoading = false;
        // Handle both array and object with documents property
        const documentsData = action.payload?.documents || action.payload || [];
        
        // Ensure it's always an array
        if (Array.isArray(documentsData)) {
          state.documents.data = documentsData;
        } else if (documentsData && typeof documentsData === 'object') {
          // If it's an object, try to extract documents array
          state.documents.data = documentsData.documents || [];
        } else {
          state.documents.data = [];
        }
        
        logger.debug('DOCUMENTS_SLICE', 'Documents state updated', {
          dataType: Array.isArray(state.documents.data) ? 'array' : typeof state.documents.data,
          count: Array.isArray(state.documents.data) ? state.documents.data.length : 0
        });
      })
      .addCase(getDocuments.rejected, (state, action) => {
        state.documents.isLoading = false;
        state.documents.error = action.payload;
      })

      .addCase(createDocument.pending, (state) => {
        state.createDocument.isLoading = true;
        state.createDocument.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.createDocument.isLoading = false;
        state.createDocument.data = action.payload;
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.createDocument.isLoading = false;
        state.createDocument.error = action.payload;
      })

      .addCase(updateDocument.pending, (state) => {
        state.updateDocument.isLoading = true;
        state.updateDocument.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.updateDocument.isLoading = false;
        state.updateDocument.data = action.payload;
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.updateDocument.isLoading = false;
        state.updateDocument.error = action.payload;
      })

      .addCase(deleteDocument.pending, (state) => {
        state.deleteDocument.isLoading = true;
        state.deleteDocument.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.deleteDocument.isLoading = false;
        state.deleteDocument.data = action.payload;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.deleteDocument.isLoading = false;
        state.deleteDocument.error = action.payload;
      });
  }
});

export const selectDocuments = (state) => state.documents;

export default documentsSlice.reducer;
