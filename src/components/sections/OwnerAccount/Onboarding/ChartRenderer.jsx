import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import FlowDiagram from './FlowDiagram';

const COLORS = ['#C1D0FF', '#8FA4E8', '#5A7FDB', '#3B5FC7', '#1F2D5C'];

const ChartRenderer = ({ chart }) => {
  // Detect chart type
  const lines = chart.split('\n').map(line => line.trim()).filter(Boolean);
  const firstLine = lines[0].toLowerCase();

  // Handle pie charts
  if (firstLine.includes('pie')) {
    const data = [];
    const title = lines[0].includes('title')
      ? lines[0].replace(/pie\s+title\s+/i, '').trim()
      : 'Chart';

    lines.slice(1).forEach(line => {
      // Parse lines like: "Financial Stability" : 40
      const match = line.match(/"([^"]+)"\s*:\s*(\d+)/);
      if (match) {
        data.push({
          name: match[1],
          value: parseInt(match[2])
        });
      }
    });

    if (data.length > 0) {
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
          <Typography variant="h6" sx={{ mb: 2, color: '#1F2D5C', fontWeight: 500 }}>
            📊 {title}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      );
    }
  }

  // Handle bar charts
  if (firstLine.includes('bar') || lines.some(l => l.includes('|'))) {
    const data = [];
    const hasTable = lines.some(line => line.includes('|'));

    if (hasTable) {
      // Parse table-style data
      const tableLines = lines.filter(line => line.includes('|'));
      const headers = tableLines[0]?.split('|').map(h => h.trim()).filter(Boolean);

      if (headers && headers.length >= 2) {
        tableLines.slice(2).forEach(line => {
          const values = line.split('|').map(v => v.trim()).filter(Boolean);
          if (values.length >= 2) {
            data.push({
              name: values[0],
              value: parseFloat(values[1]) || 0
            });
          }
        });
      }
    }

    if (data.length > 0) {
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
          <Typography variant="h6" sx={{ mb: 2, color: '#1F2D5C', fontWeight: 500 }}>
            📊 Data Visualization
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#C1D0FF" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      );
    }
  }

  // Handle flowcharts (graph TD, graph LR, etc.)
  if (firstLine.includes('graph')) {
    return <FlowDiagram chart={chart} />;
  }

  // Fallback to text representation
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
        📊 Chart Data
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
};

export default ChartRenderer;