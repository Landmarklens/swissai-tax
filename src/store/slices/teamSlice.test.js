import { configureStore } from '@reduxjs/toolkit';
import teamReducer, { team, selectTeam } from './teamSlice';
import { getData } from '../../api/apiClient';
import { getTeamRoute } from '../../routes/apiRoutes';

jest.mock('../../api/apiClient');

describe('teamSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        team: teamReducer
      }
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().team;
      expect(state).toEqual({
        isLoading: false,
        isSuccess: false,
        error: null
      });
    });
  });

  describe('team action', () => {
    it('should handle team.pending', () => {
      store.dispatch(team.pending());
      const state = store.getState().team;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle team.fulfilled', async () => {
      const mockResponse = {
        status: 200,
        data: [
          { id: 1, name: 'John Doe', role: 'Developer' },
          { id: 2, name: 'Jane Smith', role: 'Designer' }
        ]
      };
      getData.mockResolvedValue(mockResponse);

      await store.dispatch(team());

      expect(getData).toHaveBeenCalledWith(getTeamRoute, {});

      const state = store.getState().team;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle team.fulfilled with params', async () => {
      const mockResponse = {
        status: 200,
        data: [{ id: 1, name: 'John Doe', role: 'Developer', department: 'Engineering' }]
      };
      getData.mockResolvedValue(mockResponse);

      const params = { department: 'Engineering' };
      await store.dispatch(team(params));

      expect(getData).toHaveBeenCalledWith(getTeamRoute, params);

      const state = store.getState().team;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle team.rejected with error response', async () => {
      const mockError = { status: 500, error: 'Server error' };
      getData.mockResolvedValue(mockError);

      await store.dispatch(team());

      const state = store.getState().team;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Server error');
    });

    it('should handle team.rejected with default error', async () => {
      getData.mockRejectedValue(new Error('Network error'));

      await store.dispatch(team());

      const state = store.getState().team;
      expect(state.isLoading).toBe(false);
      expect(state.isSuccess).toBe(false);
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('selectTeam selector', () => {
    it('should select team state', () => {
      const mockState = {
        team: {
          isLoading: false,
          isSuccess: true,
          error: null
        }
      };

      const result = selectTeam(mockState);
      expect(result).toEqual(mockState.team);
    });
  });
});