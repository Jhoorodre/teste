import { useState, useEffect, useCallback } from 'react';

export interface ReadingProgress {
    [seriesId: string]: {
        lastChapter: string;
        lastPage: number;
        timestamp: number;
    };
}

export const useReadingProgress = () => {
    const [progress, setProgress] = useState<ReadingProgress>({});

    useEffect(() => {
        try {
            const stored = localStorage.getItem('reading-progress');
            if (stored) {
                setProgress(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to parse reading progress from localStorage", error);
        }
    }, []);

    const updateProgress = useCallback((seriesId: string, chapter: string, page: number) => {
        setProgress(prev => {
            const newProgress = {
                ...prev,
                [seriesId]: {
                    lastChapter: chapter,
                    lastPage: page,
                    timestamp: Date.now()
                }
            };
            localStorage.setItem('reading-progress', JSON.stringify(newProgress));
            return newProgress;
        });
    }, []);

    const getProgress = useCallback((seriesId: string) => progress[seriesId], [progress]);

    return { progress, updateProgress, getProgress };
};
