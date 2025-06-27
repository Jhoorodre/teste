import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Series, Chapter } from '../types';
import ProxiedImage from '../components/ProxiedImage';

const SeriesPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    
    const seriesSummary = location.state?.series as Series | undefined;

    const [seriesDetails, setSeriesDetails] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) return <div className="text-center p-8">Loading chapters...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    const finalSeriesData = { ...seriesSummary, ...seriesDetails };
    const chapterEntries = Object.entries(finalSeriesData.chapters || {});

    return (
        <div className="container mx-auto p-4">
            <Link to="/" className="text-blue-500 hover:underline">&larr; Back to Hub</Link>
            <div className="flex flex-col md:flex-row items-center my-8">
                <ProxiedImage src={finalSeriesData.cover.url} alt={finalSeriesData.cover.alt} className="w-48 h-auto rounded-lg shadow-lg mr-8"/>
                <div>
                    <h1 className="text-4xl font-bold">{finalSeriesData.title}</h1>
                    <p className="text-lg text-gray-600">{finalSeriesData.author.name}</p>
                    <p className="mt-4">{finalSeriesData.description}</p>
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Chapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapterEntries.length > 0 ? (
                    chapterEntries.map(([chapterNumber, chapterData]: [string, Chapter]) => (
                        <Link 
                            to={`/series/${slug}/chapter/${chapterNumber}`}
                            key={chapterNumber} 
                            className="border p-4 rounded-lg hover:bg-gray-100"
                            state={{ series: finalSeriesData }}
                        >
                            <h3 className="font-semibold">{chapterData.title}</h3>
                        </Link>
                    ))
                ) : (
                    <p>No chapters available for this series yet.</p>
                )}
            </div>
        </div>
    );
};

export default SeriesPage;
