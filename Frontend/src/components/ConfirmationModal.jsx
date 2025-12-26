import './ConfirmationModal.css';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'OK', cancelText = 'Cancel', confirmButtonClass = 'btn-primary' }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleCancel}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="confirmation-modal-header">
            <h3>{title}</h3>
          </div>
        )}
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button className="btn-cancel" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className={confirmButtonClass} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;

