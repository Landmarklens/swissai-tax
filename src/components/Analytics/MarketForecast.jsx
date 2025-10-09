import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const MarketForecast = ({ forecastData }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const getSentimentColor = (sentiment) => {
    const colors = {
      very_positive: theme.palette.success.dark,
      positive: theme.palette.success.main,
      neutral: theme.palette.info.main,
      negative: theme.palette.warning.main,
      very_negative: theme.palette.error.main,
    };
    return colors[sentiment] || theme.palette.grey[500];
  };

  return (
    <Grid container spacing={3}>
      {/* Forecast Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  90-Day Market Forecast
                </Typography>
                <Chip
                  icon={<TimelineIcon />}
                  label={forecastData?.summary?.trend || 'Analyzing'}
                  color={forecastData?.summary?.trend === 'up' ? 'success' : 
                         forecastData?.summary?.trend === 'down' ? 'error' : 'default'}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Stack>
                    <Typography variant="h4" fontWeight="bold">
                      {forecastData?.summary?.expected_change > 0 ? '+' : ''}
                      {forecastData?.summary?.expected_change?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expected Price Change
                    </Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Stack>
                    <Typography variant="h4" fontWeight="bold">
                      {(forecastData?.summary?.confidence * 100)?.toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confidence Level
                    </Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack>
                    <Chip
                      label={forecastData?.summary?.market_sentiment?.replace('_', ' ').toUpperCase()}
                      sx={{
                        bgcolor: alpha(getSentimentColor(forecastData?.summary?.market_sentiment), 0.1),
                        color: getSentimentColor(forecastData?.summary?.market_sentiment),
                        fontWeight: 'bold',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Market Sentiment
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Price Forecast Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Price Trend Forecast
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData?.forecast_data}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tickFormatter={(value) => `${(value/1000).toFixed(0)}K`} />
                <RechartsTooltip 
                  formatter={(value) => `CHF ${value?.toLocaleString()}`}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <ReferenceLine 
                  y={forecastData?.forecast_data?.[0]?.predicted_price} 
                  stroke={theme.palette.divider}
                  strokeDasharray="3 3"
                  label={t("filing.current")}
                />
                <Area
                  type="monotone"
                  dataKey="confidence_interval.upper"
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#colorConfidence)"
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="confidence_interval.lower"
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#colorConfidence)"
                  name="Lower Bound"
                />
                <Line
                  type="monotone"
                  dataKey="predicted_price"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={false}
                  name="Predicted Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* AI Insights */}
      {forecastData?.ai_forecast && (
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {forecastData.ai_forecast.risks && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Risk Factors
                    </Typography>
                    <Stack spacing={1}>
                      {forecastData.ai_forecast.risks.map((risk, index) => (
                        <Alert key={index} severity="warning">
                          {risk}
                        </Alert>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {forecastData.ai_forecast.opportunities && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Opportunities
                    </Typography>
                    <Stack spacing={1}>
                      {forecastData.ai_forecast.opportunities.map((opp, index) => (
                        <Alert key={index} severity="success">
                          {opp}
                        </Alert>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default MarketForecast;