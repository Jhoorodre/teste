import React from 'react';
import { apiService } from '../services/apiService';

interface ProxiedImageProps {
    src: string | undefined;  // Allow undefined src
    alt: string;
    className?: string;
}

const ProxiedImage: React.FC<ProxiedImageProps> = ({ src, alt, className }) => {
    // Handle undefined/null src early
    if (!src || src.trim() === '') {
        return (
            <img 
                src="https://placehold.co/400x600/1f2937/4b5563?text=No+Image+Available"
                alt={alt}
                className={className}
            />
        );
    }

    // Use the centralized apiService to get the proxy URL
    const proxyUrl = apiService.getImageProxyUrl(src);
    
    return (
        <img 
            src={proxyUrl} 
            alt={alt} 
            className={className}
            onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null; 
                target.src='https://placehold.co/400x600/1f2937/4b5563?text=Image+Not+Found';
            }} 
        />
    );
};

export default ProxiedImage;