import React from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error reporting service (e.g., Sentry, LogRocket)
    // This is where you'd send errors to your monitoring service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Implement error logging to your service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, just log to console
    console.error('Error logged to service:', {
      message: error.toString(),
      stack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  handleReset = () => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Optional: Reload the page if errors persist
    if (this.state.errorCount > 3) {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Custom fallback UI if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 3,
            textAlign: 'center'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              maxWidth: 600,
              width: '100%',
              backgroundColor: '#fff'
            }}
          >
            <ErrorIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main',
                mb: 2 
              }} 
            />
            
            <Typography variant="h5" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but an unexpected error occurred. 
              {errorCount > 1 && ` This has happened ${errorCount} times.`}
            </Typography>

            {/* Show error details in development */}
            {showDetails && process.env.NODE_ENV === 'development' && error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  mb: 2, 
                  textAlign: 'left',
                  wordBreak: 'break-word'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ mt: 1, fontSize: '0.85rem' }}>
                  {error.toString()}
                </Typography>
                {errorInfo && (
                  <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                    <summary>Component Stack</summary>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}
                    >
                      {errorInfo.componentStack}
                    </Typography>
                  </details>
                )}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                onClick={this.handleReset}
                color="primary"
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined"
                onClick={() => window.location.href = '/'}
                color="secondary"
              >
                Go Home
              </Button>
            </Box>

            {errorCount > 2 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                If this error persists, please contact support.
              </Typography>
            )}
          </Paper>
        </Box>
      );
    }

    return children;
  }
}

export default ErrorBoundary;