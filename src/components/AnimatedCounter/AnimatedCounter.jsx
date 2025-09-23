import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';

const CounterWrapper = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  minWidth: '120px',
  [theme.breakpoints.down('sm')]: {
    minWidth: '80px',
    padding: theme.spacing(1),
  }
}));

const CounterValue = styled(Typography)(({ theme }) => ({
  fontSize: 'inherit',
  fontWeight: 'inherit',
  color: 'inherit',
  lineHeight: 'inherit',
  marginBottom: 0
}));

const CounterLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  fontWeight: 500,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
  }
}));

// Custom hook for intersection observer
const useInView = (options = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.triggerOnce && ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, {
      threshold: options.threshold || 0.1
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options.threshold, options.triggerOnce]);

  return { ref, inView };
};

const AnimatedCounter = ({
  value,
  label,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      console.log('[DEBUG] AnimatedCounter starting animation for value:', value, 'label:', label);
      setHasAnimated(true);
      const startTime = Date.now();
      const endValue = parseFloat(value);

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime - delay) / duration, 1);

        if (progress <= 0) {
          requestAnimationFrame(animate);
          return;
        }

        if (progress < 1) {
          // Easing function for smooth animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentValue = endValue * easeOutQuart;
          setDisplayValue(currentValue);
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [inView, value, duration, delay, hasAnimated]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toLocaleString();
  };

  // If no label provided, just return the counter value inline
  if (!label) {
    return (
      <span ref={ref}>
        {prefix}{formatNumber(displayValue)}{suffix}
      </span>
    );
  }

  return (
    <CounterWrapper ref={ref}>
      <CounterValue>
        {prefix}{formatNumber(displayValue)}{suffix}
      </CounterValue>
      <CounterLabel>
        {label}
      </CounterLabel>
    </CounterWrapper>
  );
};

export default AnimatedCounter;