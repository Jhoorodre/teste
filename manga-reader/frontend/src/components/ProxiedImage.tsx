import React from 'react';
import { apiService } from '../services/apiService';

interface ProxiedImageProps {
    src: string;
    alt: string;
    className?: string;
}

const ProxiedImage: React.FC<ProxiedImageProps> = ({ src, alt, className }) => {
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
