import React from 'react';
import { apiService } from '../services/apiService';
import { useLazyImage } from '../hooks/useLazyImage'; // Importar

interface ProxiedImageProps {
    src: string | undefined;  // Allow undefined src
    alt: string;
    className?: string;
    isLazy?: boolean; // Adicionar prop para controlar o lazy loading
}

const ProxiedImage: React.FC<ProxiedImageProps> = ({ src, alt, className, isLazy = true }) => {
    const { imageSrc, imageRef } = useLazyImage(src);

    // Se o lazy loading estiver desativado, carregue a imagem diretamente.
    if (!isLazy) {
        const directProxyUrl = apiService.getImageProxyUrl(src);
        return <img src={directProxyUrl} alt={alt} className={className} />;
    }

    // Lógica do lazy loading
    const proxiedSrc = imageSrc ? apiService.getImageProxyUrl(imageSrc) : '';
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // 1x1 pixel transparente

    return (
        <img
            ref={imageRef}
            src={proxiedSrc || placeholder}
            alt={alt}
            className={`${className} ${!proxiedSrc ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; 
                target.src='https://placehold.co/400x600/1f2937/4b5563?text=Image+Not+Found';
            }} 
        />
    );
};

export default ProxiedImage;
