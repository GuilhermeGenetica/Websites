import React from 'react'
import { useWorkbench } from '@/contexts/WorkbenchContext'

const SubscriptionGate = ({ children, appName }) => {
  const { subscriptionActive } = useWorkbench()

  if (subscriptionActive) {
    return children
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="w-16 h-16 mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        {appName || 'Application'} — Access Restricted
      </h3>
      <p className="text-gray-400 text-sm mb-6 max-w-md">
        This application requires an active subscription. Please go to Settings to manage your subscription and unlock all WorkBench features.
      </p>
      <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs">
        Open Settings → Subscription to activate
      </div>
    </div>
  )
}

export default SubscriptionGate