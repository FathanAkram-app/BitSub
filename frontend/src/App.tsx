import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent, Actor } from '@dfinity/agent';

import { LoginPage, DashboardPage, SubscriberPage, SelectorPage, MarketplacePage } from './pages';
import Navigation from './components/Navigation';
import Header from './components/Header';
import { ToastContainer } from './components/ui/Toast';
import { UserProfile } from './components/UserProfile';
import { ENV } from './config/env';
import './App.css';

const canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER
const host = ENV.HOST
const isLocal = ENV.DFX_NETWORK === 'local'
const identityProvider = isLocal 
  ? `http://${ENV.CANISTER_IDS.INTERNET_IDENTITY}.localhost:4943`
  : 'https://identity.ic0.app'


// Candid interface for subscription_manager
const idlFactory = ({ IDL }) => {
  const PlanInterval = IDL.Variant({ 
    'Daily' : IDL.Null,
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'Yearly' : IDL.Null
  });
  const PlanData = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Text,
    'amount' : IDL.Nat,
    'interval' : PlanInterval,
    'webhookUrl' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Plan = IDL.Record({
    'title' : IDL.Text,
    'creator' : IDL.Principal,
    'description' : IDL.Text,
    'amount' : IDL.Nat,
    'planId' : IDL.Text,
    'interval' : PlanInterval,
    'webhookUrl' : IDL.Text,
  });
  return IDL.Service({
    'createPlan' : IDL.Func([PlanData], [Result], []),
    'getCreatorPlans' : IDL.Func([IDL.Principal], [IDL.Vec(IDL.Text)], ['query']),
    'getPlan' : IDL.Func([IDL.Text], [IDL.Opt(Plan)], ['query']),
    'getSubscriberAccount' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ['query']),
    'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deletePlan' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
};

function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(undefined);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardType, setDashboardType] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params first to set dashboard type immediately
    const urlParams = new URLSearchParams(window.location.search)
    const subscribeParam = urlParams.get('subscribe')
    
    if (subscribeParam) {
      setDashboardType('subscriber')
      sessionStorage.setItem('pendingSubscription', subscribeParam)
    }
    
    initAuth()
  }, [])



  async function initAuth(): Promise<void> {
    const client = await AuthClient.create()
    const isAuthenticated = await client.isAuthenticated()
    
    setAuthClient(client)
    setIsAuthenticated(isAuthenticated)
    
    if (isAuthenticated) {
      loadPlansWithClient(client)
    }
    
    setLoading(false)
  }

  async function loadPlansWithClient(client: AuthClient): Promise<void> {
    try {
      const identity = client.getIdentity()
      const agent = new HttpAgent({ 
        host,
        identity
      })
      
      // Fetch root key for local development
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        await agent.fetchRootKey()
      }
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const planIds = await actor.getCreatorPlans(identity.getPrincipal())
      const planDetails = []
      
      for (let planId of planIds) {
        const planResult = await actor.getPlan(planId)
        if (planResult.length > 0) {
          planDetails.push(planResult[0])
        }
      }
      
      setPlans(planDetails)
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  async function createActorDirect(): Promise<any> {
    try {
      if (!authClient) return null;
      const identity = authClient.getIdentity();
      const agent = new HttpAgent({ 
        host,
        identity
      })
      
      // Fetch root key for local development
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        await agent.fetchRootKey()
      }
      
      return Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
    } catch (error) {
      console.error('Failed to create actor:', error)
      return null
    }
  }

  async function login(): Promise<void> {
    try {
      if (!authClient) return;
      
      await authClient.login({
        identityProvider,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: () => {
          setIsAuthenticated(true)
          loadPlans()
          
          // Handle pending subscription after login
          const pendingSubscription = sessionStorage.getItem('pendingSubscription')
          if (pendingSubscription) {
            setDashboardType('subscriber')
            sessionStorage.removeItem('pendingSubscription')
          }
        },
        onError: (error) => {
          console.error('Login failed:', error)
          alert('Login failed')
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      alert('Login error: ' + error.message)
    }
  }

  async function logout(): Promise<void> {
    if (authClient) {
      await authClient.logout();
    }
    setIsAuthenticated(false);
  }

  async function loadPlans(): Promise<void> {
    if (authClient) {
      loadPlansWithClient(authClient);
    }
  }

  async function createPlan(planData: any): Promise<void> {
    if (!isAuthenticated || !authClient) return

    try {
      const isAuth = await authClient.isAuthenticated()
      if (!isAuth) {
        setIsAuthenticated(false)
        return
      }

      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const result = await actor.createPlan(planData)

      if ('ok' in result) {
        loadPlans()
      }
    } catch (error) {
      console.error('Create plan error:', error)
    }
  }

  async function deletePlan(planId: string): Promise<void> {
    if (!isAuthenticated || !authClient) return

    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const result = await actor.deletePlan(planId)
      if (result) {
        loadPlans()
      }
    } catch (error) {
      console.error('Delete plan error:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  const handleSwitchDashboard = (type: string): void => {
    setDashboardType(type)
  }

  const renderDashboard = (): React.ReactElement => {
    if (!dashboardType) {
      return <SelectorPage onSelectDashboard={setDashboardType} />
    }
    
    if (dashboardType === 'creator') {
      return (
        <DashboardPage 
          authClient={authClient}
        />
      )
    }
    
    if (dashboardType === 'marketplace') {
      return (
        <MarketplacePage 
          authClient={authClient}
          onSubscribe={(planId: string) => {
            setDashboardType('subscriber');
            sessionStorage.setItem('pendingSubscription', planId);
          }}
        />
      )
    }
    
    return (
      <SubscriberPage 
        authClient={authClient}
        onSwitchToMarketplace={() => setDashboardType('marketplace')}
      />
    )
  }

  return (
    <div className="app">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {!isAuthenticated ? (
        <>
          <Header />
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading BitSub...</p>
            </div>
          ) : (
            <LoginPage onLogin={login} />
          )}
        </>
      ) : (
        <>
          <Navigation 
            dashboardType={dashboardType}
            onSwitchDashboard={handleSwitchDashboard}
            onLogout={logout}
          >
            {/* User Profile in Navigation */}
            <UserProfile authClient={authClient} />
          </Navigation>
          
          <main id="main-content" className="flex-1">
            {renderDashboard()}
          </main>
        </>
      )}

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default App