import React, { useState, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { getKeywordInsights, getNicheAnalysis, analyzeThumbnails, extractVideoTags, KeywordInsights, NicheAnalysis, ThumbnailAnalysis, ExtractedTag } from '../services/geminiService';
import ResearchIcon from './icons/ResearchIcon';
import ImageIcon from './icons/ImageIcon';

// --- HELPER & UI COMPONENTS ---

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve({ data: base64Data, mimeType: file.type });
        };
        reader.onerror = error => reject(error);
    });
};

const Gauge: React.FC<{ score: number, title: string }> = ({ score, title }) => {
    const getScoreColor = (s: number) => {
        if (s > 80) return 'stroke-green-400';
        if (s > 50) return 'stroke-yellow-400';
        return 'stroke-red-400';
    };
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="stroke-current text-gray-700" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent" />
                    <circle 
                        className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
                        strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="50" className="font-bold text-2xl text-white" textAnchor="middle" dy=".3em">{score}</text>
                </svg>
            </div>
            <p className="mt-2 font-semibold text-white">{title}</p>
        </div>
    );
};

const ScoreBar: React.FC<{ label: string; value: 'Excellent' | 'Good' | 'Fair' | 'Poor' }> = ({ label, value }) => {
    const valueMap = { 'Excellent': { color: 'bg-green-500', width: '100%' }, 'Good': { color: 'bg-green-400', width: '75%' }, 'Fair': { color: 'bg-yellow-500', width: '50%' }, 'Poor': { color: 'bg-red-500', width: '25%' } };
    const { color, width } = valueMap[value] || { color: 'bg-gray-500', width: '0%' };
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">{label}</span>
                <span className={`font-semibold ${color.replace('bg-', 'text-')}`}>{value}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width }}></div>
            </div>
        </div>
    );
};

// --- TAB ICONS ---

const PieChartIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);

const BarChartIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM17 17h.01M17 13h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
    </svg>
);


type Tab = 'keywordExplorer' | 'nicheAnalyser' | 'channelAnalytics' | 'thumbnailTester' | 'tagExtractor';

// --- MAIN COMPONENT ---
const YoutubeNicheResearch: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('keywordExplorer');
    
    // Feature States
    const [keyword, setKeyword] = useState('san diego surfing');
    const [isKeywordLoading, setIsKeywordLoading] = useState(false);
    const [keywordResults, setKeywordResults] = useState<KeywordInsights | null>(null);

    const [niche, setNiche] = useState('Sustainable Living');
    const [isNicheLoading, setIsNicheLoading] = useState(false);
    const [nicheResults, setNicheResults] = useState<NicheAnalysis | null>(null);

    const [thumbA, setThumbA] = useState<{ file: File; base64: string; mime: string; url: string } | null>(null);
    const [thumbB, setThumbB] = useState<{ file: File; base64: string; mime: string; url: string } | null>(null);
    const [thumbTitle, setThumbTitle] = useState('I Tried Every Airbnb Category');
    const [isThumbLoading, setIsThumbLoading] = useState(false);
    const [thumbResults, setThumbResults] = useState<ThumbnailAnalysis | null>(null);

    const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=example');
    const [isTagLoading, setIsTagLoading] = useState(false);
    const [tagResults, setTagResults] = useState<ExtractedTag[]>([]);

    const [error, setError] = useState<string | null>(null);

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
        setError(null);
    };
    
    // --- API Handlers ---
    const handleKeywordExplore = async () => {
        setIsKeywordLoading(true);
        setError(null);
        try {
            const results = await getKeywordInsights(keyword);
            setKeywordResults(results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsKeywordLoading(false);
        }
    };

    const handleNicheAnalyse = async () => {
        setIsNicheLoading(true);
        setError(null);
        try {
            const results = await getNicheAnalysis(niche);
            setNicheResults(results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsNicheLoading(false);
        }
    };

    const handleThumbFileChange = async (e: React.ChangeEvent<HTMLInputElement>, thumb: 'A' | 'B') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { data, mimeType } = await fileToBase64(file);
                const obj = { file, base64: data, mime: mimeType, url: URL.createObjectURL(file) };
                if (thumb === 'A') setThumbA(obj); else setThumbB(obj);
            } catch (err) {
                setError("Failed to read image file.");
            }
        }
    };

    const handleThumbTest = async () => {
        if (!thumbA || !thumbB || !thumbTitle.trim()) {
            setError("Please upload two thumbnails and provide a title.");
            return;
        }
        setIsThumbLoading(true);
        setError(null);
        try {
            const results = await analyzeThumbnails(thumbA.base64, thumbA.mime, thumbB.base64, thumbB.mime, thumbTitle);
            setThumbResults(results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsThumbLoading(false);
        }
    };
    
    const handleTagExtract = async () => {
        setIsTagLoading(true);
        setError(null);
        try {
            const results = await extractVideoTags(videoUrl);
            setTagResults(results);
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsTagLoading(false);
        }
    };

    // --- RENDER FUNCTIONS ---
    
    const renderKeywordExplorer = () => (
        <div className="space-y-6">
            <div className="flex gap-4 items-end p-4 bg-gray-700/50 rounded-lg">
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter a keyword..." />
                <button onClick={handleKeywordExplore} disabled={isKeywordLoading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                    {isKeywordLoading ? 'Exploring...' : 'Explore'}
                </button>
            </div>
            {isKeywordLoading && <p className="text-center">Loading keyword insights...</p>}
            {keywordResults && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-gray-700/50 p-4 rounded-lg space-y-4">
                        <h3 className="font-bold text-center">Overall Score</h3>
                        <Gauge score={keywordResults.overallScore} title={keywordResults.overallScore > 70 ? 'Excellent' : keywordResults.overallScore > 40 ? 'Good' : 'Poor'} />
                        <ScoreBar label="Search Volume" value={keywordResults.scoreAnalysis.searchVolume} />
                        <ScoreBar label="Competition" value={keywordResults.scoreAnalysis.competition} />
                        <ScoreBar label="Optimization Strength" value={keywordResults.scoreAnalysis.optimizationStrength} />
                    </div>
                    <div className="lg:col-span-2 bg-gray-700/50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-bold mb-2">Interest Over Time</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={keywordResults.interestOverTime}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                                        <Line type="monotone" dataKey="interest" stroke="#3B82F6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                             <div>
                                <h3 className="font-bold mb-2">Related Searches</h3>
                                <ul className="space-y-2 max-h-[170px] overflow-y-auto">
                                {keywordResults.relatedSearches.map(s => (
                                    <li key={s.keyword} className="flex justify-between items-center text-sm p-1 bg-gray-800 rounded">
                                        <span>{s.keyword}</span>
                                        <span className="font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">{s.score}</span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    
    const renderNicheAnalyser = () => (
        <div className="space-y-6">
            <div className="flex gap-4 items-end p-4 bg-gray-700/50 rounded-lg">
                <input type="text" value={niche} onChange={e => setNiche(e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter a niche..." />
                <button onClick={handleNicheAnalyse} disabled={isNicheLoading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                    {isNicheLoading ? 'Analyzing...' : 'Analyze'}
                </button>
            </div>
            {isNicheLoading && <p className="text-center">Loading niche analysis...</p>}
            {nicheResults && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* FIX: Use type-safe Object.keys to iterate over nicheResults */}
                    {(Object.keys(nicheResults) as Array<keyof NicheAnalysis>).map((key) => {
                        const data = nicheResults[key];
                        return (
                            <div key={key} className="bg-gray-700/50 p-6 rounded-lg text-center space-y-3">
                                <Gauge score={data.score} title={key.charAt(0).toUpperCase() + key.slice(1)} />
                                <p className="text-sm text-gray-400">{data.summary}</p>
                                <div className="text-left pt-3 border-t border-gray-600 space-y-2">
                                    {key === 'marketSize' && <><p><strong>Total addressable market:</strong> {data.addressableMarket}</p><p><strong>Loyal fans:</strong> {data.loyalFans}</p></>}
                                    {key === 'saturation' && <><p><strong>Reach beyond subs:</strong> {data.reachBeyondSubscribers}</p><p><strong>Avg. Views:</strong> {data.avgViews}</p></>}
                                    {key === 'monetization' && <><p><strong>Viewers loyalty:</strong> {data.viewersLoyalty}</p><p><strong>RPM estimation:</strong> {data.rpmEstimation}</p></>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
    
    const renderChannelAnalytics = () => {
        const geoData = [{ name: 'United States', value: 66.3 }, { name: 'Canada', value: 8.9 }, { name: 'Spain', value: 4.9 }, { name: 'Norway', value: 2.2 }];
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                        <h3 className="font-bold mb-2">Channel Revenue</h3>
                        <p className="text-4xl font-bold text-green-400">$59,000</p>
                        <p className="text-sm text-gray-400">Last Month</p>
                    </div>
                     <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                        <h3 className="font-bold mb-2">Saturation Score</h3>
                        <Gauge score={60} title="" />
                    </div>
                     <div className="bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="font-bold mb-2">Top Geographies</h3>
                        <div className="space-y-2">
                        {geoData.map(g => (
                            <div key={g.name}>
                                <div className="flex justify-between text-sm"><p>{g.name}</p><p>{g.value}%</p></div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${g.value}%`}}></div></div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-center mb-4">Channel Growth Rate Benchmark (30 Days)</h3>
                    <div className="relative h-8">
                        <div className="absolute w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 top-1/2 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-1/2" style={{ left: '20%' }}><div className="w-4 h-4 bg-pink-500 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div><p className="text-xs text-center mt-2 -translate-x-1/2">Lowest</p></div>
                        <div className="absolute top-1/2" style={{ left: '80%' }}><div className="w-4 h-4 bg-green-300 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div><p className="text-xs text-center mt-2 -translate-x-1/2">Highest</p></div>
                        <div className="absolute top-1/2" style={{ left: '45%' }}><div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div><p className="text-xs text-center mt-3 -translate-x-1/2 font-bold">Your Channel</p></div>
                        <div className="absolute top-1/2" style={{ left: '60%' }}><div className="w-6 h-6 bg-purple-400 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div><p className="text-xs text-center mt-3 -translate-x-1/2 font-bold">Your Niche</p></div>
                    </div>
                </div>
            </div>
        )
    };
    
    const renderThumbnailTester = () => (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gray-700/50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold">Thumbnail Tester</h3>
                <input type="text" value={thumbTitle} onChange={e => setThumbTitle(e.target.value)} placeholder="Video Title" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"/>
                <div>
                    <label className="text-sm">Thumbnail A</label>
                    <input type="file" accept="image/*" onChange={e => handleThumbFileChange(e, 'A')} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"/>
                </div>
                <div>
                    <label className="text-sm">Thumbnail B</label>
                    <input type="file" accept="image/*" onChange={e => handleThumbFileChange(e, 'B')} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"/>
                </div>
                <button onClick={handleThumbTest} disabled={isThumbLoading} className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                    {isThumbLoading ? 'Analyzing...' : 'Test Thumbnails'}
                </button>
            </div>
             <div className="lg:col-span-2 bg-gray-700/50 p-4 rounded-lg">
                <div className="flex gap-4 mb-4">
                    <div className="w-1/2">{thumbA ? <img src={thumbA.url} className="rounded" /> : <div className="aspect-video bg-gray-800 rounded flex items-center justify-center">A</div>}</div>
                    <div className="w-1/2">{thumbB ? <img src={thumbB.url} className="rounded" /> : <div className="aspect-video bg-gray-800 rounded flex items-center justify-center">B</div>}</div>
                </div>
                {thumbResults && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-bold mb-2">AI Analysis</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Thumbnail A Score: <span className="text-blue-400">{thumbResults.scoreA}/100</span></p>
                                <ul className="list-disc list-inside text-gray-400">
                                    <li>Clarity: {thumbResults.analysisA.clarity}</li>
                                    <li>Emotion: {thumbResults.analysisA.emotion}</li>
                                    <li>Branding: {thumbResults.analysisA.branding}</li>
                                </ul>
                            </div>
                             <div>
                                <p className="font-semibold">Thumbnail B Score: <span className="text-blue-400">{thumbResults.scoreB}/100</span></p>
                                <ul className="list-disc list-inside text-gray-400">
                                    <li>Clarity: {thumbResults.analysisB.clarity}</li>
                                    <li>Emotion: {thumbResults.analysisB.emotion}</li>
                                    <li>Branding: {thumbResults.analysisB.branding}</li>
                                </ul>
                            </div>
                        </div>
                         <div className="mt-4 pt-2 border-t border-gray-600">
                             <p className="font-bold">Recommendation: <span className="text-green-400">Thumbnail {thumbResults.winner} is the predicted winner.</span></p>
                            <p className="text-sm text-gray-400">{thumbResults.recommendation}</p>
                         </div>
                    </div>
                )}
             </div>
         </div>
    );
    
    const renderTagExtractor = () => (
        <div className="space-y-6">
            <div className="flex gap-4 items-end p-4 bg-gray-700/50 rounded-lg">
                <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter YouTube Video URL..." />
                <button onClick={handleTagExtract} disabled={isTagLoading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                    {isTagLoading ? 'Extracting...' : 'Extract Tags'}
                </button>
            </div>
             {isTagLoading && <p className="text-center">Loading tags...</p>}
            {tagResults.length > 0 && (
                <div className="overflow-x-auto bg-gray-700/50 p-4 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-300 uppercase">
                            <tr><th className="p-2 text-left">Tag</th><th className="p-2 text-center">Search Volume</th><th className="p-2 text-center">Competition</th><th className="p-2 text-center">Overall Score</th></tr>
                        </thead>
                        <tbody>
                            {tagResults.map(t => (
                                <tr key={t.tag} className="border-b border-gray-600">
                                    <td className="p-2 font-medium text-white">{t.tag}</td>
                                    <td className="p-2 text-center font-mono">{t.searchVolume.toLocaleString()}</td>
                                    <td className="p-2 text-center">{t.competition}</td>
                                    <td className="p-2 text-center"><span className="font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">{t.overallScore}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );


    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'keywordExplorer', label: 'Keyword Explorer', icon: <ResearchIcon /> },
        { id: 'nicheAnalyser', label: 'Niche Analyser', icon: <PieChartIcon /> },
        { id: 'channelAnalytics', label: 'Channel Analytics', icon: <BarChartIcon /> },
        { id: 'thumbnailTester', label: 'Thumbnail Tester', icon: <ImageIcon /> },
        { id: 'tagExtractor', label: 'Tag Extractor', icon: <TagIcon /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'keywordExplorer': return renderKeywordExplorer();
            case 'nicheAnalyser': return renderNicheAnalyser();
            case 'channelAnalytics': return renderChannelAnalytics();
            case 'thumbnailTester': return renderThumbnailTester();
            case 'tagExtractor': return renderTagExtractor();
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">YouTube Content Strategy Toolkit</h1>
            <div className="flex border-b border-gray-700 flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}
            <div className="animate-fade-in">
                {renderContent()}
            </div>
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};

export default YoutubeNicheResearch;