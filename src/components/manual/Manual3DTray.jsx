import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function Manual3DTray({
  pickCount,
  selectedIds,
  drawnCards,
  onSelectCard,
}) {
  const { language } = useLanguage();

  return (
    <div className="manual-3d-deck-stage">
      {/* Top 3D Floating Slot Tray */}
      <div className="manual-3d-tray" style={{ margin: '0 auto 24px' }}>
        <div className="manual-3d-tray-header">
          <div className="manual-3d-tray-title">
            ✨ {language === 'en' ? 'YOUR CHOSEN CARDS TRAY' : 'KHAY LÁ BÀI ĐÃ CHỌN'} ({selectedIds.length}/{pickCount})
          </div>
        </div>

        <div className="manual-3d-slots-container">
          {Array.from({ length: pickCount }).map((_, idx) => {
            const cardId = selectedIds[idx];
            const isFilled = !!cardId;
            const drawnCard = drawnCards[idx];
            const isRev = drawnCard?.orientation === 'reversed';

            return (
              <div
                key={idx}
                className={`manual-3d-slot-box${isFilled ? ' filled' : ''}`}
                style={{ cursor: drawnCard ? 'pointer' : 'default' }}
                onClick={() => drawnCard && onSelectCard(drawnCard)}
              >
                {isFilled && drawnCard ? (
                  <div className="manual-3d-slot-flip flipped">
                    {/* Back Face */}
                    <div className="manual-3d-slot-face back">
                      <img
                        src={`${import.meta.env.BASE_URL}assets/cards/card-back.jpg`}
                        alt="Drawn Tarot Card"
                        className="manual-3d-slot-card-img"
                      />
                      <div className="manual-card-selected-badge">{idx + 1}</div>
                    </div>

                    {/* Front Face (Flipped Open Immediately on Tray) */}
                    <div className="manual-3d-slot-face front" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 4 }}>
                      <div className="manual-card-selected-badge" style={{ top: 4 }}>{idx + 1}</div>
                      <img
                        src={`${import.meta.env.BASE_URL}${drawnCard.image.replace(/^\//, '')}`}
                        alt={drawnCard.name}
                        className={`manual-3d-slot-card-img${isRev ? ' reversed' : ''}`}
                        style={{ height: '75%', objectFit: 'cover' }}
                      />
                      <div style={{ textAlign: 'center', width: '100%', padding: '2px 0' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {drawnCard.name}
                        </div>
                        <span className={`card-orientation-badge ${drawnCard.orientation}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                          {isRev ? (language === 'en' ? 'Reversed' : 'Ngược') : (language === 'en' ? 'Upright' : 'Xuôi')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="manual-3d-slot-num">{language === 'en' ? `Card ${idx + 1}` : `Lá ${idx + 1}`}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
