import { useState, useRef, useEffect } from 'react';

const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // 10% of the image is visible
};

export const useLazyImage = (src: string | undefined) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        let observer: IntersectionObserver;

        if (imageRef.current && src) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            observer.observe(imageRef.current);
        }

        return () => {
            if (observer && imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, [src]);

    return { imageSrc, imageRef };
};
