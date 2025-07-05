import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'

export function useSubscriptions(authClient) {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSubscriptions = async () => {
    if (!authClient) return
    
    try {
      setLoading(true)
      setError(null)
      
      const userSubs = await subscriptionService.getUserSubscriptions(authClient)
      
      const subsWithPlans = await Promise.all(
        userSubs.map(async (sub) => {
          const planResult = await subscriptionService.getPlan(authClient, sub.planId)
          const plan = planResult.length > 0 ? planResult[0] : null
          return {
            ...sub,
            subscriptionId: Number(sub.subscriptionId),
            planTitle: plan ? plan.title : 'Unknown Plan',
            planAmount: plan ? Number(plan.amount) : 0,
            planInterval: plan ? plan.interval : { Monthly: null },
            nextPayment: Number(sub.nextPayment)
          }
        })
      )
      
      setSubscriptions(subsWithPlans)
    } catch (err) {
      setError(err.message)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [authClient])

  return {
    subscriptions,
    loading,
    error,
    refetch: loadSubscriptions
  }
}

export function usePlans(authClient) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPlans = async () => {
    if (!authClient) return
    
    try {
      setLoading(true)
      setError(null)
      
      const planIds = await subscriptionService.getCreatorPlans(authClient)
      
      const plansData = await Promise.all(
        planIds.map(async (planId) => {
          const planResult = await subscriptionService.getPlan(authClient, planId)
          return planResult.length > 0 ? planResult[0] : null
        })
      )
      
      setPlans(plansData.filter(Boolean))
    } catch (err) {
      setError(err.message)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [authClient])

  return {
    plans,
    loading,
    error,
    refetch: loadPlans
  }
}