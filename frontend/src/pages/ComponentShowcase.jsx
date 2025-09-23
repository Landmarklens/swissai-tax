import React from 'react';
import { Container, Typography, Box, Divider } from '@mui/material';
import { QuickFormCard } from './Chat/AIChat/QuickFormCard/QuickFormCard';
import { ConversationProgress } from './Chat/AIChat/ConversationProgress/ConversationProgress';
import LoggedInLayout from './LoggedInLayout/LoggedInLayout';

const ComponentShowcase = () => {
  return (
    <LoggedInLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          Enhanced UI Components Showcase
        </Typography>
        <Typography variant="body1" paragraph>
          This page shows the updated components with their new UI designs.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            1. Enhanced Quick Form Card
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Features: Collapsible sections, progress tracking, interactive amenities, gradient header
          </Typography>
          <QuickFormCard
            onSubmit={(data) => console.log('Form submitted:', data)}
            isSubmitting={false}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            2. Enhanced Conversation Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Features: Visual stepper, expandable details, time estimates, color-coded progress
          </Typography>
          <ConversationProgress
            progress={45}
            profileCompleted={false}
            completedSteps={['location']}
            currentStep="budget"
            insights={[
              { step: 'Location Preferences', text: 'I want to live in Zurich' },
              { step: 'Budget', text: 'My budget is 3000 CHF per month' }
            ]}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            3. Conversation Progress - Completed State
          </Typography>
          <ConversationProgress
            progress={100}
            profileCompleted={true}
          />
        </Box>
      </Container>
    </LoggedInLayout>
  );
};

export default ComponentShowcase;