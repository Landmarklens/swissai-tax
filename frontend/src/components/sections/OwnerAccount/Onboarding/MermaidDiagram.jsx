import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

const MermaidDiagram = ({ chart }) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Try to load mermaid if it's installed
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          themeVariables: {
            primaryColor: '#C1D0FF',
            primaryTextColor: '#1F2D5C',
            primaryBorderColor: '#1F2D5C',
            lineColor: '#5A6C8C',
            secondaryColor: '#E8EEFF',
            tertiaryColor: '#F5F7FF',
          },
          flowchart: {
            curve: 'basis',
            padding: 20,
          },
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setIsLoaded(true);
      } catch (err) {
        console.log('Mermaid not available, showing text representation');
        setError(true);
      }
    };

    if (chart) {
      loadMermaid();
    }
  }, [chart]);

  // Parse the mermaid syntax for a simple text representation
  const renderTextDiagram = () => {
    const lines = chart.split('\n').filter(line => line.trim());
    const nodes = [];
    const connections = [];

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('graph') || line === '' || line === 'end') return;

      // Extract nodes and connections
      if (line.includes('-->') || line.includes('->')) {
        connections.push(line);
      } else if (line.includes('[') && line.includes(']')) {
        const match = line.match(/(\w+)\[([^\]]+)\]/);
        if (match) {
          nodes.push({ id: match[1], label: match[2] });
        }
      }
    });

    return (
      <Box sx={{ fontFamily: 'monospace', fontSize: '14px' }}>
        {connections.length > 0 ? (
          connections.map((conn, idx) => (
            <Box key={idx} sx={{ my: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" component="span">
                {conn.replace(/\[([^\]]+)\]/g, '[$1]')}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            {chart}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        my: 3,
        p: 3,
        bgcolor: '#FAFBFF',
        border: '1px solid #E0E7FF',
        borderRadius: 2,
        overflowX: 'auto',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#5A6C8C', fontWeight: 500 }}>
          📊 Process Flow Diagram
        </Typography>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          '& svg': {
            display: 'block',
            margin: 'auto',
            maxWidth: '100%',
            height: 'auto',
          },
        }}
      >
        {!isLoaded && !error && (
          <Typography variant="body2" color="textSecondary">
            Loading diagram...
          </Typography>
        )}
        {error && renderTextDiagram()}
      </Box>
    </Paper>
  );
};

export default MermaidDiagram;