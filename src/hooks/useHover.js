import { useRef, useState, useEffect } from 'react';

/**
 * useHover hook
 * Tracks if the mouse is hovering over the referenced element.
 *
 * @returns [ref, isHovered]
 */
export function useHover() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const node = ref.current;
    if (node) {
      // Add event listeners
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);

      // Cleanup event listeners on unmount or if ref changes
      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [ref]);

  return [ref, isHovered];
}
