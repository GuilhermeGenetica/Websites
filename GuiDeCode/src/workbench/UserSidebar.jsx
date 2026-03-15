import React, { useState } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { useNavigate } from 'react-router-dom';

const UserSidebar = () => {
  const { wbUser, isSubscribed, isAdmin, wbLogout, openWindow } = useWorkbench();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    wbLogout();
    navigate('/workbench/login');
  };

  if (!wbUser) return null;

  return (
    <div className={`wb-user-sidebar ${expanded ? 'wb-sidebar-expanded' : ''}`}>
      <div className="wb-sidebar-strip" onClick={() => setExpanded(v => !v)}>
        <span className="wb-sidebar-name">{wbUser.full_name || 'User'}</span>
        <span className="wb-sidebar-toggle">{expanded ? '▶' : '◀'}</span>
      </div>

      {expanded && (
        <div className="wb-sidebar-panel">
          <div className="wb-sidebar-avatar">
            {wbUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="wb-sidebar-info">
            <p className="wb-sidebar-fullname">{wbUser.full_name}</p>
            <p className="wb-sidebar-email">{wbUser.email}</p>
            <span className={`wb-sidebar-badge ${isAdmin ? 'wb-badge-admin' : isSubscribed ? 'wb-badge-pro' : 'wb-badge-free'}`}>
              {isAdmin ? '⭐ Admin' : isSubscribed ? '✓ PRO' : 'Free'}
            </span>
          </div>
          
          {!isSubscribed && !isAdmin && (
            <div className="wb-sidebar-upgrade">
              <p className="wb-sidebar-upgrade-text">Upgrade to PRO to unlock all apps</p>
              <button className="wb-sidebar-upgrade-btn"
                onClick={() => openWindow('settings', 'Settings', 'SettingsApp', { tab: 'subscription' }, { width: 600, height: 480, icon: '⚙️' })}>
                Upgrade Now
              </button>
            </div>
          )}

          <div className="wb-sidebar-actions">
            <button className="wb-sidebar-action-btn"
              onClick={() => { openWindow('settings', 'Settings', 'SettingsApp', {}, { width: 600, height: 480, icon: '⚙️' }); setExpanded(false); }}>
              ⚙️ Settings
            </button>
            <button className="wb-sidebar-action-btn wb-sidebar-logout" onClick={handleLogout}>
              ⏻ Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSidebar;