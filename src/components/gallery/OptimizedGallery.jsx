import React, { memo, useCallback, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, useMediaQuery } from '@mui/material';
import { useVirtualScroll } from '../../hooks/useOptimized';
import GalleryCard from '../galleryCard/GalleryCard';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';

// Memoized GalleryCard to prevent unnecessary re-renders
const MemoizedGalleryCard = memo(GalleryCard, (prevProps, nextProps) => {
  return prevProps.data?.id === nextProps.data?.id &&
         prevProps.data?.matchScore === nextProps.data?.matchScore;
});

const OptimizedGallery = ({ recommendations = [], onCardClick }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Virtualization setup
  const containerHeight = window.innerHeight - 200; // Adjust based on your layout
  const itemHeight = isMobile ? 380 : 320; // Height of each card including margin
  const itemsPerRow = isMobile ? 1 : 3;

  // Prepare items for virtualization
  const preparedItems = useMemo(() => {
    const rows = [];
    for (let i = 0; i < recommendations.length; i += itemsPerRow) {
      rows.push({
        id: `row-${i}`,
        items: recommendations.slice(i, i + itemsPerRow)
      });
    }
    return rows;
  }, [recommendations, itemsPerRow]);

  // Use virtual scrolling
  const {
    visibleItems,
    totalHeight,
    onScroll
  } = useVirtualScroll(preparedItems, containerHeight, itemHeight);

  // Memoized card click handler
  const handleCardClick = useCallback((item) => {
    if (onCardClick) {
      onCardClick(item);
    }
  }, [onCardClick]);

  return (
    <Box
      sx={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={onScroll}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map((row) => (
          <Box
            key={row.id}
            style={row.style}
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 2,
              px: 2
            }}
          >
            {row.items.map((item) => (
              <MemoizedGalleryCard
                key={item.id || item.external_id}
                data={item}
                onCardClick={handleCardClick}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default memo(OptimizedGallery);