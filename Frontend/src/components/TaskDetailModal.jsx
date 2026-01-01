import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import taskService from '../services/taskService';
import ConfirmationModal from './ConfirmationModal';
import './RemarksModal.css';

function TaskDetailModal({ isOpen, onClose, task, onUpdate }) {
  const [taskData, setTaskData] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const user = authService.getCurrentUser();

  // Track the last task ID we initialized for
  const [lastInitializedTaskId, setLastInitializedTaskId] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      const taskId = task._id;
      
      // Only reset comment fields when opening a different task (not on every render)
      if (lastInitializedTaskId !== taskId) {
        console.log('Initializing modal for new task:', taskId);
        setNewComment('');
        setReplyingTo(null);
        setReplyText('');
        setError('');
        setSubmitting(false);
        setLastInitializedTaskId(taskId);
        // Load task data only when opening a new task
        loadTask();
      }
      
      // Mark task as viewed when modal opens (for both admin and manager)
      if (user && lastInitializedTaskId !== taskId) {
        taskService.markAsViewed(task._id).catch(err => {
          console.error('Error marking task as viewed:', err);
        });
      }
    } else if (!isOpen) {
      // Reset all state when modal closes
      setSubmitting(false);
      setNewComment('');
      setError('');
      setLastInitializedTaskId(null);
    }
  }, [isOpen, task?._id, user]); // Removed initializedTaskId from dependencies to prevent loops

  const loadTask = async () => {
    try {
      const updatedTask = await taskService.getById(task._id);
      // Don't reset newComment when loading task - preserve user input
      setTaskData(updatedTask);
    } catch (err) {
      console.error('Error loading task:', err);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
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

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (!taskData || !taskData._id) {
      setError('Task data is missing');
      console.error('Task data:', taskData);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Adding comment to task:', taskData._id, 'Comment:', newComment.trim());
      const result = await taskService.addComment(taskData._id, newComment.trim());
      console.log('Comment added successfully:', result);
      // Update local state with the new comment instead of reloading
      setTaskData(result);
      setNewComment('');
      // Don't call onUpdate immediately - it causes the modal to refresh
      // The badge count will update when the modal is closed or when user navigates
    } catch (err) {
      console.error('Error adding comment - Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(err.response?.data?.message || err.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!replyText.trim()) {
      setError('Please enter a reply');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await taskService.addComment(taskData._id, replyText.trim(), parentCommentId);
      // Update local state with the new reply instead of reloading
      setTaskData(result);
      setReplyingTo(null);
      setReplyText('');
      // Don't call onUpdate immediately - it causes the modal to refresh
      // The badge count will update when the modal is closed or when user navigates
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add reply');
      console.error('Error adding reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setConfirmMessage(`Change status to ${newStatus.replace('_', ' ')}?`);
    setConfirmAction(() => async () => {
      try {
        await taskService.updateStatus(taskData._id, newStatus);
        await loadTask();
        if (onUpdate) onUpdate();
        
        // Close modal if task is cancelled, closed, or completed
        if (newStatus === 'CANCELLED' || newStatus === 'CLOSED' || newStatus === 'COMPLETED') {
          onClose();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status');
        console.error('Error updating status:', err);
      }
    });
    setShowConfirmModal(true);
  };

  const handleReassign = async () => {
    setConfirmMessage('Reassign this task?');
    setConfirmAction(() => async () => {
      try {
        await taskService.reassign(taskData._id, '');
        await loadTask();
        if (onUpdate) onUpdate();
        // Close the modal after successfully reassigning the task
        onClose();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to reassign task');
        console.error('Error reassigning task:', err);
      }
    });
    setShowConfirmModal(true);
  };

  const handleClose = () => {
    setConfirmMessage('Close this task?');
    setConfirmAction(() => async () => {
      try {
        await taskService.updateStatus(taskData._id, 'CLOSED');
        await loadTask();
        if (onUpdate) onUpdate();
        // Close the modal after successfully closing the task
        onClose();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to close task');
        console.error('Error closing task:', err);
      }
    });
    setShowConfirmModal(true);
  };

  if (!isOpen || !taskData) return null;

  const getInitials = (description) => {
    if (!description) return 'T';
    // Use first character of description or 'T' for Task
    return description[0].toUpperCase() || 'T';
  };

  // Organize comments into threads (parent comments with replies)
  const organizeComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return [];
    
    const parentComments = comments.filter(c => !c.parentCommentId);
    const replies = comments.filter(c => c.parentCommentId);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parentCommentId?.toString() === parent._id.toString())
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const commentThreads = organizeComments(taskData.comments);

  return (
    <div className="remarks-modal-overlay" onClick={() => onClose()}>
      <div className="remarks-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="remarks-modal-header">
          <h2>Task Details</h2>
          <button className="remarks-close-button" onClick={() => onClose()}>×</button>
        </div>

        <div className="remarks-modal-body">
          {/* Task Information */}
          <div className="lead-info-section">
            <div className="lead-avatar">
              {getInitials(taskData.description || 'Task')}
            </div>
            <div className="lead-details">
              <div className="lead-name-row">
                <h3>{taskData.description || 'Task'}</h3>
                <span 
                  className="lead-status-badge"
                  style={{ backgroundColor: getStatusColor(taskData.status) }}
                >
                  {taskData.status.replace('_', ' ')}
                </span>
              </div>
              <p className="lead-contact">
                Assigned to: {taskData.assignedTo?.name || 'N/A'}
                {taskData.projectId && ` • Project: ${taskData.projectId.name}`}
                {taskData.leadId && ` • Lead: ${taskData.leadId.contactNo || 'N/A'}`}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>
                Created by {taskData.createdBy?.name} on {formatDateTime(taskData.createdAt)}
              </p>
            </div>
          </div>

          {/* Comments Timeline */}
          <div 
            className="remarks-timeline"
            onMouseEnter={() => {
              // Mark comments as viewed when user views the comments section (for both admin and manager)
              if (user && taskData) {
                taskService.markCommentsAsViewed(taskData._id).catch(err => {
                  console.error('Error marking comments as viewed:', err);
                });
              }
            }}
          >
            {commentThreads.length === 0 ? (
              <div className="no-remarks">
                <p>No comments yet. Add the first comment below.</p>
              </div>
            ) : (
              <div className="timeline-container">
                <div className="timeline-line"></div>
                {commentThreads.map((comment, index) => (
                  <div key={comment._id || index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="remark-date">
                        {formatDateTime(comment.timestamp)}
                      </div>
                      <div className="remark-author">
                        Added by: {comment.addedBy?.name || 'Unknown'}
                      </div>
                      <div className="remark-text">{comment.text}</div>
                      
                      {/* Reply button */}
                      <button
                        className="cancel-add-button"
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        style={{ 
                          marginTop: '0.45rem',
                          fontSize: '0.7875rem',
                          padding: '0.225rem 1.45rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {replyingTo === comment._id ? 'Cancel Reply' : 'Reply'}
                      </button>

                      {/* Reply input */}
                      {replyingTo === comment._id && (
                        <div style={{ marginTop: '0.675rem', paddingLeft: '0.9rem', borderLeft: '2px solid #e5e7eb' }}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            style={{
                              width: '100%',
                              padding: '0.45rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.7875rem'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleReply(comment._id);
                              }
                            }}
                          />
                          <button
                            className="add-remark-button"
                            onClick={() => handleReply(comment._id)}
                            disabled={submitting || !replyText.trim()}
                            style={{ marginTop: '0.45rem' }}
                          >
                            {submitting ? 'Replying...' : 'Reply'}
                          </button>
                        </div>
                      )}

                      {/* Show replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div style={{ marginTop: '0.675rem', paddingLeft: '0.9rem', borderLeft: '2px solid #e5e7eb' }}>
                              {comment.replies.map((reply, replyIndex) => (
                                <div key={reply._id || replyIndex} style={{ marginBottom: '0.675rem' }}>
                                  <div className="remark-date">
                                    {formatDateTime(reply.timestamp)}
                                  </div>
                                  <div className="remark-author">
                                    Added by: {reply.addedBy?.name || 'Unknown'}
                                  </div>
                                  <div className="remark-text">{reply.text}</div>
                                </div>
                              ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment Section */}
          <div className="add-remark-section">
            {error && <div className="remark-error">{error}</div>}
            <div className="add-remark-input-group">
              <input
                type="text"
                className="remark-input"
                placeholder="Add a comment..."
                value={newComment || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('Input onChange - newValue:', newValue, 'current newComment state:', newComment);
                  setNewComment(newValue);
                  // Force a small delay to verify state update
                  setTimeout(() => {
                    console.log('After setState - newComment should be:', newValue);
                  }, 0);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
                onFocus={() => console.log('Input focused, current newComment:', newComment)}
                onBlur={() => console.log('Input blurred, current newComment:', newComment)}
                disabled={submitting}
                style={{ 
                  pointerEvents: submitting ? 'none' : 'auto',
                  color: '#000',
                  backgroundColor: '#fff'
                }}
                autoFocus={false}
              />
              <button
                className="add-remark-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Add Comment button clicked, submitting:', submitting, 'newComment:', newComment);
                  handleAddComment();
                }}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.9rem', marginTop: '1.35rem', paddingTop: '1.35rem', borderTop: '1px solid #e5e7eb' }}>
            {user.role === 'admin' ? (
              <>
                {taskData.status === 'COMPLETED' && (
                  <button
                    className="btn-save"
                    onClick={handleClose}
                  >
                    Close Task
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={handleReassign}
                  disabled={taskData.status === 'CLOSED'}
                >
                  Reassign
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={taskData.status === 'CLOSED'}
                >
                  Cancel Task
                </button>
              </>
            ) : (
              // Manager can only mark as completed
              taskData.status !== 'COMPLETED' && taskData.status !== 'CLOSED' && (
                <button
                  className="btn-save"
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  Mark Completed
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
          setConfirmMessage('');
        }}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
        }}
        message={confirmMessage}
        confirmText="OK"
        cancelText="Cancel"
      />
    </div>
  );
}

export default TaskDetailModal;

