import React, { useState } from 'react';
import { parseDocumentFile } from '../services/documentService';

export default function DocumentTranslator({ isOpen, onClose, onExtractedText, onShowToast }) {
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleProcessFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await parseDocumentFile(file);
      onExtractedText(text);
      if (onShowToast) {
        onShowToast(`Document "${file.name}" loaded successfully!`, 'success');
      }
      onClose();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to read document.', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>📄 Upload Document</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Upload a text document (.txt, .pdf, .docx) to extract its contents for translation. (Max size: 10MB)
          </p>

          <div
            className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="dropzone-loading">
                <span className="spinner">⚡</span>
                <p>Parsing document text...</p>
              </div>
            ) : (
              <>
                <div className="dropzone-icon">📄</div>
                <p className="dropzone-text">
                  <strong>Drag & Drop Document Here</strong> or click to select
                </p>
                <span className="file-types">Supports TXT, PDF, DOCX (Max 10 MB)</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
