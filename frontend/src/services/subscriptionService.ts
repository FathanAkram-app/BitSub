import { AuthClient } from '@dfinity/auth-client';
import { ActorSubclass } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { ENV } from '../config/env';
import { apiService } from './api';
import { 
  SubscriptionPlan, 
  CreatePlanRequest, 
  ActiveSubscription, 
  Transaction, 
  CreatorStats,
  ChartDataPoint,
  ApiResult 
} from '../types';

// Candid interface definition
const idlFactory = ({ IDL }: any) => {
  const PlanInterval = IDL.Variant({ 
    'Daily' : IDL.Null, 'Weekly' : IDL.Null, 'Monthly' : IDL.Null, 'Yearly' : IDL.Null
  });
  const Plan = IDL.Record({
    'title' : IDL.Text, 'creator' : IDL.Principal, 'description' : IDL.Text,
    'amount' : IDL.Nat, 'planId' : IDL.Text, 'interval' : PlanInterval, 'webhookUrl' : IDL.Text,
    'createdAt' : IDL.Int, 'isActive' : IDL.Bool
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
    'retryPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    // New marketplace functions
    'getAllPublicPlans' : IDL.Func([], [IDL.Vec(Plan)], ['query']),
    'searchPlans' : IDL.Func([IDL.Text], [IDL.Vec(Plan)], ['query']),
    'getPlansByCategory' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(Plan)], ['query']),
    'getFeaturedPlans' : IDL.Func([], [IDL.Vec(Plan)], ['query']),
  });
};

// Actor interface
interface SubscriptionManagerActor {
  createPlan: (planData: CreatePlanRequest) => Promise<ApiResult<string>>;
  getPlan: (planId: string) => Promise<SubscriptionPlan[]>;
  getCreatorPlans: (creator: Principal) => Promise<string[]>;
  subscribe: (planId: string) => Promise<ApiResult<number>>;
  getUserSubscriptions: (user: Principal) => Promise<ActiveSubscription[]>;
  confirmPayment: (subscriptionId: number) => Promise<boolean>;
  cancelSubscription: (subscriptionId: number) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<boolean>;
  getCreatorStats: (creator: Principal) => Promise<any>;
  getCreatorTransactions: (creator: Principal) => Promise<any[]>;
  getChartData: (creator: Principal, period: string) => Promise<[string, bigint][]>;
  retryPayment: (subscriptionId: number) => Promise<boolean>;
  // New marketplace functions
  getAllPublicPlans: () => Promise<SubscriptionPlan[]>;
  searchPlans: (query: string) => Promise<SubscriptionPlan[]>;
  getPlansByCategory: (minAmount: number, maxAmount: number) => Promise<SubscriptionPlan[]>;
  getFeaturedPlans: () => Promise<SubscriptionPlan[]>;
}

export class SubscriptionService {
  private canisterId: string;

  constructor() {
    this.canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER;
  }

  private async getActor(authClient: AuthClient): Promise<ActorSubclass<SubscriptionManagerActor>> {
    return apiService.getActor(this.canisterId, idlFactory, authClient) as ActorSubclass<SubscriptionManagerActor>;
  }

  async createPlan(authClient: AuthClient, planData: CreatePlanRequest): Promise<ApiResult<string>> {
    const actor = await this.getActor(authClient);
    return actor.createPlan(planData);
  }

  async getPlan(authClient: AuthClient, planId: string): Promise<SubscriptionPlan[]> {
    const actor = await this.getActor(authClient);
    return actor.getPlan(planId);
  }

  async getCreatorPlans(authClient: AuthClient): Promise<string[]> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    return actor.getCreatorPlans(identity.getPrincipal());
  }

  async subscribe(authClient: AuthClient, planId: string): Promise<ApiResult<number>> {
    const actor = await this.getActor(authClient);
    return actor.subscribe(planId);
  }

  async getUserSubscriptions(authClient: AuthClient): Promise<ActiveSubscription[]> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    return actor.getUserSubscriptions(identity.getPrincipal());
  }

  async confirmPayment(authClient: AuthClient, subscriptionId: number): Promise<boolean> {
    const actor = await this.getActor(authClient);
    return actor.confirmPayment(subscriptionId);
  }

  async cancelSubscription(authClient: AuthClient, subscriptionId: number): Promise<boolean> {
    const actor = await this.getActor(authClient);
    return actor.cancelSubscription(subscriptionId);
  }

  async deletePlan(authClient: AuthClient, planId: string): Promise<boolean> {
    const actor = await this.getActor(authClient);
    return actor.deletePlan(planId);
  }

  async getCreatorStats(authClient: AuthClient): Promise<CreatorStats> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const stats = await actor.getCreatorStats(identity.getPrincipal());
    
    return {
      totalRevenue: Number(stats.totalRevenue),
      totalSubscriptions: Number(stats.totalSubscriptions),
      monthlyGrowth: Number(stats.monthlyGrowth)
    };
  }

  async getCreatorTransactions(authClient: AuthClient): Promise<Transaction[]> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const txs = await actor.getCreatorTransactions(identity.getPrincipal());

    return txs.map((tx: any) => ({
      id: Number(tx.id),
      txType: { [Object.keys(tx.txType)[0]]: null },
      subscriptionId: Number(tx.subscriptionId),
      planId: tx.planId,
      subscriber: tx.subscriber,
      amount: Number(tx.amount),
      status: { [Object.keys(tx.status)[0]]: null },
      timestamp: Number(tx.timestamp),
      txHash: tx.txHash.length > 0 ? tx.txHash[0] : undefined
    }));
  }

  async getChartData(authClient: AuthClient, period: string): Promise<ChartDataPoint[]> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const data = await actor.getChartData(identity.getPrincipal(), period);
    
    return data.map(([label, revenue]) => ({
      label,
      value: Number(revenue)
    }));
  }

  async retryPayment(authClient: AuthClient, subscriptionId: number): Promise<boolean> {
    const actor = await this.getActor(authClient);
    return actor.retryPayment(subscriptionId);
  }

  // New marketplace functions
  async getAllPublicPlans(authClient: AuthClient): Promise<SubscriptionPlan[]> {
    const actor = await this.getActor(authClient);
    return actor.getAllPublicPlans();
  }

  async searchPlans(authClient: AuthClient, query: string): Promise<SubscriptionPlan[]> {
    const actor = await this.getActor(authClient);
    return actor.searchPlans(query);
  }

  async getPlansByCategory(authClient: AuthClient, minAmount: number, maxAmount: number): Promise<SubscriptionPlan[]> {
    const actor = await this.getActor(authClient);
    return actor.getPlansByCategory(minAmount, maxAmount);
  }

  async getFeaturedPlans(authClient: AuthClient): Promise<SubscriptionPlan[]> {
    const actor = await this.getActor(authClient);
    return actor.getFeaturedPlans();
  }
}

export const subscriptionService = new SubscriptionService();