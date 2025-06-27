# Melhorias e Otimizações para o Manga Reader

## 1. Backend (Django) - Melhorias de Performance e Segurança

### A. Melhoria do Sistema de Cache
```python
# settings.py - Configuração de cache mais robusta
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'mangareader',
        'TIMEOUT': 3600,  # 1 hora
    },
    'images': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
        'TIMEOUT': 86400,  # 24 horas para imagens
    }
}
```

### B. Validação de URL Aprimorada
```python
# proxy/views.py - Melhorias na validação
import validators
from urllib.parse import urlparse, urlunparse

class GenericProxyView(APIView):
    ALLOWED_DOMAINS = [
        'cdn.jsdelivr.net',
        'files.catbox.moe',
        'static.wikia.nocookie.net',
        'cdn.myanimelist.net'
    ]
    
    def validate_url(self, url):
        """Validação rigorosa de URLs"""
        if not validators.url(url):
            raise ValueError("URL inválida")
            
        parsed = urlparse(url)
        if parsed.netloc not in self.ALLOWED_DOMAINS:
            raise ValueError("Domínio não permitido")
            
        return url
```

### C. Rate Limiting
```python
# requirements.txt (adicionar)
django-ratelimit==4.1.0

# proxy/views.py
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

@method_decorator(ratelimit(key='ip', rate='100/h', method='GET'), name='get')
class GenericProxyView(APIView):
    # ... resto do código
```

## 2. Frontend (React) - Melhorias de UX e Performance

### A. Componente de Loading Aprimorado
```tsx
// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    message = 'Carregando...', 
    size = 'md' 
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
            <p className="mt-4 text-gray-600">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
```

### B. Sistema de Favoritos Local
```tsx
// hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { Series } from '../types';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('manga-favorites');
        if (stored) {
            setFavorites(JSON.parse(stored));
        }
    }, []);

    const addFavorite = (seriesId: string) => {
        const newFavorites = [...favorites, seriesId];
        setFavorites(newFavorites);
        localStorage.setItem('manga-favorites', JSON.stringify(newFavorites));
    };

    const removeFavorite = (seriesId: string) => {
        const newFavorites = favorites.filter(id => id !== seriesId);
        setFavorites(newFavorites);
        localStorage.setItem('manga-favorites', JSON.stringify(newFavorites));
    };

    const isFavorite = (seriesId: string) => favorites.includes(seriesId);

    return { favorites, addFavorite, removeFavorite, isFavorite };
};
```

### C. Navegação por Teclado no Reader
```tsx
// pages/ReaderPage.tsx - Adicionar ao useEffect
useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            handlePrevPage();
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            handleNextPage();
        }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentPage, pages.length]);
```

### D. Componente de Busca
```tsx
// components/SearchBar.tsx
import React, { useState, useMemo } from 'react';
import { Series } from '../types';

interface SearchBarProps {
    series: Series[];
    onResultSelect: (series: Series) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ series, onResultSelect }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredSeries = useMemo(() => {
        if (!query.trim()) return [];
        
        return series.filter(s => 
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            s.description.toLowerCase().includes(query.toLowerCase())
        );
    }, [query, series]);

    return (
        <div className="relative w-full max-w-md mx-auto">
            <input
                type="text"
                placeholder="Buscar séries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {showResults && filteredSeries.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredSeries.map(series => (
                        <div
                            key={series.id}
                            onClick={() => onResultSelect(series)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                        >
                            <h4 className="font-medium">{series.title}</h4>
                            <p className="text-sm text-gray-600 truncate">{series.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
```

## 3. Melhorias Específicas para Tower of God

### A. Componente de Estatísticas da Série
```tsx
// components/SeriesStats.tsx
import React from 'react';
import { Series } from '../types';

interface SeriesStatsProps {
    series: Series;
}

const SeriesStats: React.FC<SeriesStatsProps> = ({ series }) => {
    const chapterCount = Object.keys(series.chapters || {}).length;
    
    return (
        <div className="bg-gray-100 rounded-lg p-4 mt-4">
            <h3 className="font-semibold mb-2">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-gray-600">Capítulos:</span>
                    <span className="ml-2 font-medium">{chapterCount}</span>
                </div>
                <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">
                        {series.status?.translation === 'completed' ? 'Completo' : 'Em Andamento'}
                    </span>
                </div>
                <div>
                    <span className="text-gray-600">Autor:</span>
                    <span className="ml-2 font-medium">{series.author.name}</span>
                </div>
                <div>
                    <span className="text-gray-600">Ano:</span>
                    <span className="ml-2 font-medium">{series.publication?.year}</span>
                </div>
            </div>
        </div>
    );
};

export default SeriesStats;
```

### B. Sistema de Progresso de Leitura
```tsx
// hooks/useReadingProgress.ts
import { useState, useEffect } from 'react';

interface ReadingProgress {
    [seriesId: string]: {
        lastChapter: string;
        lastPage: number;
        timestamp: number;
    };
}

export const useReadingProgress = () => {
    const [progress, setProgress] = useState<ReadingProgress>({});

    useEffect(() => {
        const stored = localStorage.getItem('reading-progress');
        if (stored) {
            setProgress(JSON.parse(stored));
        }
    }, []);

    const updateProgress = (seriesId: string, chapter: string, page: number) => {
        const newProgress = {
            ...progress,
            [seriesId]: {
                lastChapter: chapter,
                lastPage: page,
                timestamp: Date.now()
            }
        };
        
        setProgress(newProgress);
        localStorage.setItem('reading-progress', JSON.stringify(newProgress));
    };

    const getProgress = (seriesId: string) => progress[seriesId];

    return { progress, updateProgress, getProgress };
};
```

## 4. Melhorias de Acessibilidade

### A. Navegação por Teclado Completa
```tsx
// Adicionar em todos os componentes interativos
onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
    }
}}
tabIndex={0}
role="button"
aria-label="Descrição da ação"
```

### B. Modo Escuro
```tsx
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('theme-preference');
        setIsDark(stored === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <div className={isDark ? 'dark' : ''}>{children}</div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
```

## 5. Otimizações de Performance

### A. Lazy Loading de Imagens
```tsx
// hooks/useLazyImage.ts
import { useState, useRef, useEffect } from 'react';

export const useLazyImage = (src: string) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setImageSrc(src);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src]);

    return { imageSrc, isLoaded, setIsLoaded, imgRef };
};
```

### B. Service Worker para Cache
```javascript
// public/sw.js
const CACHE_NAME = 'manga-reader-v1';
const urlsToCache = [
    '/',
    '/static/css/',
    '/static/js/',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/proxy/')) {
        // Cache de imagens por 24 horas
        event.respondWith(
            caches.open('images-cache').then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((fetchResponse) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});
```

## 6. Configurações de Produção

### A. Dockerfile para Deploy
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### B. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - ALLOWED_HOSTS=localhost,127.0.0.1
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```