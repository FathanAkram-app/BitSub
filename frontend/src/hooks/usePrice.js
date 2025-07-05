import { useState, useEffect } from 'react'
import { priceService } from '../services/priceService'

export function usePrice(authClient) {
  const [btcPrice, setBtcPrice] = useState(43250.0) // Start with fallback
  const [loading, setLoading] = useState(false) // Don't block UI
  const [error, setError] = useState(null)

  const loadPrice = async () => {
    if (!authClient) return
    
    try {
      setLoading(true)
      setError(null)
      
      const price = await priceService.getBTCPrice(authClient)
      setBtcPrice(price || 43250.0) // Fallback price
    } catch (err) {
      console.warn('OKX price failed, using fallback:', err.message)
      setBtcPrice(43250.0) // Fallback price
      setError(null) // Don't show error to user
    } finally {
      setLoading(false)
    }
  }

  const convertSatsToUSD = (sats) => {
    if (!sats || sats === 0) return '0.00'
    const price = btcPrice || 43250.0 // Always have fallback
    return priceService.convertSatsToUSD(sats, price)
  }

  useEffect(() => {
    if (!authClient) return
    
    // Delay initial load to not block UI
    const timeout = setTimeout(() => {
      loadPrice()
      const interval = setInterval(loadPrice, 30000) // Update every 30s
      return () => clearInterval(interval)
    }, 2000) // Wait 2 seconds before first load
    
    return () => clearTimeout(timeout)
  }, [authClient])

  return {
    btcPrice,
    loading,
    error,
    convertSatsToUSD,
    refetch: loadPrice
  }
}