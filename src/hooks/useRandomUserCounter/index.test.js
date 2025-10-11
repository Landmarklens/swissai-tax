import { renderHook, waitFor, act } from '@testing-library/react';
import { useRandomUserCounter } from './index.jsx';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('useRandomUserCounter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ shouldClearNativeTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns count within expected range', async () => {
    // Mock successful API response
    axios.get.mockResolvedValue({
      data: { user_count: 1000 }
    });

    const { result, unmount } = renderHook(() => useRandomUserCounter());

    // Initially returns null
    expect(result.current).toBe(null);

    // Wait for API call to resolve and initial state to be set
    await act(async () => {
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
    });

    // The animation runs for 2000ms total
    // Advance time to complete the animation
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    // After animation completes, should be at or near the API value (1000)
    // The value should be 1000 after the full animation
    expect(result.current).toBe(1000);

    // Clean up to avoid infinite timers
    unmount();
  });
});
