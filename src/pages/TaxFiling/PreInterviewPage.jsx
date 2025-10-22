/**
 * PreInterviewPage
 *
 * Page shown before starting the tax interview questionnaire.
 * Asks users if they have eCH-0196 or Swissdec documents to upload.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress } from '@mui/material';
import PreInterviewDocumentScreen from '../../components/TaxFiling/PreInterviewDocumentScreen';
import axios from 'axios';

const PreInterviewPage = () => {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verify filing exists and get/create interview session
    const initializeSession = async () => {
      if (!filingId) {
        setError('No filing ID provided');
        setLoading(false);
        return;
      }

      try {
        // Start interview session (or get existing one)
        const response = await axios.post('/api/interview/start', {
          filing_session_id: filingId,
          tax_year: new Date().getFullYear(),
          language: i18n.language,
        });

        const session_id = response.data.sessionId || response.data.session_id;
        setSessionId(session_id);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing session:', err);
        if (err.response?.status === 404) {
          // Filing not found - redirect to filings list
          navigate(`/${i18n.language}/tax-filing/filings`);
        } else {
          setError(err.response?.data?.detail || 'Failed to initialize session');
          setLoading(false);
        }
      }
    };

    initializeSession();
  }, [filingId, i18n.language, navigate]);

  const handleContinueToInterview = () => {
    // Navigate to the interview page
    navigate(`/${i18n.language}/tax-filing/interview/${filingId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <div style={{ textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </Box>
    );
  }

  return (
    <PreInterviewDocumentScreen
      filingId={filingId}
      sessionId={sessionId}
      onContinueToInterview={handleContinueToInterview}
    />
  );
};

export default PreInterviewPage;
