import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

<<<<<<< HEAD
export const LanguageProvider = ({ children }) => {
=======
const LanguageProvider = ({ children }) => {
>>>>>>> 9b47020 (solved)
    const [language, setLanguage] = useState('en'); // Default to English

    const switchLanguage = (lang) => {
        if (lang === 'en' || lang === 'si') {
            setLanguage(lang);
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

<<<<<<< HEAD
export const useLanguage = () => useContext(LanguageContext);
=======
const useLanguage = () => useContext(LanguageContext);

export { LanguageProvider, useLanguage };
>>>>>>> 9b47020 (solved)
