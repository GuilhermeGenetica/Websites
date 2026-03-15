import React, { useState } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionGate = ({ children, appName }) => {
  const { isSubscribed, isAdmin, subscriptionType, addNotification, wbLogout } = useWorkbench();
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  try {
    if (isAdmin || isSubscribed) {
      if (hasError) setHasError(false);
      return <>{children}</>;
    }
  } catch (err) {
    if (!hasError) setHasError(true);
  }

  if (hasError) {
    return (
      <div className="wb-gate-container">
        <div className="wb-gate-icon">⚠️</div>
        <h3 className="wb-gate-title wb-gate-title-error">Access Error</h3>
        <p className="wb-gate-description">
          Something went wrong verifying your subscription status. Please try logging out and back in.
        </p>
        <div className="wb-gate-actions">
          <button
            className="wb-gate-btn wb-gate-btn-secondary"
            onClick={() => {
              try {
                wbLogout();
                navigate('/workbench/login');
              } catch {
                window.location.href = '/workbench/login';
              }
            }}
          >
            Logout &amp; Retry
          </button>
        </div>
      </div>
    );
  }

  const handleViewPlans = () => {
    try {
      navigate('/workbench/login');
    } catch {
      window.location.href = '/workbench/login';
    }
  };

  const handleOpenSettings = () => {
    try {
      const { openWindow } = useWorkbench;
      if (typeof openWindow === 'function') {
        openWindow('settings', 'Settings', 'SettingsApp', { tab: 'subscription' }, { width: 600, height: 480, icon: '⚙️' });
      }
    } catch {
      addNotification && addNotification('Open Settings from the Start Menu', 'info');
    }
  };

  const currentPlanLabel = subscriptionType === 'basic' ? 'Basic' : subscriptionType === 'complete' ? 'Complete' : 'Free';

  return (
    <div className="wb-gate-container">
      <div className="wb-gate-icon">🔒</div>
      <h3 className="wb-gate-title">PRO Subscription Required</h3>
      <p className="wb-gate-description">
        <strong>{appName || 'This application'}</strong> requires an active Basic or Complete subscription.
      </p>
      <div className="wb-gate-current-plan">
        <span className="wb-gate-plan-label">Current Plan</span>
        <span className={`wb-gate-plan-badge wb-gate-plan-${subscriptionType || 'free'}`}>
          {currentPlanLabel}
        </span>
      </div>
      <div className="wb-gate-plans">
        <div className="wb-gate-plan-card">
          <div className="wb-gate-plan-name">Basic</div>
          <div className="wb-gate-plan-price">$3.90<span>/mo</span></div>
          <ul className="wb-gate-plan-features">
            <li>File Manager</li>
            <li>Database Editor</li>
            <li>GuideLines Library</li>
            <li>Grapho MAP 3D</li>
          </ul>
        </div>
        <div className="wb-gate-plan-card wb-gate-plan-card-highlight">
          <div className="wb-gate-plan-name">Complete</div>
          <div className="wb-gate-plan-price">$9.90<span>/mo</span></div>
          <ul className="wb-gate-plan-features">
            <li>Everything in Basic</li>
            <li>Medical Calculators</li>
            <li>Terminal &amp; Scripts</li>
            <li>All Future Apps</li>
          </ul>
        </div>
      </div>
      <div className="wb-gate-actions">
        <button className="wb-gate-btn wb-gate-btn-primary" onClick={handleViewPlans}>
          View Plans &amp; Subscribe
        </button>
        <button className="wb-gate-btn wb-gate-btn-secondary" onClick={handleOpenSettings}>
          Open Settings
        </button>
      </div>
    </div>
  );
};

export default SubscriptionGate;