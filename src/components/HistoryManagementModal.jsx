import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SPREADS } from '../utils/tarotLogic';

export default function HistoryManagementModal({
  isOpen,
  onClose,
  history = [],
  tarotCards = [],
  onSelect,
  onDeleteMultiple,
  onClearAll,
}) {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const formatSpreadName = (item) => {
    if (!item) return '';
    return item.spreadId
      ? t('spread.name.' + item.spreadId, item.spreadName)
      : item.spreadName === 'Tùy chỉnh' || item.spreadName === 'Custom'
      ? t('history.custom', 'Tùy chỉnh')
      : item.spreadName || 'Trải bài';
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter((item) => {
      const spreadName = formatSpreadName(item).toLowerCase();
      const question = (item.question || '').toLowerCase();
      return spreadName.includes(term) || question.includes(term);
    });
  }, [history, searchTerm, language]);

  if (!isOpen) return null;

  const isAllSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map((item) => item.id)));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmMsg = t(
      'history.confirm_delete_selected',
      `Bạn có chắc chắn muốn xóa ${count} trải bài đã chọn không?`
    );
    if (window.confirm(confirmMsg)) {
      const itemsToDelete = history.filter((h) => selectedIds.has(h.id));
      onDeleteMultiple(itemsToDelete);
      setSelectedIds(new Set());
    }
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    const confirmMsg = t(
      'history.confirm_clear',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trải bài không?'
    );
    if (window.confirm(confirmMsg)) {
      onClearAll();
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (item) => {
    if (onSelect) onSelect(item);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 3, 15, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #130a2a 0%, #090417 100%)',
          border: '1px solid rgba(229, 193, 88, 0.3)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          color: '#e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(229, 193, 88, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #090615 0%, #1a103c 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>🎴</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  color: '#e5c158',
                }}
              >
                {t('history.manage_title', 'Quản lý Lịch sử Trải Bài')}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                {t('history.total_count', `Tổng số: ${history.length} lần trải bài`)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(229,193,88,0.2)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#e5c158',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Search + Bulk Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(229, 193, 88, 0.15)',
            background: 'rgba(229, 193, 88, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Search box */}
          <input
            type="text"
            placeholder={t(
              'history.search_placeholder',
              '🔍 Tìm kiếm theo tên bài hoặc câu hỏi...'
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid rgba(229, 193, 88, 0.25)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Action toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#e5c158',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                disabled={filteredHistory.length === 0}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              {t('history.select_all', 'Chọn tất cả')} ({filteredHistory.length})
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #ff6b6b',
                    background: 'rgba(255, 107, 107, 0.15)',
                    color: '#ff8e8e',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  🗑️ {t('history.delete_selected', `Xóa (${selectedIds.size}) mục`)}
                </button>
              )}

              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 107, 107, 0.4)',
                    background: 'transparent',
                    color: '#ff8e8e',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚠️ {t('history.clear_all', 'Xóa tất cả')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {filteredHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255,255,255,0.5)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
              }}
            >
              {searchTerm
                ? t('history.no_search_results', 'Không tìm thấy bài trải phù hợp')
                : t('history.empty', 'Chưa có trải bài nào được lưu')}
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isChecked = selectedIds.has(item.id);
              const spreadName = formatSpreadName(item);

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: isChecked
                      ? '1px solid #e5c158'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isChecked
                      ? 'rgba(229, 193, 88, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSelectOne(item.id)}
                    style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                  />

                  {/* Info Column */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: onSelect ? 'pointer' : 'default' }}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#e5c158',
                          fontFamily: "'Cinzel', serif",
                        }}
                      >
                        {spreadName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {item.timestamp}
                      </span>
                    </div>

                    {item.question && (
                      <p
                        style={{
                          margin: '0 0 6px 0',
                          fontSize: '0.8rem',
                          color: 'rgba(255,255,255,0.75)',
                          fontStyle: 'italic',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        "{item.question}"
                      </p>
                    )}

                    {/* Cards Badges */}
                    {item.cards && item.cards.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                        }}
                      >
                        {item.cards.map((cHist, idx) => {
                          const card = tarotCards.find((tc) => tc.id === cHist.id);
                          const cardNameTrans = card ? card.name : cHist.name;
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background:
                                  cHist.orientation === 'reversed'
                                    ? 'rgba(255, 107, 107, 0.15)'
                                    : 'rgba(229, 193, 88, 0.12)',
                                border:
                                  cHist.orientation === 'reversed'
                                    ? '1px solid rgba(255, 107, 107, 0.3)'
                                    : '1px solid rgba(229, 193, 88, 0.25)',
                                color:
                                  cHist.orientation === 'reversed'
                                    ? '#ff8e8e'
                                    : '#e5c158',
                              }}
                            >
                              {cardNameTrans}{' '}
                              {cHist.orientation === 'reversed' ? '↓' : '↑'}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
