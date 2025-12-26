import { useState, useEffect } from 'react';
import './InputModal.css';

function InputModal({ isOpen, onClose, onConfirm, title, message, placeholder = '', confirmText = 'OK', cancelText = 'Cancel', defaultValue = '' }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      onClose();
      setInputValue('');
    }
  };

  const handleCancel = () => {
    onClose();
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="input-modal-overlay" onClick={handleCancel}>
      <div className="input-modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="input-modal-header">
            <h3>{title}</h3>
          </div>
        )}
        <div className="input-modal-body">
          {message && <p>{message}</p>}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className="input-modal-input"
          />
        </div>
        <div className="input-modal-footer">
          <button className="btn-cancel" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!inputValue.trim()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputModal;

