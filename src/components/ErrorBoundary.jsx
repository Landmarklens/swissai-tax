import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import logger from '../services/enhancedLoggingService';

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
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to our logging service
    logger.critical('ERROR_BOUNDARY', 'Component crashed', {
      component: this.props.componentName || 'Unknown',
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props
    });

    // Also log component error
    logger.logComponentError(
      this.props.componentName || 'Unknown',
      error,
      errorInfo
    );

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send to error reporting service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  handleReset = () => {
    logger.info('ERROR_BOUNDARY', 'Error boundary reset by user', {
      component: this.props.componentName,
      errorCount: this.state.errorCount
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
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
            p: 4
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center'
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2
              }}
            />

            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {this.props.componentName
                ? `The ${this.props.componentName} component encountered an error.`
                : 'An unexpected error occurred in this section.'}
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer' }}>Component Stack</summary>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        mt: 1
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </details>
                )}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>

              {this.props.showReload !== false && (
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              )}
            </Box>

            {this.state.errorCount > 2 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This error has occurred {this.state.errorCount} times. Consider refreshing the page or contacting support.
              </Alert>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export const withErrorBoundary = (Component, componentName) => {
  return (props) => (
    <ErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
