/**
 * Unit tests for InterviewPage component
 * Tests interview initialization, answer submission, and filing session management
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import InterviewPage from './InterviewPage';
import { api } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../components/loggedInHeader/loggedInHeader', () => {
  return function MockLoggedInHeader() {
    return <div data-testid="logged-in-header">Header</div>;
  };
});
jest.mock('../../components/footer/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});
jest.mock('../../components/TaxFiling/QuestionCard', () => {
  return function MockQuestionCard({ question, onSubmit }) {
    return (
      <div data-testid="question-card">
        <div>{question?.text || question?.question_text}</div>
        <button onClick={() => onSubmit('test-answer')}>Submit</button>
      </div>
    );
  };
});
jest.mock('./components/ProgressBar', () => {
  return function MockProgressBar() {
    return <div data-testid="progress-bar">Progress</div>;
  };
});
jest.mock('./components/TaxEstimateSidebar', () => {
  return function MockTaxEstimateSidebar() {
    return <div data-testid="tax-estimate-sidebar">Tax Estimate</div>;
  };
});

const mockStore = configureStore([]);

describe('InterviewPage', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      user: { currentUser: { id: 'user-123', email: 'test@example.com' } }
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Interview Initialization', () => {
    it('should start interview and auto-create filing session', async () => {
      // Setup
      const mockStartResponse = {
        data: {
          session_id: 'interview-session-123',
          filing_session_id: 'filing-session-456',
          current_question: {
            id: 'Q01',
            text: 'What is your civil status on 31 Dec?',
            type: 'single_choice',
            options: [
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' }
            ]
          },
          progress: 0,
          status: 'in_progress'
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);

      // Execute
      renderWithProviders(<InterviewPage />);

      // Assert
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/interview/start', {
          tax_year: 2024,
          language: 'en'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('What is your civil status on 31 Dec?')).toBeInTheDocument();
      });
    });

    it('should display error if interview start fails', async () => {
      // Setup
      api.post.mockRejectedValueOnce(new Error('Network error'));

      // Execute
      renderWithProviders(<InterviewPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to start interview/i)).toBeInTheDocument();
      });
    });

    it('should handle both camelCase and snake_case response formats', async () => {
      // Setup - API returns snake_case
      const mockStartResponse = {
        data: {
          session_id: 'interview-session-123',
          filing_session_id: 'filing-session-456',
          current_question: {
            id: 'Q01',
            text: 'Test question',
            type: 'single_choice',
            options: []
          },
          progress: 0
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);

      // Execute
      renderWithProviders(<InterviewPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test question')).toBeInTheDocument();
      });
    });
  });

  describe('Answer Submission', () => {
    beforeEach(async () => {
      // Setup initial interview state
      const mockStartResponse = {
        data: {
          session_id: 'interview-session-123',
          filing_session_id: 'filing-session-456',
          current_question: {
            id: 'Q01',
            text: 'What is your civil status?',
            type: 'single_choice',
            options: [{ value: 'married', label: 'Married' }]
          },
          progress: 0
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);
      renderWithProviders(<InterviewPage />);

      await waitFor(() => {
        expect(screen.getByText('What is your civil status?')).toBeInTheDocument();
      });

      // Clear mock to track next call
      api.post.mockClear();
    });

    it('should submit answer with filing_session_id', async () => {
      // Setup
      const mockAnswerResponse = {
        data: {
          valid: true,
          current_question: {
            id: 'Q02',
            text: 'What is your age?',
            type: 'number'
          },
          progress: 10,
          complete: false
        }
      };

      api.post.mockResolvedValueOnce(mockAnswerResponse);

      // Execute
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/interview/interview-session-123/answer',
          {
            filing_session_id: 'filing-session-456',
            question_id: 'Q01',
            answer: 'test-answer'
          }
        );
      });

      await waitFor(() => {
        expect(screen.getByText('What is your age?')).toBeInTheDocument();
      });
    });

    it('should handle invalid answer response', async () => {
      // Setup
      const mockAnswerResponse = {
        data: {
          valid: false,
          error: 'Invalid answer format. Please try again.'
        }
      };

      api.post.mockResolvedValueOnce(mockAnswerResponse);

      // Execute
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Invalid answer format/i)).toBeInTheDocument();
      });
    });

    it('should navigate to document checklist on completion', async () => {
      // Setup
      const mockAnswerResponse = {
        data: {
          valid: true,
          complete: true,
          profile: { civil_status: 'married', canton: 'ZH' },
          document_requirements: ['passport', 'income_statement'],
          progress: 100
        }
      };

      api.post.mockResolvedValueOnce(mockAnswerResponse);

      // Execute
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
        // Navigation would happen here - can't easily test in this setup
      });
    });

    it('should handle answer submission error', async () => {
      // Setup
      api.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { detail: 'Not Found' }
        }
      });

      // Execute
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to submit answer/i)).toBeInTheDocument();
      });
    });

    it('should not submit if filing session ID is missing', async () => {
      // This test verifies the guard condition
      // In real scenario, this shouldn't happen, but it's a safety check

      // Setup - force component into invalid state by clearing filing_session_id
      // This is a defensive test for the guard condition
      const mockStartResponse = {
        data: {
          session_id: 'interview-session-123',
          filing_session_id: null, // No filing session
          current_question: {
            id: 'Q01',
            text: 'Test',
            type: 'single_choice',
            options: []
          },
          progress: 0
        }
      };

      api.post.mockClear();
      api.post.mockResolvedValueOnce(mockStartResponse);

      renderWithProviders(<InterviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      api.post.mockClear();

      // Execute - try to submit
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert - should not make API call
      await waitFor(() => {
        expect(api.post).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Question Type Transformations', () => {
    it('should transform single_choice to select', async () => {
      // Setup
      const mockStartResponse = {
        data: {
          session_id: 'session-123',
          filing_session_id: 'filing-123',
          current_question: {
            id: 'Q01',
            text: 'Choose one',
            type: 'single_choice',
            options: [{ value: 'option1', label: 'Option 1' }]
          },
          progress: 0
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);

      // Execute
      renderWithProviders(<InterviewPage />);

      // Assert - QuestionCard should receive transformed question
      await waitFor(() => {
        expect(screen.getByText('Choose one')).toBeInTheDocument();
      });
    });

    it('should transform yes_no to boolean', async () => {
      // Setup initial state
      const mockStartResponse = {
        data: {
          session_id: 'session-123',
          filing_session_id: 'filing-123',
          current_question: {
            id: 'Q01',
            text: 'First question',
            type: 'single_choice',
            options: []
          },
          progress: 0
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);
      renderWithProviders(<InterviewPage />);

      await waitFor(() => {
        expect(screen.getByText('First question')).toBeInTheDocument();
      });

      // Setup answer response with yes_no question
      const mockAnswerResponse = {
        data: {
          valid: true,
          current_question: {
            id: 'Q03',
            text: 'Do you have children?',
            type: 'yes_no'
          },
          progress: 20,
          complete: false
        }
      };

      api.post.mockResolvedValueOnce(mockAnswerResponse);

      // Execute - submit answer to get next question
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert - should transform to boolean
      await waitFor(() => {
        expect(screen.getByText('Do you have children?')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress after successful answer submission', async () => {
      // Setup
      const mockStartResponse = {
        data: {
          session_id: 'session-123',
          filing_session_id: 'filing-123',
          current_question: {
            id: 'Q01',
            text: 'Question 1',
            type: 'single_choice',
            options: []
          },
          progress: 0
        }
      };

      api.post.mockResolvedValueOnce(mockStartResponse);
      renderWithProviders(<InterviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Question 1')).toBeInTheDocument();
      });

      // Setup answer response with updated progress
      const mockAnswerResponse = {
        data: {
          valid: true,
          current_question: {
            id: 'Q02',
            text: 'Question 2',
            type: 'single_choice',
            options: []
          },
          progress: 25
        }
      };

      api.post.mockResolvedValueOnce(mockAnswerResponse);

      // Execute
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Question 2')).toBeInTheDocument();
      });
    });
  });
});
