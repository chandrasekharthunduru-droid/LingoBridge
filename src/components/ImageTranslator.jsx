import React, { useState } from 'react';
import { extractTextFromImage } from '../services/ocrService';

export default function ImageTranslator({ isOpen, onClose, onExtractedText, onShowToast }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleProcessFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const extractedText = await extractTextFromImage(file, (p) => setProgress(p));
      onExtractedText(extractedText);
      if (onShowToast) {
        onShowToast('Text extracted successfully from image!', 'success');
      }
      onClose();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to extract text from image.', 'danger');
      }
    } finally {
      setLoading(false);
      setProgress(0);
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
          <h3>📷 Translate Image (OCR)</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Upload an image containing text (JPG, JPEG, PNG, WEBP) to extract and translate its content.
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
                <p>Extracting text from image... {progress > 0 ? `${progress}%` : ''}</p>
              </div>
            ) : (
              <>
                <div className="dropzone-icon">📷</div>
                <p className="dropzone-text">
                  <strong>Drag & Drop Image Here</strong> or click to browse
                </p>
                <span className="file-types">Supports JPG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
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
