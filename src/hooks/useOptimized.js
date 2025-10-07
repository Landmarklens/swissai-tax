import { useCallback, useMemo, useRef, useEffect, memo, useState } from 'react';

/**
 * Custom hook for optimized callbacks that maintains reference equality
 * Better than useCallback for expensive callbacks
 */
export function useStableCallback(callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args) => callbackRef.current(...args), []);
}

/**
 * Deep memo comparison for complex props
 * Use when React.memo's shallow comparison isn't enough
 */
export function deepMemo(Component) {
  return memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

/**
 * Custom hook for debounced state updates
 * Prevents excessive re-renders from rapid state changes
 */
export function useDebouncedState(initialValue, delay = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setValue];
}

/**
 * Hook for virtual scrolling - only renders visible items
 * Perfect for long lists like property listings
 */
export function useVirtualScroll(items, containerHeight, itemHeight, buffer = 5) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, scrollTop, containerHeight, itemHeight, buffer]);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll
  };
}

/**
 * Hook for lazy loading components when they're needed
 */
export function useLazyComponent(importFunc, delay = 0) {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      importFunc().then(module => {
        setComponent(() => module.default || module);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [importFunc, delay]);

  return Component;
}

/**
 * Hook to track component render count in development
 */
export function useRenderCount(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
    }
  });

  return renderCount.current;
}

/**
 * Hook for intersection observer - perfect for lazy loading
 */
export function useIntersection(ref, options = {}) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Hook for optimized event handlers
 */
export function useEventListener(eventName, handler, element = window) {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event) => savedHandler.current(event);

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

/**
 * Hook for monitoring performance metrics
 */
export function usePerformanceMonitor(componentName) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render (target: 16ms)`);
    }

    startTime.current = performance.now();
  });
}

