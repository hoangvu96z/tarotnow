import React, { useState, useEffect } from 'react';

/**
 * 3D Tarot Card Component
 * Supports 3D flipping, mouse hover parallax tilt, and reversed orientation rotation.
 */
export default function Card3D({ 
  card, 
  index, 
  revealDelay = 0, 
  onCardClick 
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { image, name, orientation, arcana, suit, drawPosition, uprightKeywords, reversedKeywords } = card;
  
  useEffect(() => {
    // Staggered auto-flip when the card is dealt
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 800 + revealDelay); // Wait for dealing animation to finish first
    
    return () => clearTimeout(timer);
  }, [revealDelay]);

  // Handle the mousemove hover 3D tilt effect
  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    
    const x = e.clientX - rect.left; // X position inside card
    const y = e.clientY - rect.top;  // Y position inside card
    
    const w = rect.width;
    const h = rect.height;
    
    // Calculate values from -1 to 1 based on center of card
    const normX = (x / w) * 2 - 1;
    const normY = (y / h) * 2 - 1;
    
    // Tilt limit in degrees
    const maxTilt = 15; 
    
    const tiltX = -normY * maxTilt;
    const tiltY = normX * maxTilt;
    
    el.style.setProperty('--rx', `${tiltX}deg`);
    el.style.setProperty('--ry', `${tiltY}deg`);
    
    // Translate effect for card glow shimmer
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
  };

  const handleMouseLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const isReversed = orientation === 'reversed';
  const keywords = isReversed ? reversedKeywords : uprightKeywords;

  return (
    <div 
      className="card-container" 
      style={{ '--index': index }}
      onClick={() => onCardClick(card)}
    >
      {drawPosition && (
        <div className="card-position-badge">
          Vị trí {drawPosition}
        </div>
      )}
      
      <div 
        className={`card-3d ${isFlipped ? 'flipped' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Front Face (shows tarot illustration) */}
        <div className={`card-face card-front ${isReversed ? 'reversed' : ''}`}>
          <div className="card-inner-border">
            <img 
              src={image} 
              alt={name} 
              loading="lazy" 
              className="card-image"
            />
            {/* Shimmer light effect */}
            <div className="card-shimmer"></div>
            
            {/* Info overlay on hover */}
            <div className="card-hover-overlay">
              <span className="card-type-label">
                {arcana} {suit ? `• ${suit}` : ''}
              </span>
              <h3 className="card-overlay-title">{name}</h3>
              <div className="card-keywords-container">
                {keywords.map((kw, i) => (
                  <span key={i} className="card-kw-badge">{kw}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back Face (shows beautiful golden mystical pattern) */}
        <div className="card-face card-back">
          <div className="card-inner-border">
            <img 
              src="/assets/cards/card-back.jpg" 
              alt="Tarot Card Back" 
              loading="lazy"
              className="card-image"
            />
            <div className="card-back-pattern"></div>
          </div>
        </div>
      </div>

      <div className="card-info-footer">
        <h4 className="card-name-text">{name}</h4>
        <span className={`card-orientation-badge ${orientation}`}>
          {isReversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)'}
        </span>
      </div>
    </div>
  );
}
