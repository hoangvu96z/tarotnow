import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import WeightControls from '../WeightControls';

export default function WeightSettingsModal({
  isOpen,
  onClose,
  weights,
  setWeights,
}) {
  const { language } = useLanguage();

  if (!isOpen || !weights || !setWeights) return null;

  return (
    <div className="card-modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="weight-modal-container glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="weight-modal-header">
          <h3 className="weight-modal-title">
            ⚖️ {language === 'en' ? 'Arcana & Suit Weight Settings' : 'Cài Đặt Trọng Số Nhóm Bài'}
          </h3>
          <button
            type="button"
            className="weight-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <WeightControls
          weights={weights}
          onChange={setWeights}
          onPresetSelect={setWeights}
        />
      </div>
    </div>
  );
}
