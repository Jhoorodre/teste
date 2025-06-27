import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Series, Chapter } from '../types';
import ProxiedImage from '../components/ProxiedImage';

const ReaderPage: React.FC = () => {
    const { slug, chapter: chapterNumber } = useParams<{ slug: string; chapter: string }>();
    const location = useLocation();
    // Directly get the series object from the route state
    const { series } = (location.state as { series: Series }) || {};
    
    const [currentPage, setCurrentPage] = useState(0);

    if (!series || !chapterNumber) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-red-500">Chapter data not found.</p>
                <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; Go back to Hub
                </Link>
            </div>
        );
    }

    const chapterData: Chapter | undefined = series.chapters?.[chapterNumber];

    if (!chapterData) {
        return (
             <div className="container mx-auto p-4 text-center">
                <p className="text-red-500">Chapter {chapterNumber} could not be found in this series.</p>
                <Link to={`/series/${slug}`} state={{ series: series }} className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; Back to Chapter List
                </Link>
            </div>
        );
    }
    
    // Reset page to 0 if chapter changes
    useEffect(() => {
        setCurrentPage(0);
    }, [chapterNumber]);

    // --- CORE FIX ---
    // Get the page URLs from the first available group in the chapter data.
    const getPagesFromChapter = (chapter: Chapter | undefined): string[] => {
        if (!chapter || !chapter.groups) {
            return [];
        }
        const groupNames = Object.keys(chapter.groups);
        if (groupNames.length > 0) {
            return chapter.groups[groupNames[0]]; // Return pages from the first group
        }
        return [];
    };

    const pages = getPagesFromChapter(chapterData);
    // --- END OF FIX ---

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pages && currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to={`/series/${slug}`} state={{ series: series }} className="text-blue-500 hover:underline">&larr; Back to Chapters</Link>
                <h1 className="text-2xl font-bold">{chapterData?.title}</h1>
                <span>Page {currentPage + 1} of {pages.length}</span>
            </div>
            <div className="flex justify-center items-center">
                {pages.length > 0 ? (
                    <ProxiedImage src={pages[currentPage]} alt={`Page ${currentPage + 1}`} className="max-w-full h-auto"/>
                ) : (
                    <p>No pages available for this chapter.</p>
                )}
            </div>
            <div className="flex justify-between mt-4">
                <button onClick={handlePrevPage} disabled={currentPage === 0} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Previous</button>
                <button onClick={handleNextPage} disabled={currentPage >= pages.length - 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

export default ReaderPage;
