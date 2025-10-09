import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const FullscreenImage = ({ src, alt, style }) => {
  const { t } = useTranslation();
  const imageRef = useRef(null);

  const openFullscreen = () => {
    if (imageRef.current.requestFullscreen) {
      imageRef.current.requestFullscreen();
    } else if (imageRef.current.webkitRequestFullscreen) {
      /* Safari */
      imageRef.current.webkitRequestFullscreen();
    } else if (imageRef.current.msRequestFullscreen) {
      /* IE11 */
      imageRef.current.msRequestFullscreen();
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      ref={imageRef}
      onClick={openFullscreen}
      style={{ cursor: 'pointer', ...style }}
    />
  );
};
