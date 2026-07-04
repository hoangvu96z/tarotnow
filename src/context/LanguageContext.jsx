import React, { createContext, useContext, useState, useEffect } from 'react';
import { vi } from '../data/translations/vi';
import { en } from '../data/translations/en';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('tarot_language');
    return saved === 'en' ? 'en' : 'vi';
  });

  useEffect(() => {
    localStorage.setItem('tarot_language', language);
  }, [language]);

  const translations = language === 'en' ? en : vi;

  // Translation helper function
  const t = (key, defaultValue = '') => {
    return translations[key] || defaultValue || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
