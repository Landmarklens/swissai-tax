import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudDownload as DownloadIcon,
  Build as ProcessIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { getApiUrl } from '../utils/api/getApiUrl';
import authService from '../services/authService';
import { toast } from 'react-toastify';

/**
 * Component for tracking import job progress with real-time updates
 * 
 * Usage:
 * <ImportJobProgress 
 *   jobId="import_20250903_123456_abc123" 
 *   onComplete={(propertyId) => handleImportComplete(propertyId)}
 *   onError={(error) => handleImportError(error)}
 * />
 */
const ImportJobProgress = ({ jobId, onComplete, onError, onCancel }) => {
  const [jobStatus, setJobStatus] = useState({
    status: 'pending',
    progress_percentage: 0,
    current_step: 'Initializing...',
    error_message: null,
    property_id: null
  });
  const [isConnected, setIsConnected] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const [sseFailures, setSseFailures] = useState(0);
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const progressAnimationRef = useRef(null);
  const currentProgressRef = useRef(0);
  const simulatedProgressRef = useRef(null);
  const lastRealUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!jobId) return;


    // Polling function for job status updates
    const pollJobStatus = async () => {
      try {
        const token = authService.getToken();
        if (!token) return;

        const response = await fetch(`${getApiUrl()}/api/tenant-selection/import-jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();

          // Stop simulated progress when we get a real update
          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current);
            simulatedProgressRef.current = null;
          }
          lastRealUpdateRef.current = Date.now();
          
          // Use the same smooth animation for polling updates
          const targetProgress = data.progress_percentage || currentProgressRef.current;
          const currentProgress = currentProgressRef.current;
          
          if (targetProgress > currentProgress && targetProgress - currentProgress > 10) {
            // Clear any existing animation
            if (progressAnimationRef.current) {
              clearInterval(progressAnimationRef.current);
              progressAnimationRef.current = null;
            }
            
            const totalDuration = 2000;
            const steps = 30;
            const increment = (targetProgress - currentProgress) / steps;
            const stepDuration = totalDuration / steps;
            let stepCount = 0;
            
            progressAnimationRef.current = setInterval(() => {
              stepCount++;
              const animatedProgress = Math.min(currentProgress + (increment * stepCount), targetProgress);
              currentProgressRef.current = Math.round(animatedProgress);
              
              setJobStatus(prev => ({
                ...prev,
                status: data.status,
                progress_percentage: currentProgressRef.current,
                current_step: data.current_step || prev.current_step,
                error_message: data.error_message,
                property_id: data.property_id
              }));
              
              if (stepCount >= steps || animatedProgress >= targetProgress) {
                clearInterval(progressAnimationRef.current);
                progressAnimationRef.current = null;
                currentProgressRef.current = targetProgress;
                setJobStatus(prev => ({
                  ...prev,
                  progress_percentage: targetProgress
                }));
              }
            }, stepDuration);
          } else {
            currentProgressRef.current = targetProgress;
            setJobStatus(prev => ({
              ...prev,
              status: data.status,
              progress_percentage: targetProgress,
              current_step: data.current_step || prev.current_step,
              error_message: data.error_message,
              property_id: data.property_id
            }));
          }

          // Handle completion
          if (data.status === 'completed' && data.property_id) {
            toast.success('✅ Property import completed successfully!');
            onComplete?.(data.property_id, data);
          } else if (data.status === 'failed') {
            toast.error(`❌ Import failed: ${data.error_message || 'Unknown error'}`);
            onError?.(data.error_message || 'Import failed');
          }

          // Continue polling if job is still active
          if (['pending', 'processing', 'downloading', 'parsing', 'saving'].includes(data.status)) {
            pollingIntervalRef.current = setTimeout(pollJobStatus, 3000);
          }
        }
      } catch (error) {
        console.error(`[ImportJob] Polling error:`, error);
        if (['pending', 'processing', 'downloading', 'parsing', 'saving'].includes(jobStatus.status)) {
          pollingIntervalRef.current = setTimeout(pollJobStatus, 5000);
        }
      }
    };

    // SSE connection function
    const connectToSSE = () => {
      const token = authService.getToken();
      if (!token) {
        console.error('[ImportJob] No authentication token available');
        setUsePolling(true);
        pollJobStatus();
        return;
      }

      
      const eventSource = new EventSource(
        `${getApiUrl()}/api/tenant-selection/import-jobs/${jobId}/stream?token=${encodeURIComponent(token)}`
      );

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setUsePolling(false);
        setSseFailures(0);
        
        // Start simulated progress if we're stuck at low percentage
        startSimulatedProgress();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Stop simulated progress when we get a real update
          if (simulatedProgressRef.current) {
            clearInterval(simulatedProgressRef.current);
            simulatedProgressRef.current = null;
          }
          lastRealUpdateRef.current = Date.now();

          // Animate progress changes smoothly
          const targetProgress = data.progress_percentage ?? currentProgressRef.current;
          const currentProgress = currentProgressRef.current;
          
          // Clear any existing animation
          if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
          }
          
          // If there's a large jump in progress (like from 10% to 100%), animate it smoothly
          if (targetProgress > currentProgress && targetProgress - currentProgress > 10) {
            const totalDuration = 2000; // 2 seconds for animation
            const steps = 30; // Number of animation steps
            const increment = (targetProgress - currentProgress) / steps;
            const stepDuration = totalDuration / steps;
            let stepCount = 0;
            
            progressAnimationRef.current = setInterval(() => {
              stepCount++;
              const animatedProgress = Math.min(currentProgress + (increment * stepCount), targetProgress);
              currentProgressRef.current = Math.round(animatedProgress);
              
              setJobStatus(prev => ({
                ...prev,
                status: data.status || prev.status,
                progress_percentage: currentProgressRef.current,
                current_step: data.current_step || prev.current_step,
                error_message: data.error_message,
                property_id: data.property_id
              }));
              
              if (stepCount >= steps || animatedProgress >= targetProgress) {
                clearInterval(progressAnimationRef.current);
                progressAnimationRef.current = null;
                currentProgressRef.current = targetProgress;
                // Ensure we end at exactly the target
                setJobStatus(prev => ({
                  ...prev,
                  progress_percentage: targetProgress
                }));
              }
            }, stepDuration);
          } else {
            // For small changes or decreases, update immediately
            currentProgressRef.current = targetProgress;
            setJobStatus(prev => ({
              ...prev,
              status: data.status || prev.status,
              progress_percentage: targetProgress,
              current_step: data.current_step || prev.current_step,
              error_message: data.error_message,
              property_id: data.property_id
            }));
          }

          // Handle completion
          if (data.type === 'job_finished') {
            if (data.status === 'completed' && data.property_id) {
              toast.success('✅ Property import completed successfully!');
              onComplete?.(data.property_id, data);
            } else if (data.status === 'failed') {
              toast.error(`❌ Import failed: ${data.error_message || 'Unknown error'}`);
              onError?.(data.error_message || 'Import failed');
            }
            
            // Close connection after job finishes
            eventSource.close();
            setIsConnected(false);
          }
        } catch (error) {
          console.error(`[ImportJob] Error parsing SSE data:`, error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[ImportJob] SSE connection error:`, error);
        setIsConnected(false);
        
        const newFailureCount = sseFailures + 1;
        setSseFailures(newFailureCount);
        
        // Fall back to polling after 3 SSE failures
        if (newFailureCount >= 3 && !usePolling) {
          setUsePolling(true);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          // Start polling with simulated progress
          pollJobStatus();
          startSimulatedProgress();
        } else if (newFailureCount < 3) {
          // Try to reconnect after a delay for the first few failures
          setTimeout(() => {
            if (['pending', 'processing', 'downloading', 'parsing', 'saving'].includes(jobStatus.status)) {
              connectToSSE();
            }
          }, 2000 * newFailureCount); // Exponential backoff
        }
      };
    };

    // Function to simulate progress when no updates are received
    const startSimulatedProgress = () => {
      // Clear any existing simulation
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current);
      }
      
      simulatedProgressRef.current = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastRealUpdateRef.current;
        const currentProg = currentProgressRef.current;
        
        // Only simulate if we haven't received updates for 2+ seconds and below 90%
        if (timeSinceLastUpdate > 2000 && currentProg < 90 && jobStatus.status === 'processing') {
          // Simulate slow progress (1% every 2 seconds, max 85% to leave room for real completion)
          const simulatedIncrease = Math.min(1, 85 - currentProg);
          if (simulatedIncrease > 0) {
            const newProgress = currentProg + simulatedIncrease;
            currentProgressRef.current = newProgress;
            
            setJobStatus(prev => {
              if (prev.status !== 'processing') {
                // Stop simulation if status changed
                clearInterval(simulatedProgressRef.current);
                simulatedProgressRef.current = null;
                return prev;
              }
              return {
                ...prev,
                progress_percentage: newProgress,
                current_step: prev.current_step || 'Processing property data...'
              };
            });
          }
        }
      }, 2000); // Check every 2 seconds
    };

    // Try SSE first, fall back to polling if needed
    if (!usePolling) {
      connectToSSE();
    } else {
      pollJobStatus();
      startSimulatedProgress();
    }

    // Cleanup on unmount
    return () => {
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current);
        simulatedProgressRef.current = null;
      }
      if (progressAnimationRef.current) {
        clearInterval(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobId]);

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
      case 'downloading':
      case 'parsing':
      case 'saving':
        return <CircularProgress size={24} />;
      default:
        return <ScheduleIcon color="primary" />;
    }
  };

  const getStatusColor = () => {
    switch (jobStatus.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
      case 'downloading':
      case 'parsing':
      case 'saving':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStepIcon = (stepName) => {
    switch (stepName) {
      case 'downloading':
        return <DownloadIcon />;
      case 'parsing':
        return <ProcessIcon />;
      case 'saving':
        return <SaveIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStatusIcon()}
          <Box flex={1}>
            <Typography variant="h6" component="div">
              Property Import Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job ID: {jobId}
            </Typography>
          </Box>
          <Chip 
            label={jobStatus.status.toUpperCase()} 
            color={getStatusColor()}
            variant="outlined"
          />
        </Box>

        {/* Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {jobStatus.current_step}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {jobStatus.progress_percentage}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={jobStatus.progress_percentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Connection Status */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected 
                ? 'success.main' 
                : usePolling 
                ? 'warning.main' 
                : 'primary.main'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {isConnected 
              ? 'Connected to real-time updates' 
              : usePolling 
              ? 'Using polling updates (every 3 seconds)'
              : 'Connecting to real-time updates...'}
          </Typography>
        </Box>

        {/* Error Message */}
        {jobStatus.error_message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {jobStatus.error_message}
          </Alert>
        )}

        {/* Estimated Duration */}
        {jobStatus.status === 'pending' || jobStatus.status === 'processing' ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This import typically takes 2-3 minutes. Please keep this page open to monitor progress.
            </Typography>
          </Alert>
        ) : null}

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          {(jobStatus.status === 'pending' || jobStatus.status === 'processing') && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={onCancel}
            >
              Cancel Import
            </Button>
          )}
          
          {jobStatus.status === 'completed' && jobStatus.property_id && (
            <Button
              variant="contained"
              onClick={() => onComplete?.(jobStatus.property_id, jobStatus)}
            >
              View Property
            </Button>
          )}
          
          {jobStatus.status === 'failed' && (
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ImportJobProgress;