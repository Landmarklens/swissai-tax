import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';

const OptimizedImage = ({
  src = '',
  name,
  width,
  height,
  alt = '',
  style = {},
  onClick = () => {
  const { t } = useTranslation();},
  loading = 'lazy', // 'lazy' | 'eager'
  placeholder={t("filing.blur")},
  sizes,
  srcSet,
  webpSrc, // WebP version of the image
  fallbackSrc, // Fallback for older browsers
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Determine the image source
  const getImageSrc = () => {
    if (src) return src;
    if (name) return `/${name}.svg`;
    return '';
  };

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== 'lazy') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading]);

  // Load image when it comes into view
  useEffect(() => {
    if (isIntersecting && !imgSrc) {
      const source = getImageSrc();
      setImgSrc(source);
    }
  }, [isIntersecting, src, name, imgSrc]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle image error with fallback
  const handleError = () => {
    if (!error && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  // Create picture element for WebP support
  const renderPicture = () => {
    if (webpSrc || srcSet) {
      return (
        <picture>
          {webpSrc && (
            <source
              type="image/webp"
              srcSet={webpSrc}
              sizes={sizes}
            />
          )}
          {srcSet && (
            <source
              srcSet={srcSet}
              sizes={sizes}
            />
          )}
          <img
            ref={imgRef}
            src={imgSrc}
            alt={alt}
            width={width || 'auto'}
            height={height || 'auto'}
            style={{
              objectFit: 'fill',
              display: isLoaded ? 'block' : 'none',
              ...style
            }}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            loading={loading}
            decoding="async"
          />
        </picture>
      );
    }

    return (
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        width={width || 'auto'}
        height={height || 'auto'}
        style={{
          objectFit: 'fill',
          display: isLoaded ? 'block' : 'none',
          ...style
        }}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading={loading}
        decoding="async"
      />
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: width || 'auto',
        height: height || 'auto',
        display: 'inline-block',
      }}
    >
      {/* Show skeleton while loading */}
      {!isLoaded && placeholder === 'blur' && (
        <Skeleton
          variant="rectangular"
          width={width || '100%'}
          height={height || '100%'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      {/* Render image when in viewport */}
      {isIntersecting && renderPicture()}

      {/* Placeholder div for intersection observer */}
      {!isIntersecting && (
        <div
          ref={imgRef}
          style={{
            width: width || 'auto',
            height: height || 'auto',
            backgroundColor: 'transparent',
          }}
        />
      )}
    </Box>
  );
};

export default OptimizedImage;