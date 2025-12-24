import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import UserModal from '../components/UserModal';
import './Dashboard.css';
import './Users.css';

function Users() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'admin') {
      // Only admins can access users page
      navigate('/dashboard');
    } else {
      setUser(currentUser);
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, projectsRes] = await Promise.all([
        userService.getUsers(),
        projectService.getProjects()
      ]);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      await loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getProjectNames = (projectIds) => {
    if (!projectIds || projectIds.length === 0) return 'No project';
    return projectIds
      .map(id => {
        const project = projects.find(p => p._id === id);
        return project ? project.name : id;
      })
      .join(', ');
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Users" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          {/* Search and Filter Bar */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={handleAddUser}>
              Add New User
            </button>
          </div>

          {/* Users Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="pagination-info">
                Showing {filteredUsers.length} of {users.length}
                {(searchTerm || roleFilter) && (
                  <span className="filter-info">
                    {' '}(filtered)
                    <button 
                      className="clear-filters-btn"
                      onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('');
                      }}
                    >
                      Clear filters
                    </button>
                  </span>
                )}
              </div>
            </div>

            <table className="leads-table">
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-email">Email</th>
                  <th className="col-role">Role</th>
                  <th className="col-projects">Assigned Projects</th>
                  <th className="col-created">Created</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td className="col-name">{u.name}</td>
                      <td className="col-email">{u.email}</td>
                      <td className="col-role">
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'admin' ? 'Admin' : 'Manager'}
                        </span>
                      </td>
                      <td className="col-projects">{getProjectNames(u.projectIds)}</td>
                      <td className="col-created">{formatDate(u.createdAt)}</td>
                      <td className="col-actions">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.36rem' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditUser(u)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user._id}
                            title={u._id === user._id ? "Cannot delete your own account" : ""}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          projects={projects}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

export default Users;

