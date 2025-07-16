import { useEffect, useRef } from 'react'

export function useRealtime(callback, interval = 5000) {
  const intervalRef = useRef()
  
  useEffect(() => {
    // Initial call
    callback()
    
    // Set up polling
    intervalRef.current = setInterval(callback, interval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callback, interval])
  
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }
}