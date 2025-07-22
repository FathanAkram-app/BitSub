import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

// Enums and basic types
export type PlanInterval = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface PlanIntervalVariant {
  Daily?: null;
  Weekly?: null;
  Monthly?: null;
  Yearly?: null;
}

// Plan related types
export interface CreatePlanRequest {
  title: string;
  description: string;
  amount: number; // in satoshis
  interval: PlanIntervalVariant;
  webhookUrl: string;
}

export interface SubscriptionPlan {
  planId: string;
  creator: Principal;
  title: string;
  description: string;
  amount: number;
  interval: PlanIntervalVariant;
  webhookUrl: string;
  createdAt: number;
  isActive: boolean;
}

// Subscription types
export type SubscriptionStatus = 'Active' | 'Paused' | 'Canceled';

export interface SubscriptionStatusVariant {
  Active?: null;
  Paused?: null;
  Canceled?: null;
}

export interface ActiveSubscription {
  subscriptionId: number;
  planId: string;
  subscriber: Principal;
  btcAddress: string;
  status: SubscriptionStatusVariant;
  createdAt: number;
  lastPayment?: number;
  nextPayment: number;
}

// Transaction types
export type TransactionType = 'Payment' | 'Subscription' | 'Refund';
export type TransactionStatus = 'Pending' | 'Confirmed' | 'Failed';

export interface TransactionTypeVariant {
  Payment?: null;
  Subscription?: null;
  Refund?: null;
}

export interface TransactionStatusVariant {
  Pending?: null;
  Confirmed?: null;
  Failed?: null;
}

export interface Transaction {
  id: number;
  txType: TransactionTypeVariant;
  subscriptionId: number;
  planId: string;
  subscriber: Principal;
  amount: number;
  status: TransactionStatusVariant;
  timestamp: number;
  txHash?: string;
}

// Analytics types
export interface CreatorStats {
  totalRevenue: number;
  totalSubscriptions: number;
  monthlyGrowth: number;
}

export interface PlanInsight {
  planId: string;
  title: string;
  subscribers: number;
  revenue: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

// API Result types
export interface ApiResult<T> {
  ok?: T;
  err?: string;
}

// Error types
export interface BitSubError {
  InvalidInput?: string;
  NotFound?: string;
  Unauthorized?: string;
  InsufficientFunds?: string;
  CanisterError?: string;
  ValidationError?: string;
  SystemError?: string;
}

// Component props types
export interface DashboardProps {
  authClient: AuthClient;
}

export interface NavigationProps {
  dashboardType: DashboardType | null;
  onSwitchDashboard: (type: DashboardType | null) => void;
  onLogout: () => void;
}

export interface SelectorPageProps {
  onSelectDashboard: (type: DashboardType) => void;
}

export interface LoginPageProps {
  onLogin: () => void;
}

export type DashboardType = 'creator' | 'subscriber' | 'marketplace';

// Wallet types
export interface WalletBalance {
  user: Principal;
  balance: bigint;
}

// Price data types
export interface PriceData {
  price: number;
  timestamp: number;
  source: string;
}

// Hook types
export interface UseSubscriptionsReturn {
  subscriptions: ActiveSubscription[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseWalletReturn {
  balance: bigint;
  loading: boolean;
  error: string | null;
  deposit: (amount: bigint) => Promise<boolean>;
  withdraw: (amount: bigint) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export interface UsePriceReturn {
  price: number;
  loading: boolean;
  error: string | null;
  usdValue: (sats: number) => number;
}

// Environment types
export interface Environment {
  CANISTER_IDS: {
    SUBSCRIPTION_MANAGER: string;
    WALLET_MANAGER: string;
    TRANSACTION_LOG: string;
    BITCOIN_INTEGRATION: string;
    BITCOIN_TESTNET: string;
    PAYMENT_PROCESSOR: string;
    OKX_INTEGRATION: string;
    INTERNET_IDENTITY: string;
  };
  HOST: string;
  DFX_NETWORK: string;
}

// Form types
export interface CreatePlanFormData {
  title: string;
  description: string;
  amount: string;
  interval: PlanInterval;
  webhookUrl: string;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Button types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

// Card types
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Form field types
export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'url' | 'textarea';
  error?: string;
}

// Loading types
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}