import { ENV } from '../config/env'
import { apiService } from './api'

const idlFactory = ({ IDL }) => {
  const PlanInterval = IDL.Variant({ 
    'Daily' : IDL.Null, 'Weekly' : IDL.Null, 'Monthly' : IDL.Null, 'Yearly' : IDL.Null
  });
  const Plan = IDL.Record({
    'title' : IDL.Text, 'creator' : IDL.Principal, 'description' : IDL.Text,
    'amount' : IDL.Nat, 'planId' : IDL.Text, 'interval' : PlanInterval, 'webhookUrl' : IDL.Text,
  });
  const SubscriptionStatus = IDL.Variant({
    'Active' : IDL.Null, 'Paused' : IDL.Null, 'Canceled' : IDL.Null
  });
  const ActiveSubscription = IDL.Record({
    'subscriptionId' : IDL.Nat, 'planId' : IDL.Text, 'subscriber' : IDL.Principal,
    'btcAddress' : IDL.Text, 'status' : SubscriptionStatus, 'createdAt' : IDL.Int,
    'lastPayment' : IDL.Opt(IDL.Int), 'nextPayment' : IDL.Int,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat, 'txType' : IDL.Variant({ 'Payment' : IDL.Null, 'Subscription' : IDL.Null, 'Refund' : IDL.Null }),
    'subscriptionId' : IDL.Nat, 'planId' : IDL.Text, 'subscriber' : IDL.Principal,
    'amount' : IDL.Nat, 'status' : IDL.Variant({ 'Pending' : IDL.Null, 'Confirmed' : IDL.Null, 'Failed' : IDL.Null }),
    'timestamp' : IDL.Int, 'txHash' : IDL.Opt(IDL.Text)
  });
  const Stats = IDL.Record({
    'totalRevenue' : IDL.Nat, 'totalSubscriptions' : IDL.Nat, 'monthlyGrowth' : IDL.Float64
  });
  return IDL.Service({
    'createPlan' : IDL.Func([IDL.Record({
      'title' : IDL.Text, 'description' : IDL.Text, 'amount' : IDL.Nat,
      'interval' : PlanInterval, 'webhookUrl' : IDL.Text,
    })], [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })], []),
    'getPlan' : IDL.Func([IDL.Text], [IDL.Opt(Plan)], ['query']),
    'getCreatorPlans' : IDL.Func([IDL.Principal], [IDL.Vec(IDL.Text)], ['query']),
    'subscribe' : IDL.Func([IDL.Text], [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })], []),
    'getUserSubscriptions' : IDL.Func([IDL.Principal], [IDL.Vec(ActiveSubscription)], ['query']),
    'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'cancelSubscription' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deletePlan' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getCreatorStats' : IDL.Func([IDL.Principal], [Stats], ['query']),
    'getCreatorTransactions' : IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'getChartData' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))], ['query']),
  });
};

export class SubscriptionService {
  constructor() {
    this.canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER
  }

  async getActor(authClient) {
    return apiService.getActor(this.canisterId, idlFactory, authClient)
  }

  async createPlan(authClient, planData) {
    const actor = await this.getActor(authClient)
    return actor.createPlan(planData)
  }

  async getPlan(authClient, planId) {
    const actor = await this.getActor(authClient)
    return actor.getPlan(planId)
  }

  async getCreatorPlans(authClient) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    return actor.getCreatorPlans(identity.getPrincipal())
  }

  async subscribe(authClient, planId) {
    const actor = await this.getActor(authClient)
    return actor.subscribe(planId)
  }

  async getUserSubscriptions(authClient) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    return actor.getUserSubscriptions(identity.getPrincipal())
  }

  async confirmPayment(authClient, subscriptionId) {
    const actor = await this.getActor(authClient)
    return actor.confirmPayment(subscriptionId)
  }

  async cancelSubscription(authClient, subscriptionId) {
    const actor = await this.getActor(authClient)
    return actor.cancelSubscription(subscriptionId)
  }

  async deletePlan(authClient, planId) {
    const actor = await this.getActor(authClient)
    return actor.deletePlan(planId)
  }

  async getCreatorStats(authClient) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    const stats = await actor.getCreatorStats(identity.getPrincipal())
    
    return {
      totalRevenue: Number(stats.totalRevenue),
      totalSubscriptions: Number(stats.totalSubscriptions),
      monthlyGrowth: Number(stats.monthlyGrowth)
    }
  }

  async getCreatorTransactions(authClient) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    const txs = await actor.getCreatorTransactions(identity.getPrincipal())

    console.log(txs)
    
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

export const subscriptionService = new SubscriptionService()
