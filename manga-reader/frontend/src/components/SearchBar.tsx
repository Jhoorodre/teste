import React, { useState, useMemo } from 'react';
import { Series } from '../types';

interface SearchBarProps {
    seriesList: Series[];
    onResultSelect: (series: Series) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ seriesList, onResultSelect }) => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredSeries = useMemo(() => {
        if (!query.trim()) return [];
        
        return seriesList.filter(s => 
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(query.toLowerCase()))
        );
    }, [query, seriesList]);

    const handleSelect = (series: Series) => {
        setQuery('');
        setShowResults(false);
        onResultSelect(series);
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            <input
                type="text"
                placeholder="Buscar séries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)} // Timeout to allow click on results
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 search-bar-input"
            />
            
            {showResults && filteredSeries.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 search-bar-results">
                    {filteredSeries.map(series => (
                        <div
                            key={series.id}
                            onClick={() => handleSelect(series)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b search-bar-item"
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
