import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Header.css';

function Header({ onMenuClick, title = 'Dashboard', sidebarOpen = true }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showUserDropdown]);

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
        <button className="notification-button">
          🔔
        </button>
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

