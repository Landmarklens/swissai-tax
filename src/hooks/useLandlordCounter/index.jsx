import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useTranslation } from 'react-i18next';

export const useLandlordCounter = () => {
  const { t } = useTranslation();
  const [landlordCount, setLandlordCount] = useState(0);
  const hasInitialized = useRef(false);
  const animationIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const incrementIntervalRef = useRef(null);
  const lastApiValue = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const fetchLandlordStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/landlord-stats/`);
        const count = response.data.active_landlords;

        if (typeof count === 'number' && isMounted) {
          lastApiValue.current = count;

          if (!hasInitialized.current) {
            hasInitialized.current = true;

            // Clear any existing animation
            if (animationIntervalRef.current) {
              clearInterval(animationIntervalRef.current);
            }

            // Animate from 0 to actual count
            let currentValue = 0;
            const targetValue = count;
            const duration = 2000; // 2 seconds animation
            const steps = 40; // Number of steps in the animation
            const increment = targetValue / steps;
            const stepDuration = duration / steps;

            animationIntervalRef.current = setInterval(() => {
              currentValue = Math.min(currentValue + increment, targetValue);
              if (isMounted) {
                setLandlordCount(Math.floor(currentValue));
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
            setLandlordCount(count);
          }
        }
      } catch (error) {
        // If API fails, use a default value
        if (!hasInitialized.current && isMounted) {
          hasInitialized.current = true;
          lastApiValue.current = 450;

          // Start with 0 and animate to default
          let simulatedCount = 0;
          const targetCount = 450; // Default fallback count

          animationIntervalRef.current = setInterval(() => {
            simulatedCount = Math.min(simulatedCount + 10, targetCount);
            if (isMounted) {
              setLandlordCount(simulatedCount);
            }
            if (simulatedCount >= targetCount) {
              clearInterval(animationIntervalRef.current);
              animationIntervalRef.current = null;

              // Start incremental updates after initial animation
              startIncrementalUpdates(isMounted);
            }
          }, 50);
        }
      }
    };

    // Function to handle incremental updates between API calls
    const startIncrementalUpdates = (mounted) => {
      if (incrementIntervalRef.current) {
        clearInterval(incrementIntervalRef.current);
      }

      // Increment counter occasionally between API calls (less frequent than tenants)
      incrementIntervalRef.current = setInterval(() => {
        if (mounted && Math.random() < 0.10) { // Reduced to 10% chance to increment
          setLandlordCount(prev => {
            // Increment by 0-1
            const increment = Math.random() < 0.7 ? 0 : 1;
            // Don't increment too far beyond last API value
            const maxValue = lastApiValue.current + 5;
            return Math.min(prev + increment, maxValue);
          });
        }
      }, 12000); // Check every 12 seconds (reduced frequency)
    };

    // Initial fetch
    fetchLandlordStats();

    // Set up polling every 60 seconds to reduce server load
    pollingIntervalRef.current = setInterval(() => {
      if (isMounted && hasInitialized.current) {
        fetchLandlordStats();
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

  return landlordCount;
};