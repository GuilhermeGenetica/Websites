import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { APP_REGISTRY } from './apps/_AppRegistry';

const StartMenu = ({ onClose }) => {
  const { openWindow, wbLogout, wbUser, isSubscribed, isAdmin, setStartMenuOpen } = useWorkbench();
  const navigate = useNavigate();
  const ref = useRef(null);

  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('.wb-start-btn')) return;
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAppLaunch = (app) => {
    if (!isSubscribed && !app.freeAccess && !isAdmin) return;
    if (app.adminOnly && !isAdmin) return;
    openWindow(app.id, app.title, app.component, {}, {
      width: app.defaultWidth || 700,
      height: app.defaultHeight || 500,
      icon: app.icon
    });
    setStartMenuOpen(false);
  };

  const handleLogout = () => {
    wbLogout();
    navigate('/workbench/login');
  };

  const toggleGroup = (group) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const visibleApps = APP_REGISTRY.filter(app => {
    if (app.adminOnly && !isAdmin) return false;
    return true;
  });

  const groupedApps = visibleApps.reduce((acc, app) => {
    const g = app.group || 'Tools';
    if (!acc[g]) acc[g] = [];
    acc[g].push(app);
    return acc;
  }, {});

  return (
    <div className="wb-start-menu" ref={ref} onClick={e => e.stopPropagation()}>
      <div className="wb-start-header">
        <div className="wb-start-avatar">
          {wbUser?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="wb-start-userinfo">
          <span className="wb-start-username">{wbUser?.full_name || 'User'}</span>
          <span className={`wb-start-sub ${isSubscribed ? 'wb-sub-active' : 'wb-sub-free'}`}>
            {isAdmin ? '⭐ Admin' : isSubscribed ? '✓ PRO' : '⊘ Free'}
          </span>
        </div>
      </div>

      <div className="wb-start-body">
        {Object.entries(groupedApps).map(([group, apps]) => (
          <div key={group} className="wb-start-group">
            <div 
              className="wb-start-group-label" 
              onClick={() => toggleGroup(group)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              {group}
              <span style={{ fontSize: '10px', opacity: 0.5 }}>
                {collapsedGroups[group] ? '▲' : '▼'}
              </span>
            </div>
            {!collapsedGroups[group] && apps.map(app => {
              const locked = !isAdmin && !isSubscribed && !app.freeAccess;
              return (
                <button
                  key={app.id}
                  className={`wb-start-app-btn ${locked ? 'wb-start-app-locked' : ''}`}
                  onClick={() => handleAppLaunch(app)}
                  disabled={locked && !isAdmin}>
                  <span className="wb-start-app-icon">{app.icon}</span>
                  <span className="wb-start-app-name">{app.title}</span>
                  {locked && <span className="wb-lock-badge">🔒</span>}
                  {app.freeAccess && !locked && <span className="wb-free-badge">FREE</span>}
                  {app.adminOnly && <span className="wb-lock-badge" style={{ color: '#f9e2af' }}>⭐</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="wb-start-footer">
        <button className="wb-start-footer-btn"
          onClick={() => {
            openWindow('settings', 'Settings', 'SettingsApp', {}, { width: 600, height: 480, icon: '⚙️' });
            setStartMenuOpen(false);
          }}>
          ⚙️ Settings
        </button>
        <button className="wb-start-footer-btn wb-logout-btn" onClick={handleLogout}>
          ⏻ Logout
        </button>
      </div>
    </div>
  );
};

export default StartMenu;