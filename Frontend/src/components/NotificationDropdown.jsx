import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import './NotificationDropdown.css';

function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications().then(() => {
        // Mark all as read after loading notifications
        markAllAsRead();
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      console.log('Loaded notifications:', data);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate to tasks page with taskId
    // Handle both populated and unpopulated taskId
    const taskId = notification.taskId?._id || notification.taskId;
    if (taskId) {
      navigate(`/tasks?taskId=${taskId}`);
      onClose();
    } else {
      console.error('Task ID not found in notification:', notification);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'COMMENT':
        return '💬';
      case 'STATUS_CHANGE':
        return '🔄';
      case 'ASSIGNMENT':
        return '📌';
      case 'REASSIGNMENT':
        return '↩️';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
        <div className="notification-dropdown-header">
          <h3>Notifications</h3>
          {notifications.length > 0 && (
            <button className="clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
        <div className="notification-dropdown-body">
          {loading ? (
            <div className="notification-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
              >
                <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                <div className="notification-content">
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTime(notification.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  );
}

export default NotificationDropdown;

