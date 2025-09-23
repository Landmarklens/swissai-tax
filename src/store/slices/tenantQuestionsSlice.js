import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tenantQuestionsAPI from '../../api/tenantQuestionsApi';

const initialState = {
  questions: {
    data: [],
    isLoading: false,
    error: null
  },
  unansweredQuestions: {
    data: [],
    isLoading: false,
    error: null
  },
  currentQuestion: {
    data: null,
    isLoading: false,
    error: null
  },
  submitQuestion: {
    data: null,
    isLoading: false,
    error: null
  },
  respondToQuestion: {
    data: null,
    isLoading: false,
    error: null
  },
  ownerQuestions: {
    data: [],
    propertiesWithQuestions: [],
    isLoading: false,
    error: null
  }
};

// Async thunks
export const fetchPropertyQuestions = createAsyncThunk(
  'tenantQuestions/fetchPropertyQuestions',
  async ({ propertyId, params }, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.getPropertyQuestions(propertyId, params);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch questions'
      );
    }
  }
);

export const fetchOwnerQuestions = createAsyncThunk(
  'tenantQuestions/fetchOwnerQuestions',
  async (params = {}, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.getOwnerQuestions(params);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch owner questions'
      );
    }
  }
);

export const fetchUnansweredQuestions = createAsyncThunk(
  'tenantQuestions/fetchUnansweredQuestions',
  async (limit = 50, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.getUnansweredQuestions(limit);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch unanswered questions'
      );
    }
  }
);

export const submitNewQuestion = createAsyncThunk(
  'tenantQuestions/submitQuestion',
  async ({ propertyId, questionData }, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.submitQuestion(propertyId, questionData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to submit question'
      );
    }
  }
);

export const triageQuestion = createAsyncThunk(
  'tenantQuestions/triageQuestion',
  async (questionData, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.triageQuestion(questionData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to triage question'
      );
    }
  }
);

export const respondToQuestion = createAsyncThunk(
  'tenantQuestions/respondToQuestion',
  async ({ questionId, responseText }, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.respondToQuestion(questionId, responseText);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to respond to question'
      );
    }
  }
);

export const escalateQuestion = createAsyncThunk(
  'tenantQuestions/escalateQuestion',
  async ({ questionId, escalationData }, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.escalateQuestion(questionId, escalationData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to escalate question'
      );
    }
  }
);

export const fetchQuestion = createAsyncThunk(
  'tenantQuestions/fetchQuestion',
  async (questionId, thunkAPI) => {
    try {
      const response = await tenantQuestionsAPI.getQuestion(questionId);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch question'
      );
    }
  }
);

const tenantQuestionsSlice = createSlice({
  name: 'tenantQuestions',
  initialState,
  reducers: {
    clearSubmitQuestion: (state) => {
      state.submitQuestion = {
        data: null,
        isLoading: false,
        error: null
      };
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = {
        data: null,
        isLoading: false,
        error: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch property questions
      .addCase(fetchPropertyQuestions.pending, (state) => {
        state.questions.isLoading = true;
        state.questions.error = null;
      })
      .addCase(fetchPropertyQuestions.fulfilled, (state, action) => {
        state.questions.isLoading = false;
        state.questions.data = action.payload || [];
        state.questions.error = null;
      })
      .addCase(fetchPropertyQuestions.rejected, (state, action) => {
        state.questions.isLoading = false;
        state.questions.error = action.payload;
      })

      // Fetch owner questions
      .addCase(fetchOwnerQuestions.pending, (state) => {
        state.ownerQuestions.isLoading = true;
        state.ownerQuestions.error = null;
      })
      .addCase(fetchOwnerQuestions.fulfilled, (state, action) => {
        state.ownerQuestions.isLoading = false;
        state.ownerQuestions.data = action.payload.data || [];
        state.ownerQuestions.propertiesWithQuestions = action.payload.propertiesWithQuestions || [];
        state.ownerQuestions.error = null;
      })
      .addCase(fetchOwnerQuestions.rejected, (state, action) => {
        state.ownerQuestions.isLoading = false;
        state.ownerQuestions.error = action.payload;
      })

      // Fetch unanswered questions
      .addCase(fetchUnansweredQuestions.pending, (state) => {
        state.unansweredQuestions.isLoading = true;
        state.unansweredQuestions.error = null;
      })
      .addCase(fetchUnansweredQuestions.fulfilled, (state, action) => {
        state.unansweredQuestions.isLoading = false;
        state.unansweredQuestions.data = action.payload || [];
        state.unansweredQuestions.error = null;
      })
      .addCase(fetchUnansweredQuestions.rejected, (state, action) => {
        state.unansweredQuestions.isLoading = false;
        state.unansweredQuestions.error = action.payload;
      })

      // Submit question
      .addCase(submitNewQuestion.pending, (state) => {
        state.submitQuestion.isLoading = true;
        state.submitQuestion.error = null;
      })
      .addCase(submitNewQuestion.fulfilled, (state, action) => {
        state.submitQuestion.isLoading = false;
        state.submitQuestion.data = action.payload;
        state.submitQuestion.error = null;
        // Add new question to the list
        if (action.payload) {
          state.questions.data.unshift(action.payload);
        }
      })
      .addCase(submitNewQuestion.rejected, (state, action) => {
        state.submitQuestion.isLoading = false;
        state.submitQuestion.error = action.payload;
      })

      // Triage question
      .addCase(triageQuestion.pending, (state) => {
        state.submitQuestion.isLoading = true;
        state.submitQuestion.error = null;
      })
      .addCase(triageQuestion.fulfilled, (state, action) => {
        state.submitQuestion.isLoading = false;
        state.submitQuestion.data = action.payload;
        state.submitQuestion.error = null;
        // Add new question to the list
        if (action.payload) {
          state.questions.data.unshift(action.payload);
        }
      })
      .addCase(triageQuestion.rejected, (state, action) => {
        state.submitQuestion.isLoading = false;
        state.submitQuestion.error = action.payload;
      })

      // Respond to question
      .addCase(respondToQuestion.pending, (state) => {
        state.respondToQuestion.isLoading = true;
        state.respondToQuestion.error = null;
      })
      .addCase(respondToQuestion.fulfilled, (state, action) => {
        state.respondToQuestion.isLoading = false;
        state.respondToQuestion.data = action.payload;
        state.respondToQuestion.error = null;
        // Update the question in the list
        const index = state.questions.data.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.questions.data[index] = action.payload;
        }
        // Update in owner questions too
        const ownerIndex = state.ownerQuestions.data.findIndex(q => q.id === action.payload.id);
        if (ownerIndex !== -1) {
          state.ownerQuestions.data[ownerIndex] = action.payload;
        }
        // Update current question if it's the same
        if (state.currentQuestion.data?.id === action.payload.id) {
          state.currentQuestion.data = action.payload;
        }
      })
      .addCase(respondToQuestion.rejected, (state, action) => {
        state.respondToQuestion.isLoading = false;
        state.respondToQuestion.error = action.payload;
      })

      // Escalate question
      .addCase(escalateQuestion.fulfilled, (state, action) => {
        // Update the question in the list
        const index = state.questions.data.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.questions.data[index] = action.payload;
        }
        // Update in owner questions too
        const ownerIndex = state.ownerQuestions.data.findIndex(q => q.id === action.payload.id);
        if (ownerIndex !== -1) {
          state.ownerQuestions.data[ownerIndex] = action.payload;
        }
        // Update current question if it's the same
        if (state.currentQuestion.data?.id === action.payload.id) {
          state.currentQuestion.data = action.payload;
        }
      })

      // Fetch single question
      .addCase(fetchQuestion.pending, (state) => {
        state.currentQuestion.isLoading = true;
        state.currentQuestion.error = null;
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.currentQuestion.isLoading = false;
        state.currentQuestion.data = action.payload;
        state.currentQuestion.error = null;
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.currentQuestion.isLoading = false;
        state.currentQuestion.error = action.payload;
      });
  }
});

export const { clearSubmitQuestion, clearCurrentQuestion } = tenantQuestionsSlice.actions;

// Selectors
export const selectQuestions = (state) => state.tenantQuestions.questions;
export const selectOwnerQuestions = (state) => state.tenantQuestions.ownerQuestions;
export const selectUnansweredQuestions = (state) => state.tenantQuestions.unansweredQuestions;
export const selectCurrentQuestion = (state) => state.tenantQuestions.currentQuestion;
export const selectSubmitQuestion = (state) => state.tenantQuestions.submitQuestion;
export const selectRespondToQuestion = (state) => state.tenantQuestions.respondToQuestion;

export default tenantQuestionsSlice.reducer;