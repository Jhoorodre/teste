import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { HubData, Series } from '../types';
import ProxiedImage from '../components/ProxiedImage';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar'; // Importar

const HubPage: React.FC = () => {
    const [hubData, setHubData] = useState<HubData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHubData = async () => {
            try {
                const data = await apiService.getHubData();
                setHubData(data);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHubData();
    }, []);

    const handleSearchResultSelect = (series: Series) => {
        navigate(`/series/${series.slug}`, { state: { series } });
    };

    const seriesToDisplay = useMemo(() => {
        if (!hubData?.series) return [];
        if (!searchQuery.trim()) return hubData.series;

        return hubData.series.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [hubData, searchQuery]);

    if (loading) return <LoadingSpinner message="Carregando o hub de mangás..." />;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!hubData || !hubData.hub || !hubData.series) {
        return <div className="text-center p-8">No hub data available.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center my-8">{hubData.hub.title}</h1>
            
            {/* Adicionar a SearchBar aqui */}
            <div className="mb-8">
                <SearchBar seriesList={hubData.series} onResultSelect={handleSearchResultSelect} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {hubData.series.map((series: Series) => ( // Mapear a lista original para a busca
                    <Link 
                        to={`/series/${series.slug}`} 
                        key={series.id} 
                        className="border rounded-lg p-4 hover:shadow-lg"
                        state={{ series: series }}
                    >
                        <ProxiedImage src={series.cover.url} alt={series.cover.alt} className="w-full h-auto rounded-md"/>
                        <h2 className="text-xl font-semibold mt-2">{series.title}</h2>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default HubPage;
