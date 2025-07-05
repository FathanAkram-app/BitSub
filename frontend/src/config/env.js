// Environment configuration for BitSub frontend

export const ENV = {
  DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK || 'local',
  HOST: import.meta.env.VITE_HOST || 'http://localhost:4943',
  CANISTER_IDS: {
    SUBSCRIPTION_MANAGER: import.meta.env.VITE_SUBSCRIPTION_MANAGER_CANISTER_ID || 'b77ix-eeaaa-aaaaa-qaada-cai',
    WALLET_MANAGER: import.meta.env.VITE_WALLET_MANAGER_CANISTER_ID || 'avqkn-guaaa-aaaaa-qaaea-cai',
    TRANSACTION_LOG: import.meta.env.VITE_TRANSACTION_LOG_CANISTER_ID || 'by6od-j4aaa-aaaaa-qaadq-cai',
    BITCOIN_INTEGRATION: import.meta.env.VITE_BITCOIN_INTEGRATION_CANISTER_ID || 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
    BITCOIN_TESTNET: import.meta.env.VITE_BITCOIN_TESTNET_CANISTER_ID || 'bd3sg-teaaa-aaaaa-qaaba-cai',
    PAYMENT_PROCESSOR: import.meta.env.VITE_PAYMENT_PROCESSOR_CANISTER_ID || 'bw4dl-smaaa-aaaaa-qaacq-cai',
    OKX_INTEGRATION: import.meta.env.VITE_OKX_INTEGRATION_CANISTER_ID || 'br5f7-7uaaa-aaaaa-qaaca-cai',
    INTERNET_IDENTITY: import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
    BITSUB_FRONTEND: import.meta.env.VITE_BITSUB_FRONTEND_CANISTER_ID || 'be2us-64aaa-aaaaa-qaabq-cai'
  },
  ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true'
};