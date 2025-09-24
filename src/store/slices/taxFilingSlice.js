import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { interviewAPI, documentAPI, calculationAPI } from '../../services/api';

// Async thunks
export const startInterview = createAsyncThunk(
  'taxFiling/startInterview',
  async ({ taxYear, language }) => {
    const response = await interviewAPI.startSession({ taxYear, language });
    return response.data;
  }
);

export const submitAnswer = createAsyncThunk(
  'taxFiling/submitAnswer',
  async ({ sessionId, questionId, answer, language }) => {
    const response = await interviewAPI.submitAnswer({
      sessionId,
      questionId,
      answer,
      language
    });
    return response.data;
  }
);

export const calculateTax = createAsyncThunk(
  'taxFiling/calculateTax',
  async (sessionId) => {
    const response = await calculationAPI.calculateTax(sessionId);
    return response.data;
  }
);

export const uploadDocument = createAsyncThunk(
  'taxFiling/uploadDocument',
  async ({ sessionId, documentType, file }) => {
    // First get presigned URL
    const urlResponse = await documentAPI.getUploadUrl({
      sessionId,
      documentType,
      fileName: file.name
    });

    // Upload file to S3
    const formData = new FormData();
    Object.entries(urlResponse.data.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);

    await fetch(urlResponse.data.url, {
      method: 'POST',
      body: formData
    });

    return {
      documentType,
      fileName: file.name,
      s3Key: urlResponse.data.s3_key
    };
  }
);

const initialState = {
  // Interview state
  session: {
    id: null,
    status: 'not_started', // not_started, in_progress, completed, submitted
    taxYear: 2024,
    language: 'en',
    progress: 0,
    currentQuestion: null,
    answers: {},
    requiredDocuments: [],
  },

  // Documents state
  documents: {
    uploaded: [],
    processing: [],
    completed: [],
  },

  // Calculation state
  calculation: {
    result: null,
    estimate: null,
  },

  // UI state
  ui: {
    loading: false,
    error: null,
    currentStep: 'interview', // interview, documents, review, payment
  },

  // User preferences
  preferences: {
    language: 'en',
    canton: 'ZH',
    municipality: 'Zurich',
    saveProgress: true,
  },
};

const taxFilingSlice = createSlice({
  name: 'taxFiling',
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.ui.currentStep = action.payload;
    },
    setLanguage: (state, action) => {
      state.preferences.language = action.payload;
      state.session.language = action.payload;
    },
    setCanton: (state, action) => {
      state.preferences.canton = action.payload;
    },
    setMunicipality: (state, action) => {
      state.preferences.municipality = action.payload;
    },
    clearError: (state) => {
      state.ui.error = null;
    },
    resetSession: (state) => {
      state.session = initialState.session;
      state.documents = initialState.documents;
      state.calculation = initialState.calculation;
    },
    saveAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.session.answers[questionId] = answer;
    },
    setRequiredDocuments: (state, action) => {
      state.session.requiredDocuments = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Start Interview
    builder
      .addCase(startInterview.pending, (state) => {
        state.ui.loading = true;
        state.ui.error = null;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.ui.loading = false;
        state.session.id = action.payload.sessionId;
        state.session.status = 'in_progress';
        state.session.currentQuestion = action.payload.currentQuestion;
        state.session.progress = action.payload.progress || 0;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.ui.loading = false;
        state.ui.error = action.error.message;
      });

    // Submit Answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.ui.loading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.ui.loading = false;
        state.session.progress = action.payload.progress;
        state.session.currentQuestion = action.payload.nextQuestion;

        if (action.payload.status === 'completed') {
          state.session.status = 'completed';
          state.session.requiredDocuments = action.payload.requiredDocuments || [];
          state.ui.currentStep = 'documents';
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.ui.loading = false;
        state.ui.error = action.error.message;
      });

    // Calculate Tax
    builder
      .addCase(calculateTax.pending, (state) => {
        state.ui.loading = true;
      })
      .addCase(calculateTax.fulfilled, (state, action) => {
        state.ui.loading = false;
        state.calculation.result = action.payload;
        state.ui.currentStep = 'review';
      })
      .addCase(calculateTax.rejected, (state, action) => {
        state.ui.loading = false;
        state.ui.error = action.error.message;
      });

    // Upload Document
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.ui.loading = true;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.ui.loading = false;
        state.documents.uploaded.push(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.ui.loading = false;
        state.ui.error = action.error.message;
      });
  },
});

export const {
  setCurrentStep,
  setLanguage,
  setCanton,
  setMunicipality,
  clearError,
  resetSession,
  saveAnswer,
  setRequiredDocuments,
} = taxFilingSlice.actions;

export default taxFilingSlice.reducer;