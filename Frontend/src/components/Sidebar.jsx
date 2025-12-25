import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './Sidebar.css';

function Sidebar({ isOpen = true }) {
  const location = useLocation();
  const user = authService.getCurrentUser();

  // Menu items based on user role
  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['admin', 'manager'] },
    { path: '/projects', label: 'Projects', icon: '📁', roles: ['admin'] },
    { path: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
    { path: '/inventory', label: 'Inventory', icon: '📦', roles: ['admin'] },
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
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
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

