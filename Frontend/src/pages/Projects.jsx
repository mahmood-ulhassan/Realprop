import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProjectModal from '../components/ProjectModal';
import './Dashboard.css';
import './Projects.css';

function Projects() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'admin') {
      // Only admins can access projects page
      navigate('/dashboard');
    } else {
      setUser(currentUser);
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, managersRes] = await Promise.all([
        projectService.getProjects(),
        userService.getUsers()
      ]);
      setProjects(projectsRes.data);
      // Filter only managers
      const managerUsers = managersRes.data.filter(u => u.role === 'manager');
      setManagers(managerUsers);
    } catch (err) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also unassign it from any managers.')) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      await loadData();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
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

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search) ||
      p.manager?.name?.toLowerCase().includes(search) ||
      p.manager?.email?.toLowerCase().includes(search)
    );
  });

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Projects" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          {/* Search Bar */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by name, location, or manager..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={handleAddProject}>
              Add New Project
            </button>
          </div>

          {/* Projects Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="pagination-info">
                Showing {filteredProjects.length} of {projects.length}
                {searchTerm && (
                  <span className="filter-info">
                    {' '}(filtered)
                    <button 
                      className="clear-filters-btn"
                      onClick={() => setSearchTerm('')}
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
                  <th className="col-location">Location</th>
                  <th className="col-manager">Assigned Manager</th>
                  <th className="col-created">Created</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No projects found</td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project._id}>
                      <td className="col-name">{project.name}</td>
                      <td className="col-location">{project.location}</td>
                      <td className="col-manager">
                        {project.manager ? (
                          <span className="manager-name">{project.manager.name}</span>
                        ) : (
                          <span className="no-manager">No manager assigned</span>
                        )}
                      </td>
                      <td className="col-created">{formatDate(project.createdAt)}</td>
                      <td className="col-actions">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.36rem' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditProject(project)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteProject(project._id)}
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

      {/* Project Modal */}
      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
          project={editingProject}
          managers={managers}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

export default Projects;

