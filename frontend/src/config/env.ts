// Environment configuration for BitSub frontend

interface CanisterIds {
  SUBSCRIPTION_MANAGER: string;
  WALLET_MANAGER: string;
  TRANSACTION_LOG: string;
  BITCOIN_INTEGRATION: string;
  BITCOIN_TESTNET: string;
  PAYMENT_PROCESSOR: string;
  OKX_INTEGRATION: string;
  INTERNET_IDENTITY: string;
  BITSUB_FRONTEND: string;
}

interface Environment {
  DFX_NETWORK: string;
  HOST: string;
  CANISTER_IDS: CanisterIds;
  ENABLE_CONSOLE_LOGS: boolean;
}

export const ENV: Environment = {
  DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK || 'local',
  HOST: import.meta.env.VITE_HOST || 'http://localhost:4943',
  CANISTER_IDS: {
    SUBSCRIPTION_MANAGER: import.meta.env.VITE_SUBSCRIPTION_MANAGER_CANISTER_ID,
    WALLET_MANAGER: import.meta.env.VITE_WALLET_MANAGER_CANISTER_ID,
    TRANSACTION_LOG: import.meta.env.VITE_TRANSACTION_LOG_CANISTER_ID,
    BITCOIN_INTEGRATION: import.meta.env.VITE_BITCOIN_INTEGRATION_CANISTER_ID,
    BITCOIN_TESTNET: import.meta.env.VITE_BITCOIN_TESTNET_CANISTER_ID,
    PAYMENT_PROCESSOR: import.meta.env.VITE_PAYMENT_PROCESSOR_CANISTER_ID,
    OKX_INTEGRATION: import.meta.env.VITE_OKX_INTEGRATION_CANISTER_ID,
    INTERNET_IDENTITY: import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID,
    BITSUB_FRONTEND: import.meta.env.VITE_BITSUB_FRONTEND_CANISTER_ID 
  },
  ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true'
};