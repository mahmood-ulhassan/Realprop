import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import campaignsService from '../services/campaignsService';
import './Sidebar.css';

function Sidebar({ isOpen = true }) {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [pendingCampaignsCount, setPendingCampaignsCount] = useState(0);

  // Fetch pending campaigns count for managers
  useEffect(() => {
    const fetchPendingCampaignsCount = async () => {
      if (user?.role === 'manager') {
        try {
          const campaigns = await campaignsService.listCampaigns();
          const pendingCount = campaigns.filter(c => c.status === 'pending').length;
          setPendingCampaignsCount(pendingCount);
        } catch (err) {
          console.error('Error fetching pending campaigns count:', err);
          setPendingCampaignsCount(0);
        }
      }
    };

    if (user?.role === 'manager') {
      fetchPendingCampaignsCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingCampaignsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role, location.pathname]); // Also refresh when navigating to/from campaigns page

  // Menu items based on user role
  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['admin', 'manager'] },
    { path: '/projects', label: 'Projects', icon: '📁', roles: ['admin'] },
    { path: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
    { path: '/inventory', label: 'Inventory', icon: '📦', roles: ['admin'] },
    { path: '/tasks', label: 'Tasks', icon: '✅', roles: ['admin', 'manager'] },
    { path: '/accounts', label: 'Accounts', icon: '💰', roles: ['admin'] },
    { 
      path: '/campaigns', 
      label: 'Campaign', 
      icon: '📊', 
      roles: ['manager'],
      badgeCount: user?.role === 'manager' ? pendingCampaignsCount : undefined
    },
      { 
      path: '/generate-leads', 
      label: 'Generate Leads', 
      icon: '📋', 
      roles: ['admin'],
      subItems: [
        { path: '/generate-leads', label: 'Generate Lead' },
        { path: '/campaigns', label: 'Campaigns' }
      ]
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className={`sidebar ${isOpen !== false ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <div className="logo-bar"></div>
          <div className="logo-bar"></div>
          <div className="logo-bar"></div>
        </div>
        <span className="logo-text">Realprop</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          // Check if parent or any sub-item is active
          const isParentActive = location.pathname === item.path || 
            (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
          
          const isExpanded = expandedItems.has(item.path);
          
          const handleParentClick = (e) => {
            if (item.subItems) {
              e.preventDefault();
              const newExpanded = new Set(expandedItems);
              if (newExpanded.has(item.path)) {
                newExpanded.delete(item.path);
              } else {
                newExpanded.add(item.path);
              }
              setExpandedItems(newExpanded);
            }
          };
          
          return (
            <div key={item.path}>
              <div
                onClick={item.subItems ? handleParentClick : undefined}
                className={`nav-item ${isParentActive ? 'active' : ''} ${item.subItems ? 'has-submenu' : ''}`}
                style={item.subItems ? { cursor: 'pointer' } : {}}
              >
                {!item.subItems ? (
                  <Link
                    to={item.path}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.675rem', flex: 1, textDecoration: 'none', color: 'inherit' }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ) : (
                  <>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    <span className="submenu-chevron" style={{ 
                      marginLeft: 'auto',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                  </>
                )}
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="nav-badge">{item.badgeCount}</span>
                )}
              </div>
              {item.subItems && isExpanded && (
                <div className="sub-menu">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`sub-nav-item ${location.pathname === subItem.path ? 'active' : ''}`}
                    >
                      <span className="sub-nav-label">{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{user?.role || 'Role'}</div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

