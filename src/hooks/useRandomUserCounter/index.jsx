import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { useTranslation } from 'react-i18next';

export const useRandomUserCounter = () => {
  const { t } = useTranslation();
  const [userCount, setUserCount] = useState(null); // Start with null to show loading state
  const hasInitialized = useRef(false);
  const animationIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const incrementIntervalRef = useRef(null);
  const lastApiValue = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUserCount = async () => {
      // Skip fetch if offline
      if (!navigator.onLine) {
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.USER_COUNTER}`, {
          timeout: 10000, // 10 second timeout
        });
        const count = response.data.user_count;

        if (typeof count === 'number' && isMounted) {
          lastApiValue.current = count;

          if (!hasInitialized.current) {
            hasInitialized.current = true;

            // Clear any existing animation
            if (animationIntervalRef.current) {
              clearInterval(animationIntervalRef.current);
            }

            // Animate from minimum value to actual count (never show 0)
            const minStartValue = Math.min(50, count * 0.7); // Start from 50 or 70% of actual count
            let currentValue = minStartValue;
            const targetValue = count;
            const duration = 2000; // 2 seconds animation
            const steps = 40; // Number of steps in the animation
            const increment = (targetValue - minStartValue) / steps;
            const stepDuration = duration / steps;

            animationIntervalRef.current = setInterval(() => {
              currentValue = Math.min(currentValue + increment, targetValue);
              if (isMounted) {
                setUserCount(Math.floor(currentValue));
              }
              if (currentValue >= targetValue) {
                clearInterval(animationIntervalRef.current);
                animationIntervalRef.current = null;

                // Start incremental updates after initial animation
                startIncrementalUpdates(isMounted);
              }
            }, stepDuration);
          } else {
            // After initial animation, update to new API value smoothly
            setUserCount(count);
          }
        }
      } catch (error) {
        // If API fails, simulate a counter
        if (!hasInitialized.current && isMounted) {
          hasInitialized.current = true;
          lastApiValue.current = 145;

          // Start from a minimum value, never show 0
          let simulatedCount = 100; // Start from 100 instead of 0
          const targetCount = 145; // Default fallback count

          animationIntervalRef.current = setInterval(() => {
            simulatedCount = Math.min(simulatedCount + 5, targetCount);
            if (isMounted) {
              setUserCount(simulatedCount);
            }
            if (simulatedCount >= targetCount) {
              clearInterval(animationIntervalRef.current);
              animationIntervalRef.current = null;

              // Start incremental updates after initial animation
              startIncrementalUpdates(isMounted);
            }
          }, 100);
        }
      }
    };

    // Function to handle incremental updates between API calls
    const startIncrementalUpdates = (mounted) => {
      if (incrementIntervalRef.current) {
        clearInterval(incrementIntervalRef.current);
      }

      // Increment counter every 5-8 seconds between API calls (reduced frequency)
      incrementIntervalRef.current = setInterval(() => {
        if (mounted) {
          setUserCount(prev => {
            // Random increment between 0-2
            const increment = Math.floor(Math.random() * 3);
            // Don't increment too far beyond last API value
            const maxValue = lastApiValue.current + 10;
            return Math.min(prev + increment, maxValue);
          });
        }
      }, 5000 + Math.random() * 3000); // 5-8 seconds randomly
    };

    // Initial fetch
    fetchUserCount();

    // Set up polling every 60 seconds to reduce server load
    pollingIntervalRef.current = setInterval(() => {
      // Only fetch if online to prevent network errors
      if (isMounted && hasInitialized.current && navigator.onLine) {
        fetchUserCount();
      }
    }, 60000); // 60 seconds

    return () => {
      isMounted = false;
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (incrementIntervalRef.current) {
        clearInterval(incrementIntervalRef.current);
      }
    };
  }, []);

  return userCount;
};
