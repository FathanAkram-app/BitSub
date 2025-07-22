import { useEffect, useRef } from 'react';

export function useRealtime(callback: () => void, interval: number = 5000): () => void {
  const intervalRef = useRef<NodeJS.Timeout | undefined>();
  
  useEffect(() => {
    // Initial call
    callback();
    
    // Set up polling
    intervalRef.current = setInterval(callback, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callback, interval]);
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}