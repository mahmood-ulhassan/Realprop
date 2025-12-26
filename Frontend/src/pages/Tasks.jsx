import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import taskService from '../services/taskService';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskDetailModal from '../components/TaskDetailModal';
import TaskModal from '../components/TaskModal';
import './Dashboard.css';
import './Tasks.css';

function Tasks() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showAssignedToFilter, setShowAssignedToFilter] = useState(false);
  const [showProjectFilter, setShowProjectFilter] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const loadData = useCallback(async () => {
    if (!user) return; // Don't load if user is not set
    
    try {
      setLoading(true);
      const isAdmin = user && user.role === 'admin';
      const [tasksData, usersData, projectsData] = await Promise.all([
        taskService.getAll(),
        isAdmin ? userService.getUsers() : Promise.resolve({ data: [] }),
        isAdmin ? projectService.getProjects() : Promise.resolve({ data: [] })
      ]);
      setTasks(tasksData);
      
      // Handle users response - axios wraps response in .data
      if (usersData) {
        const usersArray = usersData.data || (Array.isArray(usersData) ? usersData : []);
        setUsers(Array.isArray(usersArray) ? usersArray : []);
        const managersCount = usersArray.filter(u => u && u.role && String(u.role).toLowerCase().trim() === 'manager').length;
        console.log('Tasks: Loaded', usersArray.length, 'users,', managersCount, 'managers');
        if (managersCount === 0 && usersArray.length > 0) {
          console.warn('Tasks: No managers found! User roles:', usersArray.map(u => ({ name: u.name, role: u.role })));
        }
      } else {
        setUsers([]);
      }
      
      // Handle projects response
      if (projectsData) {
        const projectsArray = projectsData.data || (Array.isArray(projectsData) ? projectsData : []);
        setProjects(Array.isArray(projectsArray) ? projectsArray : []);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user is set
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const loadTaskAndOpen = async (taskId) => {
    try {
      const task = await taskService.getById(taskId);
      setSelectedTask(task);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error loading task:', err);
    }
  };

  const handleViewTask = async (task) => {
    try {
      // Reload task to get latest data
      const updatedTask = await taskService.getById(task._id);
      setSelectedTask(updatedTask);
      setIsDetailModalOpen(true);
      
      // Mark task as viewed when opening (for both admin and manager)
      if (user) {
        taskService.markAsViewed(task._id).catch(err => {
          console.error('Error marking task as viewed:', err);
        });
      }
    } catch (err) {
      console.error('Error loading task:', err);
    }
  };

  // Handle taskId from URL (e.g., from notification click)
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && user && tasks.length > 0) {
      loadTaskAndOpen(taskId);
      setSearchParams({}); // Clear the taskId from URL
    }
  }, [tasks, searchParams, user]);

  const handleAddTask = () => {
    setIsTaskModalOpen(true);
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

  const formatDueDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'Overdue';
    if (dueDate.getTime() === today.getTime()) return 'Today';
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': '#3b82f6',
      'IN_PROGRESS': '#10b981',
      'BLOCKED': '#ef4444',
      'COMPLETED': '#f59e0b',
      'CLOSED': '#6b7280',
      'REASSIGNED': '#8b5cf6',
      'CANCELLED': '#9ca3af'
    };
    return colors[status] || '#6b7280';
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (!user || !task) return false;

    // For managers, only show tasks assigned to them
    if (user.role === 'manager') {
      const assignedToId = task.assignedTo?._id || task.assignedTo;
      if (!assignedToId || assignedToId.toString() !== user._id.toString()) return false;
    }

    // Always exclude CLOSED and CANCELLED tasks unless explicitly filtering for them
    if (statusFilter !== 'CLOSED' && task.status === 'CLOSED') return false;
    if (statusFilter !== 'CANCELLED' && task.status === 'CANCELLED') return false;
    
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    // Assigned To filter (admin only)
    if (user.role === 'admin' && assignedToFilter !== 'all') {
      const assignedToId = task.assignedTo?._id || task.assignedTo;
      if (assignedToFilter === 'me') {
        if (!assignedToId || assignedToId.toString() !== user._id.toString()) return false;
      } else {
        if (!assignedToId || assignedToId.toString() !== assignedToFilter.toString()) return false;
      }
    }

    // Project filter (admin only)
    if (user.role === 'admin' && projectFilter !== 'all') {
      const projectId = task.projectId?._id || task.projectId;
      if (!projectId || projectId.toString() !== projectFilter.toString()) return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        task.number?.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.assignedTo?.name?.toLowerCase().includes(search) ||
        task.projectId?.name?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-header')) {
        setShowStatusFilter(false);
        setShowAssignedToFilter(false);
        setShowProjectFilter(false);
      }
    };

    if (showStatusFilter || showAssignedToFilter || showProjectFilter) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showStatusFilter, showAssignedToFilter, showProjectFilter]);

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Tasks" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          {/* Search Bar */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search tasks..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {user.role === 'admin' && (
              <button className="btn-primary" onClick={handleAddTask}>
                Create Task
              </button>
            )}
          </div>

          {/* Tasks Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="pagination-info">
                Showing {filteredTasks.length} of {tasks.length}
                {(statusFilter !== 'all' || assignedToFilter !== 'all' || projectFilter !== 'all' || searchTerm) && (
                  <button 
                    className="clear-filters-btn-small"
                    onClick={() => {
                      setStatusFilter('all');
                      setAssignedToFilter('all');
                      setProjectFilter('all');
                      setSearchTerm('');
                    }}
                    title="Clear all filters"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <table className="leads-table tasks-table">
              <thead>
                <tr>
                  <th className="col-assigned filter-header" onClick={() => user.role === 'admin' && setShowAssignedToFilter(!showAssignedToFilter)}>
                    Assigned To {user.role === 'admin' && <span className="sort-icon">⇅</span>}
                    {assignedToFilter !== 'all' && <span className="filter-indicator">●</span>}
                    {showAssignedToFilter && user.role === 'admin' && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setAssignedToFilter('all')}>
                          All
                        </div>
                        <div className="filter-option" onClick={() => setAssignedToFilter('me')}>
                          Me
                        </div>
                        {users.filter(u => u.role === 'manager').map(manager => (
                          <div 
                            key={manager._id} 
                            className={`filter-option ${assignedToFilter === manager._id ? 'active' : ''}`}
                            onClick={() => {
                              setAssignedToFilter(assignedToFilter === manager._id ? 'all' : manager._id);
                              setShowAssignedToFilter(false);
                            }}
                          >
                            {manager.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  {user.role === 'admin' && (
                    <th className="col-project filter-header" onClick={() => setShowProjectFilter(!showProjectFilter)}>
                      Project <span className="sort-icon">⇅</span>
                      {projectFilter !== 'all' && <span className="filter-indicator">●</span>}
                      {showProjectFilter && (
                        <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="filter-option" onClick={() => setProjectFilter('all')}>
                            All Projects
                          </div>
                          {projects.map(project => (
                            <div 
                              key={project._id} 
                              className={`filter-option ${projectFilter === project._id ? 'active' : ''}`}
                              onClick={() => {
                                setProjectFilter(projectFilter === project._id ? 'all' : project._id);
                                setShowProjectFilter(false);
                              }}
                            >
                              {project.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </th>
                  )}
                  <th className="col-status filter-header" onClick={() => setShowStatusFilter(!showStatusFilter)}>
                    Status <span className="sort-icon">⇅</span>
                    {statusFilter !== 'all' && <span className="filter-indicator">●</span>}
                    {showStatusFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setStatusFilter('all')}>
                          All Status
                        </div>
                        {['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CLOSED', 'REASSIGNED', 'CANCELLED'].map(status => (
                          <div 
                            key={status} 
                            className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => {
                              setStatusFilter(statusFilter === status ? 'all' : status);
                              setShowStatusFilter(false);
                            }}
                          >
                            {status.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-updated">Last Updated</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === 'admin' ? 6 : 5} className="no-data">No tasks found</td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task._id}>
                      <td className="col-assigned">{task.assignedTo?.name || '-'}</td>
                      {user.role === 'admin' && (
                        <td className="col-project">{task.projectId?.name || '-'}</td>
                      )}
                      <td className="col-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="col-updated">{formatDate(task.lastUpdatedAt || task.updatedAt)}</td>
                      <td className="col-actions">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.36rem' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleViewTask(task)}
                          >
                            View
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

      {/* Task Detail Modal */}
      {isDetailModalOpen && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onUpdate={loadData}
        />
      )}

      {/* Task Create/Edit Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
          }}
          task={null}
          users={Array.isArray(users) ? users : []}
          projects={projects}
          onSuccess={loadData}
          tasksCount={tasks.length}
        />
      )}
    </div>
  );
}

export default Tasks;

