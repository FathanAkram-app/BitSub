import { AuthClient } from '@dfinity/auth-client';
import { ENV } from '../config/env';
import { apiService } from './api';

type GenerateAddressResult = { ok: string } | { err: string };

const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    'generateAddress': IDL.Func(
      [IDL.Nat, IDL.Principal],
      [IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text })],
      []
    ),
    'getAvailableBalance': IDL.Func([IDL.Nat], [IDL.Opt(IDL.Nat64)], ['query']),
    'getBalance': IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'getSubscriptionAddress': IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ['query']),
    'refreshUserBalance': IDL.Func([IDL.Principal], [IDL.Nat64], []),
    'syncSubscriptionBalance': IDL.Func(
      [IDL.Nat],
      [IDL.Variant({ 'ok': IDL.Nat64, 'err': IDL.Text })],
      []
    ),
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

  async refreshBalance(authClient: AuthClient): Promise<number> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const refreshed = await actor.refreshUserBalance(identity.getPrincipal());
    return Number(refreshed);
  }

  async generateAddress(authClient: AuthClient, subscriptionId: number): Promise<string> {
    const actor = await this.getActor(authClient);
    const identity = authClient.getIdentity();
    const result: GenerateAddressResult = await actor.generateAddress(
      subscriptionId,
      identity.getPrincipal()
    );
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