// context/TitleContext.tsx
"use client";


import React, { createContext, useContext, useEffect, useState } from 'react';

interface TitleContextProps {
    title: string;
    setTitle: (title: string) => void;
}

const TitleContext = createContext<TitleContextProps>({
    title: 'Ustatticaret',
    setTitle: () => { },
});

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState('Ustatticaret');

    useEffect(() => {
        const language = navigator.language || 'en';
        const langCode = language.split('-')[0];

        const titles: Record<string, string> = {
            'en': 'Ustatticaret',
            'fa': 'اوستات تجارت',
        };

        setTitle(titles[langCode] || titles['en']);
    }, []);

    return (
        <TitleContext.Provider value={{ title, setTitle }}>
            {children}
        </TitleContext.Provider>
    );
};

export const useTitle = () => useContext(TitleContext);
