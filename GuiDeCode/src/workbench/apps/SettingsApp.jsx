// src/workbench/apps/SettingsApp.jsx
import React, { useState, useEffect } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { authApi } from '@/services/api';

const WALLPAPERS = [
  { id: 'retro80s',  label: '80s Phosphor', preview: 'linear-gradient(180deg, #001100, #004400)' },
  { id: 'early90s',  label: '90s Industrial', preview: '#c0c0c0' },
  { id: 'teal95',    label: '95 Teal',       preview: '#008080' },
  { id: 'bliss00s',  label: '00s Bliss',      preview: 'linear-gradient(180deg, #4da1ff, #55a630)' },
  { id: 'cosmic00s', label: '00s Cosmic',     preview: 'radial-gradient(circle, #2e004f, #000000)' },
  { id: 'aero10s',   label: '10s Aero',       preview: 'linear-gradient(135deg, #89cff0, #f0f8ff)' },
  { id: 'flat15s',   label: '15s Coral Soft', preview: 'linear-gradient(135deg, #ff9a7b, #fbd0c5)' },
  { id: 'modern20s', label: '20s Dark Mesh',  preview: 'linear-gradient(135deg, #000000, #1a1a1a)' },
];

const THEMES = [
  { id: 'amiga',   label: 'Amiga OS' },
  { id: 'windows', label: 'Windows Classic' },
  { id: 'minimal', label: 'Golden Dark' },
];

const SettingsApp = ({ tab: defaultTab = 'appearance' }) => {
  const { wbUser, wbPrefs, updatePrefs, wbToken, isSubscribed, isAdmin, addNotification, loadProfile } = useWorkbench();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [profileName, setProfileName] = useState(wbUser?.full_name || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving]           = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [cancelPanelOpen, setCancelPanelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  const tabs = [
    { id: 'appearance',   label: '🎨 Appearance' },
    { id: 'account',      label: '👤 Account' },
    { id: 'subscription', label: '⭐ Subscription' },
    { id: 'about',        label: 'ℹ️ About' },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const body = { full_name: profileName };
      if (newPass) {
        if (newPass !== confirmPass) { addNotification('Passwords do not match', 'error'); setSaving(false); return; }
        if (newPass.length < 6) { addNotification('Password too short', 'error'); setSaving(false); return; }
        body.password = newPass;
      }
      const res = await fetch('/api/auth.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wbToken}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Profile updated successfully', 'success');
        setCurrentPass(''); setNewPass(''); setConfirmPass('');
        loadProfile();
      } else {
        addNotification(data.error || 'Update failed', 'error');
      }
    } catch { addNotification('Connection error', 'error'); }
    setSaving(false);
  };

  const handleCheckout = async (planId) => {
    setCheckoutLoading(true);
    try {
      const data = await authApi.createCheckoutSession(planId);
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        addNotification(data.error || 'Could not create checkout session.', 'error');
      }
    } catch (err) {
      addNotification(err.message || 'Checkout error', 'error');
    }
    setCheckoutLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      addNotification('Please provide a reason for cancellation.', 'error');
      return;
    }
    setCancelling(true);
    try {
      const data = await authApi.cancelSubscription(cancelReason);
      if (data.success) {
        addNotification(data.message || 'Subscription cancelled successfully.', 'success');
        setCancelPanelOpen(false);
        setCancelReason('');
        loadProfile();
      } else {
        addNotification(data.error || 'Cancellation failed.', 'error');
      }
    } catch (err) {
      addNotification(err.message || 'Connection error', 'error');
    }
    setCancelling(false);
  };

  return (
    <div className="wb-app-settings">
      <div className="wb-settings-sidebar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`wb-settings-tab ${activeTab === t.id ? 'wb-settings-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="wb-settings-content">

        {activeTab === 'appearance' && (
          <div className="wb-settings-section">
            <h3 className="wb-settings-heading">Wallpaper</h3>
            <div className="wb-wallpaper-grid">
              {WALLPAPERS.map(wp => (
                <button
                  key={wp.id}
                  className={`wb-wallpaper-item ${wbPrefs.wallpaper === wp.id ? 'wb-wp-selected' : ''}`}
                  onClick={() => updatePrefs({ wallpaper: wp.id })}>
                  <div className="wb-wp-preview" style={{ background: wp.preview }} />
                  <span className="wb-wp-label">{wp.label}</span>
                </button>
              ))}
            </div>

            <h3 className="wb-settings-heading" style={{ marginTop: '1.5rem' }}>Theme</h3>
            <div className="wb-theme-list">
              {THEMES.map(th => (
                <button
                  key={th.id}
                  className={`wb-theme-btn ${wbPrefs.theme === th.id ? 'wb-theme-active' : ''}`}
                  onClick={() => updatePrefs({ theme: th.id })}>
                  {th.label}
                </button>
              ))}
            </div>

            <h3 className="wb-settings-heading" style={{ marginTop: '1.5rem' }}>Animations</h3>
            <label className="wb-toggle-label">
              <input
                type="checkbox"
                className="wb-toggle-input"
                checked={wbPrefs.animations}
                onChange={e => updatePrefs({ animations: e.target.checked })} />
              <span className="wb-toggle-track" />
              Enable window animations
            </label>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="wb-settings-section">
            <h3 className="wb-settings-heading">Profile Information</h3>
            <div className="wb-field">
              <label className="wb-label">Display Name</label>
              <input
                type="text"
                className="wb-input"
                value={profileName}
                onChange={e => setProfileName(e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-label">Email</label>
              <input type="email" className="wb-input" value={wbUser?.email || ''} disabled />
            </div>

            <h3 className="wb-settings-heading" style={{ marginTop: '1.5rem' }}>Change Password</h3>
            <div className="wb-field">
              <label className="wb-label">New Password</label>
              <input type="password" className="wb-input" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Leave blank to keep current" />
            </div>
            <div className="wb-field">
              <label className="wb-label">Confirm Password</label>
              <input type="password" className="wb-input" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>

            <button className="wb-btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleSaveProfile} disabled={saving}>
              {saving ? <span className="wb-spinner" /> : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="wb-settings-section">
            <h3 className="wb-settings-heading">Subscription Status</h3>
            <div className="wb-sub-card">
              <div className={`wb-sub-status-badge ${isAdmin ? 'wb-badge-admin' : isSubscribed ? 'wb-badge-pro' : 'wb-badge-free'}`}>
                {isAdmin ? '⭐ Administrator' : isSubscribed ? `✓ PRO Active (${wbUser?.subscription_type})` : '⊘ Free Plan'}
              </div>
              {wbUser?.subscription_expires && (
                <p className="wb-sub-expires">
                  Expires: {new Date(wbUser.subscription_expires).toLocaleDateString('pt-PT')}
                </p>
              )}
            </div>

            {!isSubscribed && !isAdmin && (
              <div style={{ marginTop: '20px' }}>
                <h4 className="wb-settings-heading">Upgrade to PRO</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div className="wb-sub-upgrade-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <h4 className="wb-sub-upgrade-title">Basic Plan</h4>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '10px 0' }}>$3.90 / month</p>
                      <ul className="wb-sub-features-list">
                        <li>✓ File Manager</li>
                        <li>✓ Database Editor</li>
                        <li>✓ GuideLines Library</li>
                        <li>✓ Grapho MAP 3D</li>
                      </ul>
                    </div>
                    <button 
                      className="wb-btn-primary" 
                      style={{ marginTop: '15px', width: '100%' }}
                      onClick={() => handleCheckout('basic')}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Processing...' : 'Subscribe Basic'}
                    </button>
                  </div>

                  <div className="wb-sub-upgrade-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderColor: 'var(--luxury-gold)', backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <h4 className="wb-sub-upgrade-title" style={{ color: 'var(--luxury-gold)' }}>Complete Plan</h4>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '10px 0' }}>$9.90 / month</p>
                      <ul className="wb-sub-features-list">
                        <li>✓ Everything in Basic</li>
                        <li>✓ Medical Calculators</li>
                        <li>✓ Terminal & Scripts</li>
                        <li>✓ All Future Apps</li>
                      </ul>
                    </div>
                    <button 
                      className="wb-btn-gold" 
                      style={{ marginTop: '15px', width: '100%' }}
                      onClick={() => handleCheckout('complete')}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Processing...' : 'Subscribe Complete'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isSubscribed && !isAdmin && (
              <div style={{ marginTop: '20px' }}>
                {!cancelPanelOpen ? (
                  <button 
                    className="wb-btn-danger" 
                    onClick={() => setCancelPanelOpen(true)}
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="wb-sub-upgrade-card" style={{ borderColor: 'var(--color-danger)' }}>
                    <h4 className="wb-sub-upgrade-title" style={{ color: 'var(--color-danger)' }}>Cancel Subscription</h4>
                    <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Are you sure you want to cancel? You will lose access to PRO features immediately. Please tell us why you are leaving:</p>
                    <textarea 
                      className="wb-input" 
                      style={{ width: '100%', minHeight: '80px', marginBottom: '15px', resize: 'vertical' }}
                      placeholder="Reason for cancellation..."
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="wb-btn-danger" 
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                      </button>
                      <button 
                        className="wb-btn-secondary" 
                        onClick={() => setCancelPanelOpen(false)}
                        disabled={cancelling}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="wb-settings-section">
            <h3 className="wb-settings-heading">About WorkBench</h3>
            <div className="wb-about-card">
              <div className="wb-about-logo-mark">WB</div>
              <p className="wb-about-title">Guilherme WorkBench</p>
              <p className="wb-about-version">Version 4.2 — Build 2024.1</p>
              <p className="wb-about-desc">
                A professional desktop environment for Dr. Guilherme de Macedo Oliveira's
                medical research and clinical tools platform.
                              </p>
              <div className="wb-about-divider" />
              <p className="wb-about-author">
                © 2024 Dr. Guilherme de Macedo Oliveira<br />
                Medical Geneticist · General Practitioner
              </p>
              <p className="wb-about-ichtus">ΙΧΘΥΣ</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsApp;