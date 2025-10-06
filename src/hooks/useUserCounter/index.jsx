import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax';

/**
 * Custom hook for managing the dynamic user counter
 *
 * Features:
 * - Fetches real count from API
 * - Animates from 0 to current count on initial load
 * - Polls API every 60 seconds for updates
 * - Local increments between API calls for smooth UX
 * - Fallback to simulated count if API fails
 */
export const useUserCounter = () => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const lastApiCountRef = useRef(145);  // Fallback to 145 daily users like HomeAI
  const intervalIdRef = useRef(null);
  const animationIntervalRef = useRef(null);

  // Fetch count from API
  const fetchCount = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-counter/`);
      const newCount = response.data.user_count;

      lastApiCountRef.current = newCount;

      // If not animating, update count directly
      if (!isAnimating) {
        setCount(newCount);
      }

      return newCount;
    } catch (error) {
      console.error('Error fetching user counter:', error);
      // Fallback to simulated count if API fails
      return lastApiCountRef.current;
    }
  }, [isAnimating]);

  // Initial animation from 0 to current count
  useEffect(() => {
    let currentStep = 0;
    const steps = 40;

    // Fetch initial count
    fetchCount().then(targetCount => {
      const increment = Math.ceil(targetCount / steps);

      animationIntervalRef.current = setInterval(() => {
        currentStep++;

        if (currentStep >= steps) {
          setCount(targetCount);
          setIsAnimating(false);
          clearInterval(animationIntervalRef.current);
        } else {
          setCount(prev => Math.min(prev + increment, targetCount));
        }
      }, 50); // 40 steps * 50ms = 2 seconds total animation
    });

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [fetchCount]);

  // Poll API every 60 seconds after animation completes
  useEffect(() => {
    if (isAnimating) return;

    // Initial fetch
    fetchCount();

    // Set up polling
    const pollInterval = setInterval(() => {
      fetchCount();
    }, 60000); // 60 seconds

    return () => clearInterval(pollInterval);
  }, [isAnimating, fetchCount]);

  // Local increments between API calls (every 5-8 seconds)
  useEffect(() => {
    if (isAnimating) return;

    const startLocalIncrements = () => {
      const randomDelay = 5000 + Math.random() * 3000; // 5-8 seconds

      intervalIdRef.current = setTimeout(() => {
        setCount(prev => {
          // Random increment of 0-2
          const increment = Math.floor(Math.random() * 3);
          const newCount = prev + increment;

          // Don't increment more than 10 beyond last API value
          if (newCount > lastApiCountRef.current + 10) {
            return prev;
          }

          return newCount;
        });

        startLocalIncrements();
      }, randomDelay);
    };

    startLocalIncrements();

    return () => {
      if (intervalIdRef.current) {
        clearTimeout(intervalIdRef.current);
      }
    };
  }, [isAnimating]);

  return count;
};

export default useUserCounter;
