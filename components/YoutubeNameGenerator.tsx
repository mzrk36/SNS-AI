import React, { useState } from 'react';
import { generateYoutubeNames, YoutubeNameResult } from '../services/geminiService';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import TagNameIcon from './icons/TagNameIcon';

// Data for the name style options, matching the user's image
const nameStyleOptions = [
  { key: 'auto', label: 'Auto', description: 'All styles', isNew: true },
  { key: 'brandable', label: 'Brandable names', description: 'like Google and Rolex' },
  { key: 'evocative', label: 'Evocative', description: 'like RedBull and Forever21' },
  { key: 'short-phrase', label: 'Short phrase', description: 'like Dollar shave club' },
  { key: 'compound-words', label: 'Compound words', description: 'like FedEx and Microsoft' },
  { key: 'alternate-spelling', label: 'Alternate spelling', description: 'like Lyft and Fiverr' },
  { key: 'non-english-words', label: 'Non-English words', description: 'like Toyota and Audi' },
  { key: 'real-words', label: 'Real words', description: 'like Apple and Amazon' },
];

const randomnessLevels = ['Low', 'Medium', 'High'];
const tabs = [
    { id: 1, label: 'Name Style' },
    { id: 2, label: 'Randomness' },
    { id: 3, label: 'Brand Info' },
];


const YoutubeNameGenerator: React.FC = () => {
    // State management for the wizard
    const [step, setStep] = useState(1);
    const [nameStyle, setNameStyle] = useState('auto');
    const [randomness, setRandomness] = useState(1); // 0=Low, 1=Medium, 2=High
    const [keywords, setKeywords] = useState('');
    const [pitch, setPitch] = useState('');
    
    // State for results and UI feedback
    const [results, setResults] = useState<YoutubeNameResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedName, setCopiedName] = useState<string | null>(null);

    // Function to call the AI service
    const handleGenerate = async () => {
        if (!keywords.trim()) {
            setError('Please enter keywords to describe your channel.');
            setStep(3); // Navigate to the brand info tab
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const generatedNames = await generateYoutubeNames({
                style: nameStyle,
                randomness: randomnessLevels[randomness].toLowerCase(),
                keywords,
                pitch,
            });
            setResults(generatedNames);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating names.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (name: string) => {
        navigator.clipboard.writeText(name).then(() => {
            setCopiedName(name);
            setTimeout(() => setCopiedName(null), 2000);
        });
    };
    
    const handleNextStep = () => {
        if (step < 3) {
            setStep(s => s + 1);
        }
    };

    // Render logic for each step of the wizard
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-white mb-8">Select a name style</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                            {nameStyleOptions.map((style) => (
                                <label
                                    key={style.key}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex items-center ${
                                        nameStyle === style.key
                                            ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="name-style"
                                        value={style.key}
                                        checked={nameStyle === style.key}
                                        onChange={() => setNameStyle(style.key)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 flex-shrink-0 rounded-full border-2 border-gray-400 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                                       <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="font-medium text-white flex items-center">
                                            {style.label}
                                            {style.isNew && (
                                                <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">new</span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm">{style.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-white mb-8">Set Randomness Level</h2>
                         <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                             <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-400">Low</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="1"
                                    value={randomness}
                                    onChange={e => setRandomness(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                                />
                                <span className="text-sm font-medium text-gray-400">High</span>
                            </div>
                            <p className="text-center mt-6 text-lg font-semibold text-white">{randomnessLevels[randomness]}</p>
                            <p className="text-center mt-2 text-sm text-gray-400">
                                {randomness === 0 && 'Names directly related to your keywords.'}
                                {randomness === 1 && 'Mixes keywords with related concepts.'}
                                {randomness === 2 && 'Abstract twists and creative interpretations.'}
                            </p>
                        </div>
                    </div>
                );
            case 3:
                 return (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-white mb-8">Brand Info</h2>
                        <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 space-y-6">
                            <div>
                                <label htmlFor="keywords" className="block text-sm font-medium text-gray-300 mb-2">Keywords*</label>
                                <input
                                    id="keywords"
                                    type="text"
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                    placeholder="e.g., philosophy, Stoicism, self-improvement"
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
                                />
                                <p className="text-xs text-gray-400 mt-1">Enter comma-separated keywords about your channel.</p>
                            </div>
                            <div>
                                <label htmlFor="pitch" className="block text-sm font-medium text-gray-300 mb-2">One-Sentence Pitch (Optional)</label>
                                <textarea
                                    id="pitch"
                                    value={pitch}
                                    onChange={e => setPitch(e.target.value)}
                                    placeholder="e.g., A channel that explores ancient wisdom for modern problems."
                                    rows={3}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8">
                {/* Tabs */}
                <div className="mb-8 flex justify-center border-b border-gray-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStep(tab.id)}
                            className={`px-6 py-3 font-medium text-sm transition-colors ${
                                step === tab.id
                                    ? 'border-b-2 border-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <div className="px-6 py-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    </div>
                </div>

                {renderStepContent()}

                {/* Navigation */}
                <div className="mt-12 flex justify-center">
                    {step < 3 ? (
                        <button
                            onClick={handleNextStep}
                            className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !keywords.trim()}
                            className="px-8 py-4 font-bold text-lg text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            <TagNameIcon className="w-6 h-6 mr-3" />
                            {isLoading ? 'Generating Names...' : 'Generate Names'}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg text-center">{error}</div>}

            {isLoading && (
                 <div className="text-center p-8">
                    <svg className="animate-spin h-8 w-8 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 text-gray-400">Generating unique names for you...</p>
                </div>
            )}
            
            {results.length > 0 && !isLoading && (
                <div className="bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
                    <h2 className="text-2xl font-bold text-center text-white mb-8">Generated Names</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 rounded-l-lg">#</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Handle</th>
                                    <th scope="col" className="px-6 py-3 rounded-r-lg text-center">Copy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, index) => (
                                    <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4">{result.id}</td>
                                        <td className="px-6 py-4 font-medium text-white">{result.name}</td>
                                        <td className="px-6 py-4 text-blue-400">{result.handle}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleCopy(result.name)} className="p-2 rounded-md hover:bg-gray-600 transition-colors">
                                                {copiedName === result.name ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <style>{`
                .range-thumb { -webkit-appearance: none; appearance: none; background-color: transparent; cursor: pointer; }
                .range-thumb::-webkit-slider-runnable-track { background-color: #4b5563; height: 0.5rem; border-radius: 9999px; }
                .range-thumb::-moz-range-track { background-color: #4b5563; height: 0.5rem; border-radius: 9999px; }
                .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -4px; height: 1.25rem; width: 1.25rem; background-color: #f9fafb; border-radius: 9999px; border: 2px solid #3b82f6; }
                .range-thumb::-moz-range-thumb { height: 1.25rem; width: 1.25rem; background-color: #f9fafb; border-radius: 9999px; border: 2px solid #3b82f6; }
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default YoutubeNameGenerator;
