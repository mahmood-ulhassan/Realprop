# Frontend Integration Guide

## Project Structure

```
Frontend/
├── src/
│   ├── services/          # API services (already set up)
│   │   ├── api.js         # Axios instance with auth
│   │   ├── authService.js # Login/logout
│   │   ├── projectService.js
│   │   ├── leadService.js
│   │   └── dashboardService.js
│   ├── components/        # Your UI components go here
│   ├── pages/            # Page components
│   └── App.jsx           # Main app component
```

## API Services Ready

All backend API endpoints are wrapped in service files:

### Authentication
```javascript
import { authService } from './services/authService';

// Login
const user = await authService.login(email, password);

// Get current user
const currentUser = authService.getCurrentUser();

// Logout
authService.logout();
```

### Projects
```javascript
import { projectService } from './services/projectService';

// Get all projects
const projects = await projectService.getProjects();

// Create project (admin only)
await projectService.createProject({ name, location, description, managerId });
```

### Leads
```javascript
import { leadService } from './services/leadService';

// Get leads
const leads = await leadService.getLeads(projectId);

// Create lead
await leadService.createLead({ projectId, name, contactNo, ... });

// Update lead
await leadService.updateLead(id, { status, remark, ... });

// Add remark
await leadService.addRemark(id, "Remark text");
```

### Dashboard
```javascript
import { dashboardService } from './services/dashboardService';

// Get metrics
const metrics = await dashboardService.getMetrics(
  projectId, 
  'today' | 'thisweek' | 'thismonth' | 'custom',
  from, // for custom
  to    // for custom
);
```

## Environment Setup

1. Create `.env` file in Frontend directory:
```
VITE_API_URL=http://localhost:5000
```

2. Start backend server (port 5000)

3. Start frontend:
```bash
npm run dev
```

## Token Management

- Tokens are automatically added to API requests
- Stored in localStorage
- Auto-redirects to login on 401 errors

## Next Steps

1. Upload your UI components to `src/components/`
2. Create pages in `src/pages/`
3. Use the service files to connect to backend
4. Add routing (consider react-router-dom)

