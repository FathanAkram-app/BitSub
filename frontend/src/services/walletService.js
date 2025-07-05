import { ENV } from '../config/env'
import { apiService } from './api'

const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'deposit' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    'withdraw' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    'generateAddress' : IDL.Func([IDL.Nat], [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })], []),
    'getSubscriptionAddress' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ['query']),
  });
};

export class WalletService {
  constructor() {
    this.canisterId = ENV.CANISTER_IDS.WALLET_MANAGER
  }

  async getActor(authClient) {
    return apiService.getActor(this.canisterId, idlFactory, authClient)
  }

  async getBalance(authClient) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    const balance = await actor.getBalance(identity.getPrincipal())
    return Number(balance)
  }

  async deposit(authClient, amount) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    return actor.deposit(identity.getPrincipal(), BigInt(amount))
  }

  async withdraw(authClient, amount) {
    const actor = await this.getActor(authClient)
    const identity = authClient.getIdentity()
    return actor.withdraw(identity.getPrincipal(), BigInt(amount))
  }

  async generateAddress(authClient, subscriptionId) {
    const actor = await this.getActor(authClient)
    const result = await actor.generateAddress(subscriptionId)
    if ('ok' in result) {
      return result.ok
    }
    throw new Error(result.err)
  }

  async getSubscriptionAddress(authClient, subscriptionId) {
    const actor = await this.getActor(authClient)
    const result = await actor.getSubscriptionAddress(subscriptionId)
    return result.length > 0 ? result[0] : null
  }
}

export const walletService = new WalletService()