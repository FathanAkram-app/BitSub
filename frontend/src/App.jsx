import { useState, useEffect } from 'react'
import { AuthClient } from '@dfinity/auth-client'
import { HttpAgent, Actor } from '@dfinity/agent'

import { LoginPage, DashboardPage, SubscriberPage, SelectorPage } from './pages'
import Navigation from './components/Navigation'
import Header from './components/Header'
import { ENV } from './config/env'
import './App.css'

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authClient, setAuthClient] = useState()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [dashboardType, setDashboardType] = useState(null)

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



  async function initAuth() {
    const client = await AuthClient.create()
    const isAuthenticated = await client.isAuthenticated()
    
    setAuthClient(client)
    setIsAuthenticated(isAuthenticated)
    
    if (isAuthenticated) {
      loadPlansWithClient(client)
    }
    
    setLoading(false)
  }

  async function loadPlansWithClient(client) {
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

  async function createActorDirect() {
    try {
      const identity = authClient.getIdentity()
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

  async function login() {
    try {
      
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

  async function logout() {
    await authClient.logout()
    setIsAuthenticated(false)
  }

  async function loadPlans() {
    loadPlansWithClient(authClient)
  }

  async function createPlan(planData) {
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

  async function deletePlan(planId) {
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

  const handleSwitchDashboard = (type) => {
    setDashboardType(type)
  }

  const renderDashboard = () => {
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
    
    return (
      <SubscriberPage 
        authClient={authClient}
      />
    )
  }

  return (
    <div className="app">
      {!isAuthenticated ? (
        <>
          <Header />
          {loading ? (
            <div className="loading">Loading...</div>
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
          />
          {renderDashboard()}
        </>
      )}
    </div>
  )
}

export default App