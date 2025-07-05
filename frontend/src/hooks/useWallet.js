import { useState, useEffect } from 'react'
import { walletService } from '../services/walletService'

export function useWallet(authClient) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadWallet = async () => {
    if (!authClient) return
    
    try {
      setLoading(true)
      setError(null)
      
      const walletBalance = await walletService.getBalance(authClient)
      setBalance(walletBalance)
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

  useEffect(() => {
    loadWallet()
  }, [authClient])

  return {
    balance,
    loading,
    error,
    deposit,
    withdraw,
    refetch: loadWallet
  }
}