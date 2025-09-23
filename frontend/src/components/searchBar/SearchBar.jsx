import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TextField, InputAdornment, Button, Snackbar, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { theme } from '../../theme/theme';
import authService from '../../services/authService';
import { toQueryParamValue } from './../../utils/toQueryParamValue';

export const SearchBar = ({ isMobile = false }) => {
  const { t } = useTranslation();
  const timeoutRef = useRef(null);

  const isAuthenticated = authService.isAuthenticated();

  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar state

  const navigate = useNavigate();

  const phrases = useMemo(
    () => [
      t('blue kitchen'),
      t('steamer'),
      t('view of the lake'),
      t('luxury bathroom'),
      t('spacious garden'),
      t('cozy fireplace'),
      t('quiet 3-bed near ETH Zürich'),
      t('loft with balcony in Genève'),
      t('family flat close to the lake in Locarno')
    ],
    [t]
  );

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isTyping = true;

    const streamText = () => {
      if (!isStreaming) return;

      const currentPhrase = phrases[phraseIndex];

      if (isTyping) {
        if (charIndex < currentPhrase.length) {
          setValue(currentPhrase.slice(0, charIndex + 1));
          charIndex++;
        } else {
          isTyping = false;
          timeoutRef.current = setTimeout(streamText, 1000); // Pause at end of phrase
          return;
        }
      } else {
        if (charIndex > 0) {
          setValue(currentPhrase.slice(0, charIndex - 1));
          charIndex--;
        } else {
          isTyping = true;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutRef.current = setTimeout(streamText, 500); // Pause before next phrase
          return;
        }
      }

      timeoutRef.current = setTimeout(streamText, 100);
    };

    streamText();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isStreaming, phrases]);

  const handleFocus = () => {
    setIsStreaming(false);
    setValue(''); // Clear the input value
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleButtonClick = () => {
    handleSearchAction();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearchAction();
    }
  };

  function redirectToChat(searchValue) {
    // Construct query parameters using URLSearchParams
    const params = new URLSearchParams({ input: toQueryParamValue(searchValue) });
    // Navigate with properly encoded query parameters
    navigate(`/chat?${params.toString()}`);
  }

  const handleSearchAction = () => {
    // If no text is entered, still proceed with the action
    const searchValue = value.trim() || '';
    
    // Store the search input (even if empty)
    localStorage.setItem('input', toQueryParamValue(searchValue));
    
    if (!isAuthenticated) {
      // Redirect to home page with login modal open
      if (searchValue) {
        navigate(`/?login=true&input=${encodeURIComponent(toQueryParamValue(searchValue))}`);
      } else {
        navigate(`/?login=true`);
      }
      return;
    }
    
    // User is authenticated, redirect to chat
    if (searchValue) {
      redirectToChat(searchValue);
    } else {
      // Redirect to chat without input parameter
      navigate('/chat');
    }
  };

  return (
    <>
      <div>
        <TextField
          onKeyDown={handleKeyDown}
          variant="outlined"
          value={value}
          onFocus={handleFocus}
          onBlur={(e) => {
            const relatedTarget = e.relatedTarget || e.nativeEvent.relatedTarget;
            if (relatedTarget && relatedTarget.id === 'search-button') {
              // Focus is moving to the button, ignore onBlur logic
              return;
            }
            setIsStreaming(true);
          }}
          onChange={(e) => {
            if (!isStreaming) {
              setValue(e.target.value);
            }
          }}
          sx={{
            display: 'flex',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            py: 0.5,
            width: '90%',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            color: `${theme.palette.primary.main}`,
            '& .MuiOutlinedInput-root': {
              paddingRight: '0',
              '& fieldset': {
                borderColor: 'transparent'
              },
              '&:hover fieldset': {
                borderColor: 'transparent'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent'
              }
            },
            [theme.breakpoints.down('md')]: {
              py: 0
            }
          }}
          inputProps={{
            style: {
              fontSize: '3vh',
              fontWeight: 700,
              px: '20px',
              color: `#3E63DD`
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span style={{ fontSize: '3vh', fontWeight: 400, color: '#000000' }}>
                  {t('I want a')}
                </span>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  id="search-button"
                  variant="contained"
                  color="primary"
                  onClick={handleButtonClick} // Handle button click here
                  sx={{
                    display: isMobile ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'auto',
                    maxHeight: '100%',
                    width: '100%',
                    py: 3,
                    m: 2,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: '21px',
                    textAlign: 'center', // Center the text

                    [theme.breakpoints.down('lg')]: {
                      lineHeight: 'normal',
                      minWidth: 200,
                      fontSize: '16px',
                      whiteSpace: 'break-spaces' // Allow text to wrap
                    },

                    [theme.breakpoints.down('md')]: {
                      m: 1
                    },

                    [theme.breakpoints.down('sm')]: {
                      py: 1,
                      m: 0
                    }
                  }}>
                  {t('Start Your Search')}
                </Button>
              </InputAdornment>
            )
          }}
        />
        {isMobile && (
          <Button
            id="search-button"
            variant="contained"
            color="primary"
            onClick={handleButtonClick}
            sx={{
              height: 'auto',
              m: 0,
              mt: 2,
              maxWidth: '200px',
              maxHeight: '100%',
              height: '48px',
              width: '100%',
              py: 3,
              borderRadius: 1,
              textTransform: 'none',
              fontSize: '21px',
              textAlign: 'center'
            }}>
            {t('Start Your Search')}
          </Button>
        )}
      </div>

      {/* Snackbar to display when input is empty */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={'Please enter a search value!'}
      />
    </>
  );
};
