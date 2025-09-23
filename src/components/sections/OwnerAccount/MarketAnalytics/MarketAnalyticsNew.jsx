import React from 'react';
import UnifiedAnalyticsV3 from './UnifiedAnalyticsV3';

/**
 * MarketAnalytics Component
 * 
 * This is the main analytics component that renders the unified
 * AI-powered analytics dashboard for property owners.
 * 
 * Features:
 * - Property selector (always visible at top)
 * - Market Overview (always visible below selector)
 * - Tabbed AI Analysis sections:
 *   - What-If Renovation Analysis (detailed visual UI)
 *   - Competitive Market Analysis
 *   - AI Property Valuation
 *   - 30-Day Market Forecast
 *   - Market Overview Charts
 * - On-demand AI computations (not automatic)
 */
const MarketAnalytics = () => {
  return <UnifiedAnalyticsV3 />;
};

export default MarketAnalytics;