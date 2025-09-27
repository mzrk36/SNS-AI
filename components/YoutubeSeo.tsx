import React, { useState } from 'react';
import { generateYoutubeSeoMetadata, YoutubeSeoMetadata } from '../services/geminiService';
import SeoIcon from './icons/SeoIcon';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

const YoutubeSeo: React.FC = () => {
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<YoutubeSeoMetadata | null>(null);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError('Please enter a video title to analyze.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setMetadata(null);

        try {
            const result = await generateYoutubeSeoMetadata(title);
            setMetadata(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, section: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedSection(section);
            setTimeout(() => setCopiedSection(null), 2000);
        });
    };
    
    const ResultCard: React.FC<{ title: string; content: React.ReactNode; onCopy: () => void; isCopied: boolean }> = ({ title, content, onCopy, isCopied }) => (
        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 relative group">
            <h3 className="font-semibold text-lg text-blue-400 mb-2">{title}</h3>
            <div className="text-gray-300 whitespace-pre-wrap">{content}</div>
            <button
                onClick={onCopy}
                className="absolute top-3 right-3 p-1.5 bg-gray-800/50 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={isCopied ? 'Copied' : 'Copy'}
            >
                {isCopied ? (
                    <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                    <CopyIcon className="w-4 h-4" />
                )}
            </button>
        </div>
    );


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">YouTube SEO Optimizer</h2>
                <p className="text-gray-400 mb-6">Enter your video title to generate a complete, SEO-optimized metadata package.</p>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., How to make a delicious chocolate cake"
                        className="flex-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !title.trim()}
                        className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <SeoIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Metadata'}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}

            {isLoading && (
                <div className="text-center p-8">
                    <svg className="animate-spin h-8 w-8 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 text-gray-400">Optimizing your metadata...</p>
                </div>
            )}
            
            {metadata && (
                <div className="space-y-4 animate-fade-in">
                    <ResultCard
                        title="Catchy Title"
                        content={metadata.catchyTitle}
                        onCopy={() => handleCopy(metadata.catchyTitle, 'title')}
                        isCopied={copiedSection === 'title'}
                    />
                    <ResultCard
                        title="SEO-Friendly Description"
                        content={metadata.description}
                        onCopy={() => handleCopy(metadata.description, 'description')}
                        isCopied={copiedSection === 'description'}
                    />
                     <ResultCard
                        title="Relevant Hashtags"
                        content={metadata.hashtags.join(' ')}
                        onCopy={() => handleCopy(metadata.hashtags.join(' '), 'hashtags')}
                        isCopied={copiedSection === 'hashtags'}
                    />
                     <ResultCard
                        title="Relevant Video Tags"
                        content={metadata.videoTags}
                        onCopy={() => handleCopy(metadata.videoTags, 'tags')}
                        isCopied={copiedSection === 'tags'}
                    />
                </div>
            )}
             <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};

export default YoutubeSeo;