import React, { useState } from 'react';
import { analyzeCompetitorsForTitleIdeas, generateTitlesFromAnalysis, selectClickbaitTitles, ChannelAnalysis, GeneratedTitle } from '../services/geminiService';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';

interface CompetitorSlot {
    id: number;
    url: string;
    transcript: string;
    comments: string;
}

const ViralTitleIdeas: React.FC = () => {
    const [step, setStep] = useState<'input' | 'analysis' | 'generation' | 'clickbait'>('input');
    const [competitorSlots, setCompetitorSlots] = useState<CompetitorSlot[]>([
        { id: 1, url: '', transcript: '', comments: '' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<ChannelAnalysis | null>(null);
    const [titleCount, setTitleCount] = useState(50);
    const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
    const [clickbaitCount, setClickbaitCount] = useState(30);
    const [clickbaitTitles, setClickbaitTitles] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const handleSlotChange = (id: number, field: keyof Omit<CompetitorSlot, 'id'>, value: string) => {
        setCompetitorSlots(prev => prev.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
    };

    const addCompetitor = () => {
        if (competitorSlots.length < 5) {
            setCompetitorSlots(prev => [...prev, { id: Date.now(), url: '', transcript: '', comments: '' }]);
        }
    };

    const removeCompetitor = (id: number) => {
        setCompetitorSlots(prev => prev.filter(item => item.id !== id));
    };

    const handleAnalyze = async () => {
        const nonEmptySlots = competitorSlots.filter(
            s => s.transcript.trim() || s.comments.trim()
        );

        if (nonEmptySlots.length === 0) {
            setError("Please provide at least one transcript or set of comments.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Analyzing competitor data...');
        setError(null);

        try {
            const result = await analyzeCompetitorsForTitleIdeas(nonEmptySlots);
            setAnalysisResult(result);
            setStep('analysis');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTitles = async () => {
        if (!analysisResult || titleCount <= 0) {
            setError("Analysis data is missing or title count is invalid.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage(`Generating ${titleCount} titles...`);
        setError(null);
        try {
            const result = await generateTitlesFromAnalysis(analysisResult, titleCount);
            setGeneratedTitles(result);
            setStep('generation');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectClickbait = async () => {
        if (generatedTitles.length === 0 || clickbaitCount <= 0) {
            setError("No generated titles to select from or count is invalid.");
            return;
        }
        const titlesToAnalyze = generatedTitles.map(t => t.title);
        setIsLoading(true);
        setLoadingMessage(`Selecting ${clickbaitCount} clickbait titles...`);
        setError(null);
        try {
            const result = await selectClickbaitTitles(titlesToAnalyze, clickbaitCount);
            setClickbaitTitles(result);
            setStep('clickbait');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setStep('input');
        setCompetitorSlots([{ id: 1, url: '', transcript: '', comments: '' }]);
        setIsLoading(false);
        setError(null);
        setAnalysisResult(null);
        setGeneratedTitles([]);
        setClickbaitTitles([]);
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const downloadAsTxt = (text: string, filename: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderInputStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white">1. Input Competitor Video Data</h2>
            <p className="text-gray-400 text-sm pb-2">
                Enter the URL of competing YouTube videos. Then, paste in their transcript and a selection of top comments.
                <br />
                <span className="text-xs text-gray-500">(In a real application, fetching transcripts and comments would be automated with a backend service.)</span>
            </p>

            {competitorSlots.map((slot, index) => (
                <div key={slot.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-white">Competitor {index + 1}</h3>
                        {competitorSlots.length > 1 && (
                            <button onClick={() => removeCompetitor(slot.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-600 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                     <div>
                        <label htmlFor={`url-${slot.id}`} className="block text-sm font-medium text-gray-300 mb-1">Video URL</label>
                        <input
                            type="url"
                            id={`url-${slot.id}`}
                            value={slot.url}
                            onChange={(e) => handleSlotChange(slot.id, 'url', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea value={slot.transcript} onChange={(e) => handleSlotChange(slot.id, 'transcript', e.target.value)} placeholder="Paste Transcript..." rows={6} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y" disabled={isLoading} />
                        <textarea value={slot.comments} onChange={(e) => handleSlotChange(slot.id, 'comments', e.target.value)} placeholder="Paste Top Comments..." rows={6} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y" disabled={isLoading} />
                    </div>
                </div>
            ))}

            {competitorSlots.length < 5 && (
                <button onClick={addCompetitor} className="w-full py-2 text-blue-400 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-blue-500 transition-colors">
                    + Add Another Competitor
                </button>
            )}

            <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full mt-2 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
                Analyze Competitors
            </button>
        </div>
    );

    const renderAnalysisStep = () => analysisResult && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
            <div>
                <h3 className="text-lg font-bold text-white mb-2">🔹 Top Video Concepts (Inferred)</h3>
                <div className="space-y-2">
                    {analysisResult.topVideos.map((video, index) => (
                        <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                            <p className="font-semibold text-gray-200">{video.title}</p>
                            <p className="text-sm text-gray-400"><strong className="text-gray-300">Why it works:</strong> {video.views} — <strong className='text-gray-300'>Topic Recency:</strong> {video.date}</p>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-lg font-bold text-white mb-2">🔹 Observed Patterns</h3>
                <div className="p-3 bg-gray-700/50 rounded-lg space-y-3 text-gray-300">
                    <p><strong className="text-white">Title Structure:</strong> {analysisResult.patterns.titleStructure}</p>
                    <p><strong className="text-white">Video Length vs Performance:</strong> {analysisResult.patterns.videoLengthVsPerformance}</p>
                    <p><strong className="text-white">Topics That Perform Well:</strong> {analysisResult.patterns.topicsThatPerformWell}</p>
                    <p><strong className="text-white">Trends:</strong> {analysisResult.patterns.trends}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                <label htmlFor="titleCount" className="text-gray-300 font-medium">Generate</label>
                <input
                    id="titleCount"
                    type="number"
                    value={titleCount}
                    onChange={(e) => setTitleCount(Number(e.target.value))}
                    step="10"
                    min="10"
                    className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="titleCount" className="text-gray-300 font-medium">titles:</label>
                <button
                    onClick={handleGenerateTitles}
                    disabled={isLoading}
                    className="ml-auto px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600"
                >
                    Generate
                </button>
            </div>
        </div>
    );
    
    const renderListWithActions = (titleList: string[], listTitle: string, filename: string) => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{listTitle}</h3>
                <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(titleList.join('\n'))} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy All'}
                    </button>
                    <button onClick={() => downloadAsTxt(titleList.join('\n'), filename)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                        <DownloadIcon className="w-4 h-4" />
                        .txt
                    </button>
                </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg max-h-96 overflow-y-auto border border-gray-700 space-y-2">
                {titleList.map((title, index) => (
                    <p key={index} className="text-gray-300 bg-gray-800 p-2 rounded">{title}</p>
                ))}
            </div>
        </div>
    );

    const renderGenerationStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
            {renderListWithActions(generatedTitles.map(t => t.title), '🔹 Generated Titles', 'generated-titles.txt')}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                <label htmlFor="clickbaitCount" className="text-gray-300 font-medium">Select top</label>
                <input
                    id="clickbaitCount"
                    type="number"
                    value={clickbaitCount}
                    onChange={(e) => setClickbaitCount(Number(e.target.value))}
                    step="5"
                    min="5"
                    max={generatedTitles.length}
                    className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="clickbaitCount" className="text-gray-300 font-medium">clickbait titles:</label>
                <button
                    onClick={handleSelectClickbait}
                    disabled={isLoading}
                    className="ml-auto px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600"
                >
                    Select
                </button>
            </div>
        </div>
    );
    
    const renderClickbaitStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
            {renderListWithActions(clickbaitTitles, `🔹 Top ${clickbaitTitles.length} Clickbait Titles`, 'clickbait-titles.txt')}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {isLoading && (
                 <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-white text-lg">{loadingMessage}</p>
                    </div>
                </div>
            )}
            
            {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}

            {step === 'input' && renderInputStep()}
            {step === 'analysis' && renderAnalysisStep()}
            {step === 'generation' && renderGenerationStep()}
            {step === 'clickbait' && renderClickbaitStep()}
            
            {step !== 'input' && (
                <div className="text-center">
                    <button onClick={handleReset} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold disabled:opacity-50">
                        Start Over
                    </button>
                </div>
            )}
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};

export default ViralTitleIdeas;