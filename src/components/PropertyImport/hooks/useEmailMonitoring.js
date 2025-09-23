import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'wss://api.homeai.ch/ws';
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_MONITORING_TIME = 60000; // 60 seconds

export const useEmailMonitoring = (propertyId) => {
  const [monitoringStatus, setMonitoringStatus] = useState('idle'); // idle, monitoring, success, failed
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const dispatch = useDispatch();

  // Initialize WebSocket connection
  const initWebSocket = useCallback((config) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WEBSOCKET_URL}/properties/${config.propertyId}/email-monitor`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for email monitoring');
      
      // Send monitoring configuration
      ws.send(JSON.stringify({
        type: 'start_monitoring',
        propertyId: config.propertyId,
        managedEmail: config.managedEmail,
        verificationCode: config.verificationCode
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'test_email_received':
          handleEmailReceived(data);
          break;
        
        case 'monitoring_status':
          console.log('Monitoring status:', data.status);
          break;
        
        case 'error':
          handleError(data.message);
          break;
        
        default:
          console.log('Unknown WebSocket message:', data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Falling back to polling.');
      startPolling(config);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    wsRef.current = ws;
  }, []);

  // Fallback polling mechanism
  const startPolling = useCallback((config) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/properties/${config.propertyId}/check-test-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            managedEmail: config.managedEmail,
            verificationCode: config.verificationCode
          })
        });

        const data = await response.json();
        
        if (data.emailReceived) {
          handleEmailReceived(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLLING_INTERVAL);
  }, []);

  // Handle successful email receipt
  const handleEmailReceived = useCallback((data) => {
    setMonitoringStatus('success');
    setTestResult({
      success: true,
      receivedAt: data.receivedAt || new Date().toISOString(),
      from: data.from,
      subject: data.subject,
      verificationCode: data.verificationCode
    });
    
    // Clean up monitoring
    stopMonitoring();
    
    // Dispatch success action
    dispatch({
      type: 'tenantSelection/emailVerified',
      payload: {
        propertyId: data.propertyId,
        emailVerified: true,
        verifiedAt: data.receivedAt
      }
    });
  }, [dispatch]);

  // Handle errors
  const handleError = useCallback((message) => {
    setError(message);
    setMonitoringStatus('failed');
  }, []);

  // Start monitoring for test email
  const startMonitoring = useCallback((config) => {
    setMonitoringStatus('monitoring');
    setTestResult(null);
    setError(null);
    
    // Try WebSocket first
    initWebSocket(config);
    
    // Set timeout for monitoring
    timeoutRef.current = setTimeout(() => {
      if (monitoringStatus === 'monitoring') {
        setMonitoringStatus('timeout');
        stopMonitoring();
      }
    }, MAX_MONITORING_TIME);
  }, [initWebSocket, monitoringStatus]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (monitoringStatus === 'monitoring') {
      setMonitoringStatus('idle');
    }
  }, [monitoringStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    monitoringStatus,
    testResult,
    error
  };
};

// Alternative: Server-Sent Events (SSE) implementation
export const useEmailMonitoringSSE = (propertyId) => {
  const [monitoringStatus, setMonitoringStatus] = useState('idle');
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  
  const eventSourceRef = useRef(null);
  const dispatch = useDispatch();

  const startMonitoring = useCallback((config) => {
    setMonitoringStatus('monitoring');
    setTestResult(null);
    setError(null);
    
    // Create SSE connection
    const eventSource = new EventSource(
      `/api/properties/${config.propertyId}/email-monitor-sse?` +
      `email=${encodeURIComponent(config.managedEmail)}&` +
      `code=${encodeURIComponent(config.verificationCode)}`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'test_email_received') {
        setMonitoringStatus('success');
        setTestResult({
          success: true,
          ...data
        });
        stopMonitoring();
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setError('Connection lost. Please retry.');
      stopMonitoring();
    };
    
    eventSourceRef.current = eventSource;
    
    // Set timeout
    setTimeout(() => {
      if (monitoringStatus === 'monitoring') {
        setMonitoringStatus('timeout');
        stopMonitoring();
      }
    }, MAX_MONITORING_TIME);
  }, [monitoringStatus]);

  const stopMonitoring = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (monitoringStatus === 'monitoring') {
      setMonitoringStatus('idle');
    }
  }, [monitoringStatus]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    monitoringStatus,
    testResult,
    error
  };
};