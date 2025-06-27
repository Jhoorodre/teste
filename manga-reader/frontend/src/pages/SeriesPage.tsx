import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Series, Chapter } from '../types';
import ProxiedImage from '../components/ProxiedImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../hooks/useFavorites';
import { useReadingProgress } from '../hooks/useReadingProgress';
import SeriesStats from '../components/SeriesStats';

const SeriesPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    
    const seriesSummary = location.state?.series as Series | undefined;

    const [seriesDetails, setSeriesDetails] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { getProgress } = useReadingProgress();

    const seriesDataUrl = seriesSummary?.data?.url;

    useEffect(() => {
        if (seriesDataUrl) {
            const fetchSeriesDetails = async () => {
                setLoading(true);
                setError(null);
                try {
                    const details = await apiService.getSeriesData(seriesDataUrl);
                    setSeriesDetails(details);
                } catch (err: any) {
                    setError(err.message || 'Failed to load series details.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSeriesDetails();
        } else if (seriesSummary) {
            setLoading(false);
        }
    }, [seriesDataUrl]);

    // --- CORE FIX ---
    // Handle the case where the user navigates directly to this page
    // or the state hasn't arrived yet.
    if (!seriesSummary) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-red-500">Series data not found. Please navigate from the Hub.</p>
                <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">&larr; Go back to Hub</Link>
            </div>
        );
    }
    // --- END OF FIX ---

    // Display loading or error states
    if (loading) return <LoadingSpinner message="Carregando detalhes da série..." />;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    // 4. Combine the summary and detailed data for rendering
    const finalSeriesData = { ...seriesSummary, ...seriesDetails };
    const chapterEntries = Object.entries(finalSeriesData.chapters || {});
    const isCurrentlyFavorite = isFavorite(finalSeriesData.id);
    const readingProgress = getProgress(finalSeriesData.id);

    const handleFavoriteClick = () => {
        if (isCurrentlyFavorite) {
            removeFavorite(finalSeriesData.id);
        } else {
            addFavorite(finalSeriesData.id);
        }
    };

    const handleContinueReading = () => {
        if (readingProgress) {
            navigate(`/series/${slug}/chapter/${readingProgress.lastChapter}`, {
                state: { series: finalSeriesData }
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Link to="/" className="text-blue-500 hover:underline">&larr; Back to Hub</Link>
            <div className="flex flex-col md:flex-row items-center my-8">
                <ProxiedImage src={finalSeriesData.cover.url} alt={finalSeriesData.cover.alt} className="w-48 h-auto rounded-lg shadow-lg mr-8"/>
                <div>
                    <div className="flex items-center">
                        <h1 className="text-4xl font-bold">{finalSeriesData.title}</h1>
                        <button 
                            onClick={handleFavoriteClick}
                            className={`ml-4 p-2 rounded-full transition-colors ${isCurrentlyFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}
                            aria-label={isCurrentlyFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-lg text-gray-600">{finalSeriesData.author.name}</p>
                    <p className="mt-4">{finalSeriesData.description}</p>
                    <SeriesStats series={finalSeriesData} />
                    {readingProgress && (
                        <button
                            onClick={handleContinueReading}
                            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Continuar do Cap. {readingProgress.lastChapter}, Pág. {readingProgress.lastPage + 1}
                        </button>
                    )}
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Chapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapterEntries.length > 0 ? (
                    chapterEntries.map(([chapterNumber, chapterData]: [string, Chapter]) => {
                        const isLastRead = readingProgress?.lastChapter === chapterNumber;
                        return (
                            <Link 
                                to={`/series/${slug}/chapter/${chapterNumber}`}
                                key={chapterNumber} 
                                className={`border p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative ${isLastRead ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-700'}`}
                                state={{ series: finalSeriesData }}
                            >
                                {isLastRead && <span className="absolute top-1 right-1 text-xs bg-blue-500 text-white px-2 py-1 rounded">Último lido</span>}
                                <h3 className="font-semibold">{chapterData.title}</h3>
                            </Link>
                        );
                    })
                ) : (
                    <p>No chapters available for this series yet.</p>
                )}
            </div>
        </div>
    );
};

export default SeriesPage;
