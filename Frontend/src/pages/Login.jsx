import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

/**
 * Login Component
 * 
 * READY FOR YOUR UI CUSTOMIZATION:
 * - All backend logic is connected and working
 * - Just replace the JSX below with your UI design
 * - Keep the form onSubmit, input values, and onChange handlers
 */
function Login() {
  // State management - DO NOT REMOVE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login handler - DO NOT REMOVE (already connected to backend)
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Clear previous errors
    setError('');
    
    // Validate empty fields
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);

    try {
      const user = await authService.login(email.trim(), password);
      console.log('Login successful:', user);
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error full:', err);
      console.error('Login error response:', err.response);
      console.error('Login error data:', err.response?.data);
      
      // Handle different error types
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || 'Invalid email or password';
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = err.message || 'Login failed. Please try again.';
      }
      
      // Set error and stop loading - ensure error is visible
      setError(errorMessage);
      setLoading(false);
    }
  };

  // ============================================
  // REPLACE THE JSX BELOW WITH YOUR UI DESIGN
  // ============================================
  // IMPORTANT: Keep these elements in your UI:
  // - form with onSubmit={handleSubmit}
  // - email input with value={email} and onChange={(e) => setEmail(e.target.value)}
  // - password input with value={password} and onChange={(e) => setPassword(e.target.value)}
  // - error display: {error && <div>{error}</div>}
  // - submit button with disabled={loading}
  // ============================================

  return (
    <div className="login-container">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }} 
        className="login-form" 
        noValidate
      >
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <div className="logo-bar"></div>
            <div className="logo-bar"></div>
            <div className="logo-bar"></div>
          </div>
          <span className="logo-text">Realprop</span>
        </div>
        
        {/* Subtitle */}
        <p className="subtitle">Commercial Lead Management</p>
        
        {/* Email input */}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(''); // Clear error when user types
            }}
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>

        {/* Password input */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(''); // Clear error when user types
            }}
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        {/* Error message - shown above button */}
        {error && <div className="error-message">{error}</div>}

        {/* Submit button */}
        <button 
          type="button" 
          onClick={handleSubmit}
          disabled={loading} 
          className="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;

