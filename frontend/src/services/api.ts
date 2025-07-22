import { HttpAgent, Actor, ActorConfig } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { IDL } from '@dfinity/candid';
import { ENV } from '../config/env';

class APIService {
  private agents: Map<string, HttpAgent>;
  private actors: Map<string, any>;

  constructor() {
    this.agents = new Map();
    this.actors = new Map();
  }

  async getAgent(authClient: AuthClient): Promise<HttpAgent> {
    const identity = authClient.getIdentity();
    const agentKey = identity.getPrincipal().toString();
    
    if (!this.agents.has(agentKey)) {
      const agent = new HttpAgent({ host: ENV.HOST, identity });
      if (ENV.DFX_NETWORK === 'local') {
        await agent.fetchRootKey();
      }
      this.agents.set(agentKey, agent);
    }
    
    return this.agents.get(agentKey)!;
  }

  async getActor<T = any>(canisterId: string, idlFactory: IDL.InterfaceFactory, authClient: AuthClient): Promise<T> {
    const actorKey = `${canisterId}-${authClient.getIdentity().getPrincipal().toString()}`;
    
    if (!this.actors.has(actorKey)) {
      const agent = await this.getAgent(authClient);
      const actor = Actor.createActor(idlFactory, { agent, canisterId });
      this.actors.set(actorKey, actor);
    }
    
    return this.actors.get(actorKey);
  }

  clearCache(): void {
    this.agents.clear();
    this.actors.clear();
  }
}

export const apiService = new APIService();