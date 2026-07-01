import React from 'react';

/**
 * WeightControls Component
 * Manages slider and numerical inputs for category weights with presets.
 */
export default function WeightControls({ weights, onChange, onPresetSelect }) {
  const categories = [
    { key: 'major', label: 'Major Arcana (Ẩn Chính)', color: '#d4af37' },
    { key: 'cups', label: 'Cups (Cốc - Cảm xúc)', color: '#4a90e2' },
    { key: 'pentacles', label: 'Pentacles (Tiền - Vật chất)', color: '#2ecc71' },
    { key: 'swords', label: 'Swords (Kiếm - Trí tuệ)', color: '#9b59b6' },
    { key: 'wands', label: 'Wands (Gậy - Hành động)', color: '#e67e22' }
  ];

  const presets = [
    { 
      name: 'Mặc định (Đều)', 
      values: { major: 20, cups: 20, pentacles: 20, swords: 20, wands: 20 } 
    },
    { 
      name: 'Chỉ Ẩn Chính (Major)', 
      values: { major: 100, cups: 0, pentacles: 0, swords: 0, wands: 0 } 
    },
    { 
      name: 'Chỉ Ẩn Phụ (Minor)', 
      values: { major: 0, cups: 25, pentacles: 25, swords: 25, wands: 25 } 
    },
    { 
      name: 'Thiên về Ẩn Chính', 
      values: { major: 50, cups: 12.5, pentacles: 12.5, swords: 12.5, wands: 12.5 } 
    },
    { 
      name: 'Thiên về Cảm xúc (Cups)', 
      values: { major: 15, cups: 55, pentacles: 10, swords: 10, wands: 10 } 
    },
    { 
      name: 'Thiên về Vật chất (Pentacles)', 
      values: { major: 15, cups: 10, pentacles: 55, swords: 10, wands: 10 } 
    }
  ];

  const handleSliderChange = (key, val) => {
    onChange({
      ...weights,
      [key]: parseFloat(val)
    });
  };

  const handleResetWeights = () => {
    onChange({ major: 20, cups: 20, pentacles: 20, swords: 20, wands: 20 });
  };

  // Calculate percentages for visual feedback
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const getPercent = (val) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="weight-settings-card">
      <div className="card-header-flex">
        <h3 className="settings-title">Cài đặt trọng số nhóm bài</h3>
        <button 
          type="button" 
          className="reset-weights-btn"
          onClick={handleResetWeights}
        >
          Đặt lại đều
        </button>
      </div>
      <p className="settings-subtitle">Điều chỉnh xác suất rút bài cho từng Arcana/Suit</p>

      {/* Preset Badges */}
      <div className="presets-container">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            className="preset-badge-btn"
            onClick={() => onPresetSelect(preset.values)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Sliders list */}
      <div className="weight-sliders-list">
        {categories.map(({ key, label, color }) => {
          const val = weights[key];
          const pct = getPercent(val);

          return (
            <div key={key} className="slider-item">
              <div className="slider-meta">
                <span className="slider-label" style={{ '--accent-color': color }}>
                  <span className="color-dot" style={{ backgroundColor: color }}></span>
                  {label}
                </span>
                <span className="slider-value">
                  {val} ({pct}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={val}
                onChange={(e) => handleSliderChange(key, e.target.value)}
                className="custom-range-slider"
                style={{ '--track-fill': `${pct}%`, '--thumb-color': color }}
              />
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <div className="error-alert">
          Cảnh báo: Tổng trọng số bằng 0! Hãy điều chỉnh ít nhất một nhóm để tiếp tục rút bài.
        </div>
      )}
    </div>
  );
}
