import { useState } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'

const canisterId = 'bd3sg-teaaa-aaaaa-qaaba-cai'
const host = 'http://localhost:4943'

const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'advanceSubscription' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  });
};

export default function SubscriptionAdvancer({ subscription, authClient, onAdvanced }) {
  const [advancing, setAdvancing] = useState(false)

  const handleAdvance = async () => {
    setAdvancing(true)
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const result = await actor.advanceSubscription(Number(subscription.subscriptionId))
      if (result) {
        onAdvanced()
      }
    } catch (error) {
      console.error('Failed to advance subscription:', error)
    } finally {
      setAdvancing(false)
    }
  }

  const isOverdue = () => {
    const nextPayment = Number(subscription.nextPayment) / 1000000
    return Date.now() > nextPayment
  }

  if (!isOverdue()) return null

  return (
    <div className="subscription-advancer">
      <p className="overdue-notice">⚠️ Payment overdue</p>
      <button 
        onClick={handleAdvance}
        disabled={advancing}
        className="btn-secondary advance-btn"
      >
        {advancing ? 'Advancing...' : '⏭️ Advance to Next Period'}
      </button>
    </div>
  )
}