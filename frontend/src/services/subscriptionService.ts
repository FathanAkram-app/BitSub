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
  
  // Webhook types
  const WebhookEventType = IDL.Variant({
    'SubscriptionCreated': IDL.Null,
    'PaymentSuccessful': IDL.Null,
    'PaymentFailed': IDL.Null,
    'SubscriptionCancelled': IDL.Null,
    'SubscriptionExpired': IDL.Null
  });
  
  const WebhookStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Sent': IDL.Null,
    'Failed': IDL.Null,
    'Disabled': IDL.Null
  });
  
  const WebhookConfig = IDL.Record({
    'url': IDL.Text,
    'secret': IDL.Text,
    'events': IDL.Vec(WebhookEventType),
    'isActive': IDL.Bool,
    'maxRetries': IDL.Nat,
    'timeout': IDL.Nat
  });
  
  const WebhookEvent = IDL.Record({
    'id': IDL.Nat,
    'eventType': WebhookEventType,
    'subscriptionId': IDL.Nat,
    'planId': IDL.Text,
    'subscriber': IDL.Principal,
    'timestamp': IDL.Int,
    'status': WebhookStatus,
    'retryCount': IDL.Nat,
    'lastAttempt': IDL.Opt(IDL.Int),
    'responseCode': IDL.Opt(IDL.Nat),
    'errorMessage': IDL.Opt(IDL.Text)
  });
  
  const WebhookRetryStats = IDL.Record({
    'totalEvents': IDL.Nat,
    'pendingRetries': IDL.Nat,
    'failedEvents': IDL.Nat,
    'completedEvents': IDL.Nat,
    'averageRetryCount': IDL.Nat
  });
  
  const WebhookVerificationInfo = IDL.Record({
    'instructions': IDL.Text,
    'exampleSignature': IDL.Text
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
    // Webhook functions (only methods that exist in backend)
    'configureWebhook' : IDL.Func([IDL.Text, WebhookConfig], [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })], []),
    'getWebhookConfig' : IDL.Func([IDL.Text], [IDL.Opt(WebhookConfig)], ['query']),
    'testWebhook' : IDL.Func([IDL.Text], [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })], []),
    // Advanced analytics functions

    'getRevenueInUSD' : IDL.Func([IDL.Principal], [IDL.Float64], []),
    'getWebhookEventBreakdown' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Tuple(WebhookEventType, IDL.Nat))], ['query']),
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
  // Webhook functions (only methods that exist in backend)
  configureWebhook: (planId: string, config: any) => Promise<ApiResult<null>>;
  getWebhookConfig: (planId: string) => Promise<any[]>;
  testWebhook: (planId: string) => Promise<ApiResult<string>>;
  // Advanced analytics functions

  getRevenueInUSD: (creator: Principal) => Promise<number>;
  getWebhookEventBreakdown: (planId: string) => Promise<[any, bigint][]>;
}

export class SubscriptionService {
  private canisterId: string;

  constructor() {
    this.canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER;
  }

  private async getActor(authClient: AuthClient): Promise<ActorSubclass<SubscriptionManagerActor>> {
    return (await apiService.getActor(this.canisterId, idlFactory, authClient)) as ActorSubclass<SubscriptionManagerActor>;
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

  // User profile methods
  async getUserStats(authClient: AuthClient): Promise<any> {
    try {
      // For now, return mock data - would integrate with actual canister methods
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      
      // Simulate getting user stats
      return {
        totalEarned: 125000,
        totalSpent: 45000,
        activeSubscriptions: 3,
        createdPlans: 2,
        joinDate: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalEarned: 0,
        totalSpent: 0,
        activeSubscriptions: 0,
        createdPlans: 0,
        joinDate: Date.now()
      };
    }
  }

  // Webhook methods
  async configureWebhook(authClient: AuthClient, planId: string, config: any): Promise<ApiResult<null>> {
    try {
      const actor = await this.getActor(authClient);
      
      // Convert event types to proper Motoko variants
      const events = config.events.map((event: string) => {
        switch (event) {
          case 'subscription.created': return { SubscriptionCreated: null };
          case 'payment.successful': return { PaymentSuccessful: null };
          case 'payment.failed': return { PaymentFailed: null };
          case 'subscription.cancelled': return { SubscriptionCancelled: null };
          case 'subscription.expired': return { SubscriptionExpired: null };
          default: return { SubscriptionCreated: null };
        }
      });

      const webhookConfig = {
        url: config.url,
        secret: config.secret,
        events: events,
        isActive: config.isActive,
        maxRetries: BigInt(config.maxRetries || 3),
        timeout: BigInt(config.timeout || 30)
      };

      console.log('Calling configureWebhook with:', { planId, webhookConfig });
      const result = await actor.configureWebhook(planId, webhookConfig);
      console.log('configureWebhook result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in configureWebhook:', error);
      return { err: `Configuration failed: ${error}` };
    }
  }

  async getWebhookConfig(authClient: AuthClient, planId: string): Promise<any> {
    const actor = await this.getActor(authClient);
    const result = await actor.getWebhookConfig(planId);
    
    if (result.length > 0) {
      const config = result[0];
      // Convert Motoko variants back to strings
      const events = config.events.map((event: any) => {
        const eventType = Object.keys(event)[0];
        switch (eventType) {
          case 'SubscriptionCreated': return 'subscription.created';
          case 'PaymentSuccessful': return 'payment.successful';
          case 'PaymentFailed': return 'payment.failed';
          case 'SubscriptionCancelled': return 'subscription.cancelled';
          case 'SubscriptionExpired': return 'subscription.expired';
          default: return 'subscription.created';
        }
      });

      return {
        url: config.url,
        secret: config.secret,
        events: events,
        isActive: config.isActive,
        maxRetries: Number(config.maxRetries),
        timeout: Number(config.timeout)
      };
    }
    
    return null;
  }

  async testWebhook(authClient: AuthClient, planId: string): Promise<ApiResult<string>> {
    try {
      const actor = await this.getActor(authClient);
      console.log('Calling testWebhook with planId:', planId);
      const result = await actor.testWebhook(planId);
      console.log('testWebhook result:', result);
      return result;
    } catch (error) {
      console.error('Error in testWebhook:', error);
      return { err: `Test failed: ${error}` };
    }
  }

  // Simplified webhook methods - only core functionality
  async getWebhookEvents(authClient: AuthClient, planId: string): Promise<any[]> {
    return [];
  }

  async getWebhookRetryStats(authClient: AuthClient, planId: string): Promise<any> {
    return {
      totalEvents: 0,
      pendingRetries: 0,
      failedEvents: 0,
      completedEvents: 0,
      averageRetryCount: 0
    };
  }

  async retryWebhookEvent(authClient: AuthClient, eventId: number): Promise<ApiResult<boolean>> {
    return { ok: true };
  }

  async retryFailedWebhooks(authClient: AuthClient): Promise<number> {
    return 0;
  }

  async getWebhookVerificationInfo(authClient: AuthClient, planId: string): Promise<any> {
    return {
      instructions: "Webhook verification is handled automatically",
      exampleSignature: "N/A"
    };
  }

  async getFilteredWebhookEvents(authClient: AuthClient, planId: string, filters: any): Promise<any[]> {
    return [];
  }

  // Helper methods for converting between frontend and Motoko formats
  private convertEventTypeToMotoko(eventType: string): any {
    switch (eventType) {
      case 'subscription.created': return { SubscriptionCreated: null };
      case 'payment.successful': return { PaymentSuccessful: null };
      case 'payment.failed': return { PaymentFailed: null };
      case 'subscription.cancelled': return { SubscriptionCancelled: null };
      case 'subscription.expired': return { SubscriptionExpired: null };
      default: return { SubscriptionCreated: null };
    }
  }

  private convertEventTypeFromMotoko(eventType: any): string {
    const type = Object.keys(eventType)[0];
    switch (type) {
      case 'SubscriptionCreated': return 'subscription.created';
      case 'PaymentSuccessful': return 'payment.successful';
      case 'PaymentFailed': return 'payment.failed';
      case 'SubscriptionCancelled': return 'subscription.cancelled';
      case 'SubscriptionExpired': return 'subscription.expired';
      default: return 'subscription.created';
    }
  }

  private convertStatusToMotoko(status: string): any {
    switch (status) {
      case 'pending': return { Pending: null };
      case 'sent': return { Sent: null };
      case 'failed': return { Failed: null };
      case 'disabled': return { Disabled: null };
      default: return { Pending: null };
    }
  }

  private convertStatusFromMotoko(status: any): string {
    const statusType = Object.keys(status)[0];
    switch (statusType) {
      case 'Pending': return 'pending';
      case 'Sent': return 'sent';
      case 'Failed': return 'failed';
      case 'Disabled': return 'disabled';
      default: return 'pending';
    }
  }

  // Advanced analytics methods


  async getRevenueInUSD(authClient: AuthClient): Promise<number> {
    try {
      const actor = await this.getActor(authClient);
      const identity = authClient.getIdentity();
      const result = await actor.getRevenueInUSD(identity.getPrincipal());
      return Number(result);
    } catch (error) {
      console.error('Failed to get revenue in USD:', error);
      return 0;
    }
  }

  async getWebhookEventBreakdown(authClient: AuthClient, planId: string): Promise<any[]> {
    try {
      const actor = await this.getActor(authClient);
      const result = await actor.getWebhookEventBreakdown(planId);
      
      return result.map(([eventType, count]: [any, bigint]) => ({
        eventType: this.convertEventTypeFromMotoko(eventType),
        count: Number(count)
      }));
    } catch (error) {
      console.error('Failed to get webhook event breakdown:', error);
      return [];
    }
  }
}

export const subscriptionService = new SubscriptionService();