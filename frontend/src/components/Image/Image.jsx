import React from 'react';

const ImageComponent = ({
  src = '',
  name,
  width,
  height,
  alt = '',
  style = {},
  onClick = () => {},
  loading = 'lazy' // Added lazy loading by default
}) => {
  const imageSrc = src || `/${name}.svg`;

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width || 'auto'}
      height={height}
      style={{ objectFit: 'fill', ...style }}
      onClick={onClick}
      loading={loading} // Native lazy loading
      decoding="async" // Async decoding for better performance
    />
  );
};

export default ImageComponent;
