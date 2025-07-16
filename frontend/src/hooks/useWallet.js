import { useState, useEffect, useCallback } from 'react'
import { walletService } from '../services/walletService'
import { useRealtime } from './useRealtime'

export function useWallet(authClient) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadWallet = async () => {
    if (!authClient) return
    
    try {
      setError(null)
      
      const walletBalance = await walletService.getBalance(authClient)
      // Only update if balance actually changed
      if (walletBalance !== balance) {
        setBalance(walletBalance)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deposit = async (amount) => {
    try {
      const result = await walletService.deposit(authClient, amount)
      if (result) {
        await loadWallet()
      }
      return result
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const withdraw = async (amount) => {
    try {
      const result = await walletService.withdraw(authClient, amount)
      if (result) {
        await loadWallet()
      }
      return result
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const refreshWallet = useCallback(() => {
    loadWallet()
  }, [authClient])
  
  useRealtime(refreshWallet, 5000)
  
  useEffect(() => {
    refreshWallet()
  }, [refreshWallet])

  return {
    balance,
    loading,
    error,
    deposit,
    withdraw,
    refetch: loadWallet
  }
}