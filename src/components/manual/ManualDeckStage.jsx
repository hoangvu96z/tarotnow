import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function ManualDeckStage({
  tarotCards,
  filteredShuffledOrder,
  selectedIds,
  pickCount,
  viewStyle,
  setViewStyle,
  isShufflingDeck,
  onShuffleDeck,
  onPickCard,
  weights,
  setWeights,
  onOpenWeightModal,
}) {
  const { language } = useLanguage();

  return (
    <div className="manual-picking-phase manual-3d-deck-stage">
      {/* Sticky Progress & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: 1200,
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <p className="manual-pick-instruction" style={{ margin: 0, textAlign: 'left' }}>
          {selectedIds.length < pickCount
            ? (language === 'en'
                ? `Follow your intuition — pick ${pickCount - selectedIds.length} more card${pickCount - selectedIds.length > 1 ? 's' : ''}`
                : `Hãy theo trực giác — chọn thêm ${pickCount - selectedIds.length} lá nữa`)
            : (language === 'en' ? '✨ Processing cards...' : '✨ Đang giải mã bài...')}
        </p>

        <div className="manual-view-modes">
          <button
            type="button"
            className={`manual-view-btn${viewStyle === 'fan' ? ' active' : ''}`}
            onClick={() => setViewStyle('fan')}
          >
            🌟 {language === 'en' ? '3D Fan Arc' : 'Vòm Bài 3D'}
          </button>
          <button
            type="button"
            className={`manual-view-btn${viewStyle === 'grid' ? ' active' : ''}`}
            onClick={() => setViewStyle('grid')}
          >
            🎴 {language === 'en' ? '3D Grid Deck' : 'Lưới Bài 3D'}
          </button>
        </div>
      </div>

      {/* RED VELVET TAROT READING MAT — STRAIGHT HORIZONTAL DECK SPREAD */}
      <div className="tarot-red-cloth-mat">
        {/* VIEW MODE 1: STRAIGHT HORIZONTAL 3D DECK RIBBON */}
        {viewStyle === 'fan' && (
          <div className="manual-3d-fan-stage-wrapper" style={{ overflow: 'hidden', padding: '30px 0 20px' }}>
            <div className={`manual-3d-fan-arc${isShufflingDeck ? ' shuffling' : ''}`} style={{ height: 180, maxWidth: 1200 }}>
              {filteredShuffledOrder.map((cardIdx, i) => {
                const card = tarotCards[cardIdx];
                if (!card) return null;
                const isSelected = selectedIds.includes(card.id) || selectedIds.includes(cardIdx);
                // Selected cards disappear from deck immediately
                if (isSelected) return null;

                const total = filteredShuffledOrder.filter(cIdx => {
                  const c = tarotCards[cIdx];
                  return c && !selectedIds.includes(c.id) && !selectedIds.includes(cIdx);
                }).length;

                // Straight horizontal linear positioning across full 1140px width of red mat
                const stageWidth = 1100;
                const cardWidth = 72;
                const step = total > 1 ? (stageWidth - cardWidth) / (total - 1) : 0;
                const xOffset = total > 1 ? -(stageWidth - cardWidth) / 2 + i * step : 0;
                const zOffset = i * 0.2;

                const styleTransform = `translate3d(${xOffset}px, 0px, ${zOffset}px)`;

                return (
                  <div
                    key={card.id || cardIdx}
                    className="manual-3d-fan-card"
                    style={{
                      transform: styleTransform,
                      zIndex: i + 1,
                      transformOrigin: 'center center',
                      '--x-shift': `${(i % 2 === 0 ? 1 : -1) * 30}px`,
                    }}
                    onClick={() => selectedIds.length < pickCount && onPickCard(card.id)}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}assets/cards/card-back.jpg`}
                      alt="Tarot card"
                      className="manual-card-back-img"
                      loading="lazy"
                    />
                    <div className="manual-card-hover-glow" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: 3D GRID FLOW */}
        {viewStyle === 'grid' && (
          <div className={`manual-card-grid${isShufflingDeck ? ' shuffling' : ''}`} style={{ width: '100%', maxWidth: 1200 }}>
            {filteredShuffledOrder.map((cardIdx) => {
              const card = tarotCards[cardIdx];
              if (!card) return null;
              const isSelected = selectedIds.includes(card.id) || selectedIds.includes(cardIdx);
              if (isSelected) return null;

              return (
                <div
                  key={card.id || cardIdx}
                  className="manual-card-slot manual-3d-card-item"
                  onClick={() => selectedIds.length < pickCount && onPickCard(card.id)}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}assets/cards/card-back.jpg`}
                    alt="Tarot card"
                    className="manual-card-back-img"
                    loading="lazy"
                  />
                  <div className="manual-card-hover-glow" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTROL BUTTONS: SHUFFLE & WEIGHT SETTINGS (1 HORIZONTAL ROW) */}
      <div className="manual-deck-controls-row">
        <button
          type="button"
          className="manual-action-btn primary"
          onClick={onShuffleDeck}
          disabled={isShufflingDeck}
        >
          🔀 {language === 'en' ? 'Shuffle Deck' : 'Trộn Bài'}
        </button>
        {weights && setWeights && (
          <button
            type="button"
            className="manual-action-btn secondary"
            onClick={onOpenWeightModal}
          >
            ⚖️ {language === 'en' ? 'Weight Settings' : 'Trọng Số Bài'}
          </button>
        )}
      </div>
    </div>
  );
}
