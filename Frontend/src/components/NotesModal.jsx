import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import inventoryService from '../services/inventoryService';
import './RemarksModal.css';

function NotesModal({ isOpen, onClose, item }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (isOpen && item) {
      // Load notes from item data
      if (item.notes && Array.isArray(item.notes)) {
        // Sort notes by timestamp (newest first)
        const sortedNotes = [...item.notes].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        setNotes(sortedNotes);
      } else {
        setNotes([]);
      }
      setNewNote('');
      setError('');
    }
  }, [isOpen, item]);

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

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError('Please enter a note');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updatedItem = await inventoryService.addNote(item._id, newNote.trim());
      
      // Update notes from the response
      if (updatedItem.notes && Array.isArray(updatedItem.notes)) {
        const sortedNotes = [...updatedItem.notes].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        setNotes(sortedNotes);
      }
      
      setNewNote('');
      
      // Notify parent to refresh item data
      if (onClose) {
        onClose(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
      console.error('Error adding note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setDeletingId(noteId);
    setError('');

    try {
      const updatedItem = await inventoryService.deleteNote(item._id, noteId);
      
      // Update notes from the response
      if (updatedItem.notes && Array.isArray(updatedItem.notes)) {
        const sortedNotes = [...updatedItem.notes].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        setNotes(sortedNotes);
      }
      
      // Notify parent to refresh item data
      if (onClose) {
        onClose(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete note');
      console.error('Error deleting note:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (!isOpen || !item) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getItemDisplayName = () => {
    if (item.location) return item.location;
    if (item.type) return item.type;
    return 'Inventory Item';
  };

  return (
    <div className="remarks-modal-overlay" onClick={() => onClose(false)}>
      <div className="remarks-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="remarks-modal-header">
          <h2>Notes Timeline</h2>
          <button className="remarks-close-button" onClick={() => onClose(false)}>×</button>
        </div>

        <div className="remarks-modal-body">
          {/* Item Information */}
          <div className="lead-info-section">
            <div className="lead-avatar">
              {getInitials(getItemDisplayName())}
            </div>
            <div className="lead-details">
              <div className="lead-name-row">
                <h3>{getItemDisplayName()}</h3>
              </div>
              {item.location && <p className="lead-contact">{item.location}</p>}
            </div>
          </div>

          {/* Notes Timeline */}
          <div className="remarks-timeline">
            {notes.length === 0 ? (
              <div className="no-remarks">
                <p>No notes yet. Add the first note below.</p>
              </div>
            ) : (
              <div className="timeline-container">
                <div className="timeline-line"></div>
                {notes.map((note, index) => (
                  <div key={note._id || index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5.4px' }}>
                        <div className="remark-date">
                          {formatDateTime(note.timestamp || note.createdAt)}
                        </div>
                        <button
                          className="cancel-add-button"
                          onClick={() => handleDeleteNote(note._id)}
                          disabled={deletingId === note._id}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            fontSize: '14px',
                            padding: 0,
                            flexShrink: 0
                          }}
                          title="Delete note"
                        >
                          {deletingId === note._id ? '...' : '×'}
                        </button>
                      </div>
                      <div className="remark-text">{note.text}</div>
                      <div className="remark-author">
                        Added by: {note.addedBy?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Section */}
          <div className="add-remark-section">
            {error && <div className="remark-error">{error}</div>}
            <div className="add-remark-input-group">
              <input
                type="text"
                className="remark-input"
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={submitting}
              />
              <button
                className="add-remark-button"
                onClick={handleAddNote}
                disabled={submitting || !newNote.trim()}
              >
                {submitting ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesModal;

