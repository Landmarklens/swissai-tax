import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

const MermaidRenderer = ({ chart }) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderId] = useState(`mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const loadAndRenderMermaid = async () => {
      try {
        // Check if mermaid is already loaded
        if (window.mermaid) {
          renderDiagram();
          return;
        }

        // Load mermaid from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';
        script.async = true;

        script.onload = () => {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
              primaryColor: '#C1D0FF',
              primaryTextColor: '#1F2D5C',
              primaryBorderColor: '#1F2D5C',
              lineColor: '#5A6C8C',
              secondaryColor: '#E8EEFF',
              tertiaryColor: '#F5F7FF',
              background: '#FFFFFF',
              mainBkg: '#C1D0FF',
              secondBkg: '#E8EEFF',
              tertiaryBkg: '#F5F7FF',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
            },
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis',
              padding: 20,
              nodeSpacing: 50,
              rankSpacing: 50,
            },
            pie: {
              textPosition: 0.75,
              useMaxWidth: true,
            },
          });
          renderDiagram();
        };

        script.onerror = () => {
          console.error('Failed to load Mermaid from CDN');
          setIsLoaded(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Mermaid:', error);
        setIsLoaded(false);
      }
    };

    const renderDiagram = async () => {
      if (!window.mermaid || !containerRef.current) return;

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create a div for the diagram
        const div = document.createElement('div');
        div.id = renderId;
        containerRef.current.appendChild(div);

        // Render the diagram
        const { svg } = await window.mermaid.render(renderId, chart);
        containerRef.current.innerHTML = svg;
        setIsLoaded(true);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        // Show the original chart text as fallback
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre style="padding: 16px; background: #f5f5f5; border-radius: 4px; overflow-x: auto;">${chart}</pre>`;
        }
        setIsLoaded(true);
      }
    };

    if (chart) {
      loadAndRenderMermaid();
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [chart, renderId]);

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
      {!isLoaded && (
        <Typography variant="caption" sx={{ color: '#5A6C8C', fontWeight: 500, display: 'block', mb: 2 }}>
          📊 Loading diagram...
        </Typography>
      )}

      <Box
        ref={containerRef}
        sx={{
          '& svg': {
            display: 'block',
            margin: 'auto',
            maxWidth: '100%',
            height: 'auto',
          },
          '& .node rect, & .node circle, & .node ellipse, & .node polygon': {
            fill: '#C1D0FF !important',
            stroke: '#1F2D5C !important',
            strokeWidth: '2px',
          },
          '& .node .label': {
            color: '#1F2D5C !important',
          },
          '& .edgeLabel': {
            background: 'white',
            color: '#1F2D5C',
          },
          '& .flowchart-link': {
            stroke: '#5A6C8C !important',
            strokeWidth: '2px',
          },
          '& .marker': {
            fill: '#5A6C8C !important',
            stroke: '#5A6C8C !important',
          },
          '& text': {
            fill: '#1F2D5C !important',
            fontFamily: 'Arial, sans-serif',
          },
          '& .pieCircle': {
            stroke: '#1F2D5C !important',
            strokeWidth: '2px',
          },
          '& .pieTitleText': {
            fontSize: '16px !important',
            fontWeight: '600 !important',
          },
        }}
      />
    </Paper>
  );
};

export default MermaidRenderer;