import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { subscriptionService } from '../services/subscriptionService';

interface Subscription {
  subscriptionId: number;
  planId: string;
  planTitle: string;
  planAmount: number;
  planInterval: { [key: string]: null };
  nextPayment: number;
}

interface Plan {
  planId: string;
  title: string;
  amount: number;
  interval: { [key: string]: null };
  creator: any;
  description: string;
  webhookUrl: string;
}

interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsePlansReturn {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscriptions(authClient: AuthClient | undefined): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async (): Promise<void> => {
    if (!authClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userSubs = await subscriptionService.getUserSubscriptions(authClient);
      
      const subsWithPlans = await Promise.all(
        userSubs.map(async (sub: any) => {
          const planResult = await subscriptionService.getPlan(authClient, sub.planId);
          const plan = planResult.length > 0 ? planResult[0] : null;
          return {
            ...sub,
            subscriptionId: Number(sub.subscriptionId),
            planTitle: plan ? plan.title : 'Unknown Plan',
            planAmount: plan ? Number(plan.amount) : 0,
            planInterval: plan ? plan.interval : { Monthly: null },
            nextPayment: Number(sub.nextPayment)
          };
        })
      );
      
      setSubscriptions(subsWithPlans);
    } catch (err: any) {
      setError(err.message);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [authClient]);

  return {
    subscriptions,
    loading,
    error,
    refetch: loadSubscriptions
  };
}

export function usePlans(authClient: AuthClient | undefined): UsePlansReturn {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async (): Promise<void> => {
    if (!authClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const planIds = await subscriptionService.getCreatorPlans(authClient);
      
      const plansData = await Promise.all(
        planIds.map(async (planId: string) => {
          const planResult = await subscriptionService.getPlan(authClient, planId);
          return planResult.length > 0 ? planResult[0] : null;
        })
      );
      
      setPlans(plansData.filter(Boolean));
    } catch (err: any) {
      setError(err.message);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [authClient]);

  return {
    plans,
    loading,
    error,
    refetch: loadPlans
  };
}