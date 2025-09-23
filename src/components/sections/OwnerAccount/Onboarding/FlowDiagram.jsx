import React from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FlowDiagram = ({ chart }) => {
  // Parse mermaid syntax to extract steps and connections
  const parseChart = (mermaidCode) => {
    const lines = mermaidCode.split('\n').filter(line => line.trim());
    const steps = [];
    const connections = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Skip graph declaration and end
      if (trimmedLine.startsWith('graph') || trimmedLine === 'end' || !trimmedLine) {
        return;
      }

      // Parse connections (A --> B)
      if (trimmedLine.includes('-->')) {
        const parts = trimmedLine.split('-->');
        if (parts.length === 2) {
          const from = extractNodeInfo(parts[0].trim());
          const to = extractNodeInfo(parts[1].trim());
          connections.push({ from, to });

          // Add unique steps
          [from, to].forEach(node => {
            if (!steps.find(s => s.id === node.id)) {
              steps.push(node);
            }
          });
        }
      }
    });

    return { steps, connections };
  };

  const extractNodeInfo = (nodeStr) => {
    // Extract ID and label from patterns like A[Start] or B[Access Dashboard]
    const match = nodeStr.match(/(\w+)(?:\[([^\]]+)\])?/);
    if (match) {
      return {
        id: match[1],
        label: match[2] || match[1]
      };
    }
    return { id: nodeStr, label: nodeStr };
  };

  const { steps, connections } = parseChart(chart);

  // Create a linear flow visualization
  const createLinearFlow = () => {
    if (steps.length === 0) return null;

    // Order steps based on connections
    const orderedSteps = [];
    const processed = new Set();

    // Find the start node (node with no incoming connections)
    const startNode = steps.find(step =>
      !connections.some(conn => conn.to.id === step.id)
    ) || steps[0];

    const processNode = (node) => {
      if (!node || processed.has(node.id)) return;

      processed.add(node.id);
      orderedSteps.push(node);

      // Find next node(s)
      const nextConnections = connections.filter(conn => conn.from.id === node.id);
      nextConnections.forEach(conn => {
        const nextNode = steps.find(s => s.id === conn.to.id);
        if (nextNode) {
          processNode(nextNode);
        }
      });
    };

    processNode(startNode);

    // Add any remaining unprocessed steps
    steps.forEach(step => {
      if (!processed.has(step.id)) {
        orderedSteps.push(step);
      }
    });

    return orderedSteps;
  };

  const orderedSteps = createLinearFlow();

  if (!orderedSteps || orderedSteps.length === 0) {
    // Fallback to showing the raw diagram text
    return (
      <Paper
        elevation={1}
        sx={{
          my: 3,
          p: 3,
          bgcolor: '#FAFBFF',
          border: '1px solid #E0E7FF',
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: '#5A6C8C', fontWeight: 500, display: 'block', mb: 2 }}>
          📊 Process Flow
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '12px',
            bgcolor: 'white',
            p: 2,
            borderRadius: 1,
            overflowX: 'auto',
          }}
        >
          {chart}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        my: 3,
        p: 3,
        bgcolor: '#FAFBFF',
        border: '1px solid #E0E7FF',
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" sx={{ color: '#5A6C8C', fontWeight: 500, display: 'block', mb: 3 }}>
        📊 Process Flow Diagram
      </Typography>

      <Stepper orientation="vertical" activeStep={-1}>
        {orderedSteps.map((step, index) => (
          <Step key={step.id} expanded>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#C1D0FF',
                    color: '#1F2D5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {index + 1}
                </Box>
              )}
            >
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1F2D5C' }}>
                {step.label}
              </Typography>
            </StepLabel>
            {index < orderedSteps.length - 1 && (
              <StepContent>
                <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ArrowDownwardIcon sx={{ color: '#5A6C8C', fontSize: 20 }} />
                </Box>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default FlowDiagram;