import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useWindowSize = () => {
  const { t } = useTranslation();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const handleSize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  useLayoutEffect(() => {
    handleSize();

    window.addEventListener('resize', handleSize);

    return () => window.removeEventListener('resize', handleSize);
  }, []);

  return windowSize;
};
