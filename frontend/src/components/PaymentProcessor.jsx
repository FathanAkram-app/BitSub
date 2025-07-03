import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'

const processorCanisterId = 'asrmz-lmaaa-aaaaa-qaaeq-cai'
const host = 'http://localhost:4943'

const processorIdlFactory = ({ IDL }) => {
  return IDL.Service({
    'startPaymentProcessor' : IDL.Func([], [], []),
    'stopPaymentProcessor' : IDL.Func([], [], []),
    'triggerPaymentProcessing' : IDL.Func([], [IDL.Nat], []),
    'getProcessorStatus' : IDL.Func([], [IDL.Bool], ['query']),
  });
};

export default function PaymentProcessor({ authClient }) {
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
    startProcessor() // Auto-start processor
  }, [])

  const checkStatus = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(processorIdlFactory, {
        agent,
        canisterId: processorCanisterId,
      })
      
      const status = await actor.getProcessorStatus()
      setIsRunning(status)
    } catch (error) {
      console.error('Failed to check processor status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startProcessor = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(processorIdlFactory, {
        agent,
        canisterId: processorCanisterId,
      })
      
      await actor.startPaymentProcessor()
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to start processor:', error)
    }
  }

  const triggerManualProcessing = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(processorIdlFactory, {
        agent,
        canisterId: processorCanisterId,
      })
      
      const processed = await actor.triggerPaymentProcessing()
      alert(`Processed ${processed} payments`)
    } catch (error) {
      console.error('Failed to trigger processing:', error)
    }
  }

  if (loading) return null

  return (
    <div className="payment-processor">
      <div className="processor-status">
        <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
          {isRunning ? '🟢' : '🔴'}
        </span>
        <span>Auto-Payment Processor: {isRunning ? 'Running' : 'Stopped'}</span>
      </div>
      <button 
        onClick={triggerManualProcessing}
        className="btn-secondary trigger-btn"
      >
        🔄 Process Now
      </button>
    </div>
  )
}