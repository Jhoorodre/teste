import { useState, useEffect, useCallback } from 'react';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('manga-favorites');
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to parse favorites from localStorage", error);
        }
    }, []);

    const addFavorite = useCallback((seriesId: string) => {
        setFavorites(prev => {
            const newFavorites = [...prev, seriesId];
            localStorage.setItem('manga-favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const removeFavorite = useCallback((seriesId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.filter(id => id !== seriesId);
            localStorage.setItem('manga-favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const isFavorite = useCallback((seriesId: string) => favorites.includes(seriesId), [favorites]);

    return { favorites, addFavorite, removeFavorite, isFavorite };
};
