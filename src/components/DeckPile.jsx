import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * DeckPile Component
 * Renders a visual stack of cards with 3D layers to represent the physical Tarot deck.
 */
export default function DeckPile({ remainingCount, isShuffling, onShuffle }) {
  const { t } = useLanguage();
  // We render a few visual layers to create a 3D stack height
  const maxVisualLayers = 6;
  const layersCount = Math.min(maxVisualLayers, Math.ceil(remainingCount / 10));

  return (
    <div className="deck-wrapper">
      <div className={`deck-pile ${isShuffling ? 'shuffling' : ''}`}>
        {/* Layered stack of cards for 3D depth */}
        {Array.from({ length: Math.max(1, layersCount) }).map((_, idx) => (
          <div 
            key={idx}
            className="deck-card-layer"
            style={{ 
              '--stack-idx': idx,
              transform: `translate3d(calc(var(--stack-idx) * -1.5px), calc(var(--stack-idx) * -1.5px), calc(var(--stack-idx) * 1px))`
            }}
          >
            <img 
              src={import.meta.env.BASE_URL + 'assets/cards/card-back.jpg'} 
              alt="Tarot Deck Pile"
              className="deck-card-image"
            />
          </div>
        ))}

        {/* Shuffling visual overlay effect */}
        {isShuffling && (
          <div className="shuffle-cards-container">
            <div className="shuffling-card card-left"></div>
            <div className="shuffling-card card-right"></div>
          </div>
        )}

        <div className="deck-overlay-info">
          <span className="deck-count">{remainingCount}</span>
          <span className="deck-label">{t('result.deck_remaining', 'Lá bài còn lại')}</span>
        </div>
      </div>
      
      <button 
        type="button" 
        className="deck-shuffle-btn"
        onClick={onShuffle}
        disabled={isShuffling || remainingCount <= 0}
      >
        {isShuffling ? t('result.shuffling', 'Đang trộn...') : t('result.shuffle_btn', '🎴 Trộn Bài')}
      </button>
    </div>
  );
}
