import React from 'react';
import { Series } from '../types';

interface SeriesStatsProps {
    series: Series;
}

const SeriesStats: React.FC<SeriesStatsProps> = ({ series }) => {
    // O hub.json tem um objeto 'chapters' com 'total', mas o JSON detalhado não.
    // Usamos o que estiver disponível.
    const chapterCount = series.chapters 
        ? Object.keys(series.chapters).length 
        : (series as any).chapters?.total || 0;

    const status = (series as any).status?.translation;
    const year = (series as any).publication?.year;

    return (
        <div className="bg-gray-100 rounded-lg p-4 mt-4 stats-card">
            <h3 className="font-semibold mb-2">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-gray-600">Capítulos:</span>
                    <span className="ml-2 font-medium">{chapterCount}</span>
                </div>
                {status && (
                    <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium capitalize">
                            {status === 'completed' ? 'Completo' : 'Em Andamento'}
                        </span>
                    </div>
                )}
                {series.author?.name && (
                    <div>
                        <span className="text-gray-600">Autor:</span>
                        <span className="ml-2 font-medium">{series.author.name}</span>
                    </div>
                )}
                {year && (
                     <div>
                        <span className="text-gray-600">Ano:</span>
                        <span className="ml-2 font-medium">{year}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeriesStats;
