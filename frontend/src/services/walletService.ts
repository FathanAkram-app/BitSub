import { AuthClient } from '@dfinity/auth-client';
import { ENV } from '../config/env';
import { apiService } from './api';

type GenerateAddressResult = { ok: string } | { err: string };

const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    'getBalance': IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'deposit': IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    'withdraw': IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    'generateAddress': IDL.Func([IDL.Nat], [IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text })], []),
    'getSubscriptionAddress': IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ['query']),
  });
};

export class WalletService {
  private canisterId: string;

  constructor() {
    this.canisterId = ENV.CANISTER_IDS.WALLET_MANAGER;
  }

  async getActor(authClient: AuthClient): Promise<any> {
    return apiService.getActor(this.canisterId, idlFactory, authClient);
  }

  async getBalance(authClient: AuthClient): Promise<number> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const balance = await actor.getBalance(identity.getPrincipal());
    return Number(balance);
  }

  async deposit(authClient: AuthClient, amount: number): Promise<boolean> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    return actor.deposit(identity.getPrincipal(), BigInt(amount));
  }

  async withdraw(authClient: AuthClient, amount: number): Promise<boolean> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    return actor.withdraw(identity.getPrincipal(), BigInt(amount));
  }

  async generateAddress(authClient: AuthClient, subscriptionId: number): Promise<string> {
    const actor = await this.getActor(authClient);
    const result: GenerateAddressResult = await actor.generateAddress(subscriptionId);
    if ('ok' in result) {
      return result.ok;
    }
    throw new Error(result.err);
  }

  async getSubscriptionAddress(authClient: AuthClient, subscriptionId: number): Promise<string | null> {
    const actor = await this.getActor(authClient);
    const result: string[] = await actor.getSubscriptionAddress(subscriptionId);
    return result.length > 0 ? result[0] : null;
  }
}

export const walletService = new WalletService();