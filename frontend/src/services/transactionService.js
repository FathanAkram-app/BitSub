import { ENV } from '../config/env'
import { apiService } from './api'

const idlFactory = ({ IDL }) => {
  const Interval = IDL.Variant({
    'Daily' : IDL.Null, 'Weekly' : IDL.Null, 'Monthly' : IDL.Null, 'Yearly' : IDL.Null
  });
  const SubscriptionPlan = IDL.Record({
    'planId' : IDL.Text, 'creator' : IDL.Principal, 'title' : IDL.Text,
    'description' : IDL.Text, 'amount' : IDL.Nat, 'interval' : Interval,
    'webhookUrl' : IDL.Text, 'createdAt' : IDL.Int, 'isActive' : IDL.Bool
  });
  const CreatePlanRequest = IDL.Record({
    'title' : IDL.Text, 'description' : IDL.Text, 'amount' : IDL.Nat,
    'interval' : Interval, 'webhookUrl' : IDL.Text
  });
  const TransactionType = IDL.Variant({
    'Payment' : IDL.Null, 'Subscription' : IDL.Null, 'Refund' : IDL.Null
  });
  const TransactionStatus = IDL.Variant({
    'Pending' : IDL.Null, 'Confirmed' : IDL.Null, 'Failed' : IDL.Null
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat, 'txType' : TransactionType, 'subscriptionId' : IDL.Nat,
    'planId' : IDL.Text, 'subscriber' : IDL.Principal, 'amount' : IDL.Nat,
    'status' : TransactionStatus, 'timestamp' : IDL.Int, 'txHash' : IDL.Opt(IDL.Text)
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  return IDL.Service({
    'createPlan' : IDL.Func([CreatePlanRequest], [Result], []),
    'getPlan' : IDL.Func([IDL.Text], [IDL.Opt(SubscriptionPlan)], ['query']),
    'getCreatorPlans' : IDL.Func([IDL.Principal], [IDL.Vec(IDL.Text)], ['query']),
    'getCreatorTransactions' : IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'getCreatorStats' : IDL.Func([IDL.Principal], [IDL.Record({
      'totalRevenue' : IDL.Nat, 'totalSubscriptions' : IDL.Nat, 'monthlyGrowth' : IDL.Float64
    })], ['query']),
    'getChartData' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))], ['query']),
    'deletePlan' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
};

export class TransactionService {
  constructor() {
    this.canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER
  }

  async getActor(authClient) {
    return apiService.getActor(this.canisterId, idlFactory, authClient)
  }

  async getTransactions(authClient) {
    try {
      const actor = await this.getActor(authClient)
      const identity = authClient.getIdentity()
      const principal = identity.getPrincipal()
      console.log('Getting transactions for principal:', principal.toString())
      
      const txs = await actor.getCreatorTransactions(principal)
      console.log('Raw transactions from backend:', txs)
      
      return txs.map(tx => ({
        id: Number(tx.id),
        type: Object.keys(tx.txType)[0],
        amount: Number(tx.amount),
        planTitle: tx.planId,
        subscriber: tx.subscriber.toString().slice(-8),
        status: Object.keys(tx.status)[0],
        timestamp: Number(tx.timestamp) / 1000000,
        txHash: tx.txHash.length > 0 ? tx.txHash[0] : null
      }))
    } catch (error) {
      console.error('getTransactions error:', error)
      throw error
    }
  }

  async getStats(authClient) {
    try {
      const actor = await this.getActor(authClient)
      const identity = authClient.getIdentity()
      const principal = identity.getPrincipal()
      console.log('Getting stats for principal:', principal.toString())
      
      const stats = await actor.getCreatorStats(principal)
      console.log('Raw stats from backend:', stats)
      
      return {
        totalRevenue: Number(stats.totalRevenue),
        totalSubscriptions: Number(stats.totalSubscriptions),
        monthlyGrowth: Number(stats.monthlyGrowth)
      }
    } catch (error) {
      console.error('getStats error:', error)
      throw error
    }
  }

  async getChartData(authClient, period) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    const data = await actor.getChartData(identity.getPrincipal(), period)
    
    return data.map(([label, revenue]) => ({
      label,
      revenue: Number(revenue)
    }))
  }
}

export const transactionService = new TransactionService()