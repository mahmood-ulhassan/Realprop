import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import notificationService from '../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import './Header.css';

function Header({ onMenuClick, title = 'Dashboard', sidebarOpen = true }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Load unread notification count
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showUserDropdown || showNotificationDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showUserDropdown, showNotificationDropdown]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className={`app-header ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <div className="header-left">
        <button className="menu-button" onClick={onMenuClick}>
          ☰
        </button>
        <div className="header-title">
          {title}
        
        </div>
      </div>
      
      <div className="header-right">
        <div className="notification-container" ref={notificationRef}>
          <button 
            className="notification-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotificationDropdown(!showNotificationDropdown);
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          {showNotificationDropdown && (
            <NotificationDropdown
              isOpen={showNotificationDropdown}
              user={user}
              onClose={() => {
                setShowNotificationDropdown(false);
                loadUnreadCount(); // Refresh count after closing
              }}
            />
          )}
        </div>
        <div 
          className="user-menu" 
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          ref={dropdownRef}
        >
          <div className="user-avatar-small">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="user-name-header">{user?.name || 'User'}</span>
         
          
          {showUserDropdown && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-name">{user?.name || 'User'}</div>
                <div className="user-dropdown-email">{user?.email || ''}</div>
                <div className="user-dropdown-role">{user?.role || 'Role'}</div>
              </div>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item" onClick={handleLogout}>
                <span className="dropdown-item-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

