
import React, { useState } from 'react';
import { findViralVideos, ViralVideo, ViralVideoSearchParams } from '../services/geminiService';

const youtubeCategories = ["All Categories", "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals", "Sports", "Travel & Events", "Gaming", "People & Blogs", "Comedy", "Entertainment", "News & Politics", "Howto & Style", "Education", "Science & Technology"];

const trendingNiches = [
    "Roblox", "Futuristic technology", "Simple Explainers", "Veo 3 comedy comps", "Ukraine war", "Formula 1", "Travel Hacks", "Geopolitics", "Terrifying Medieval History", "3D", "One Piece lore (anime)", "Nostalgia", "Planes", "DIY", "Canada News", "Tariffs news", "Streamer Drama", "Brainrot", "Immigration and deportation", "Cat Ai", "Military technology", "Veo 3 fantasy movies", "Why it sucks to be born a", "Crime cams", "Cartoon universe lore (Family Guy, Spongebob, etc)", "US decline", "Cruise Hacks", "Underdog comeback stories", "Middle-East conflict", "Religious stories", "Cars", "Catastrophes", "Early Earth", "Football", "Trump news", "Healthy foods", "Carl Jung", "The secret lives of world leaders", "Movie and series reviews", "WW2", "Racket sports", "Early Humans", "Mythical past", "Minecraft ultra long-form", "Dead Famous People", "Actors then vs now", "Music artists lore", "Documentaries for sleep (science, history, etc)", "Nintendo lore (Donkey Kong, Zelda, Mario, etc)", "Veo 3 vlogs"
];


const initialSearchParams: Omit<ViralVideoSearchParams, 'minDuration' | 'maxDuration'> = {
    category: 'All Categories',
    keywords: '',
    days: 30,
    minSubs: 1,
    maxSubs: 1000000,
    minViews: 1,
    maxViews: 1000000000,
};

const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const VideoCard: React.FC<{ video: ViralVideo }> = ({ video }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'description' | 'thumbnail'>('info');

    return (
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
            <h3 className="font-bold text-white mb-2">{video.title}</h3>
            <div className="flex border-b border-gray-700 mb-2">
                <button onClick={() => setActiveTab('info')} className={`px-3 py-1 text-sm ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Video Info</button>
                <button onClick={() => setActiveTab('description')} className={`px-3 py-1 text-sm ${activeTab === 'description' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Description</button>
                <button onClick={() => setActiveTab('thumbnail')} className={`px-3 py-1 text-sm ${activeTab === 'thumbnail' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Thumbnail</button>
            </div>
            <div className="flex-grow">
                {activeTab === 'info' && (
                    <div className="text-sm text-gray-400 space-y-1">
                        <p><strong>Channel:</strong> {video.channelName}</p>
                        <p><strong>Subscribers:</strong> {formatNumber(video.subscribers)}</p>
                        <p><strong>Views:</strong> {formatNumber(video.views)}</p>
                        <p><strong>Duration:</strong> {formatDuration(video.duration)}</p>
                        <p><strong>Published:</strong> {video.publishedDate}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                            {video.keywords.slice(0, 5).map(kw => <span key={kw} className="bg-gray-700 px-2 py-0.5 rounded-full text-xs">{kw}</span>)}
                        </div>
                    </div>
                )}
                {activeTab === 'description' && (
                    <p className="text-sm text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">{video.description}</p>
                )}
                {activeTab === 'thumbnail' && (
                    <img src={video.thumbnailUrl} alt={video.title} className="rounded-md" />
                )}
            </div>
            <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="mt-3 text-center w-full bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
                Watch Video
            </a>
        </div>
    );
};

const ViralTopicFinder: React.FC = () => {
    const [searchParams, setSearchParams] = useState(initialSearchParams);
    const [durationMinutes, setDurationMinutes] = useState({ min: 4, max: 320 });
    const [results, setResults] = useState<ViralVideo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: name.includes('days') || name.includes('Subs') || name.includes('Views') ? Number(value) : value }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDurationMinutes(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setNoResults(false);
        setError(null);
        setResults([]);
        
        const finalSearchParams: ViralVideoSearchParams = {
            ...searchParams,
            minDuration: durationMinutes.min * 60,
            maxDuration: durationMinutes.max * 60,
        };
        
        setSearchQuery(finalSearchParams.category !== 'All Categories' ? finalSearchParams.category : finalSearchParams.keywords);
        try {
            const videoResults = await findViralVideos(finalSearchParams);
            if (videoResults.length === 0) {
                setNoResults(true);
            } else {
                setResults(videoResults);
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadData = (data: string, filename: string, type: string) => {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = () => {
        const headers = "Title,Channel,Subscribers,Views,Duration (s),Published Date,Keywords,URL\n";
        const rows = results.map(v => `"${v.title.replace(/"/g, '""')}","${v.channelName}",${v.subscribers},${v.views},${v.duration},"${v.publishedDate}","${v.keywords.join(', ')}","https://www.youtube.com/watch?v=${v.videoId}"`).join('\n');
        downloadData(headers + rows, 'viral-videos.csv', 'text/csv;charset=utf-8;');
    };

    const handleDownloadTitles = () => {
        const titles = results.map(v => v.title).join('\n');
        downloadData(titles, 'video-titles.txt', 'text/plain;charset=utf-8;');
    };

    const handleDownloadThumbnails = () => {
        const urls = results.map(v => v.thumbnailUrl).join('\n');
        downloadData(urls, 'thumbnail-urls.txt', 'text/plain;charset=utf-8;');
    };


    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Search Options */}
            <aside className="lg:w-1/3 xl:w-1/4 bg-gray-800 p-6 rounded-lg h-fit space-y-4">
                <h2 className="text-xl font-bold text-white">Search Options</h2>
                <div>
                    <label className="text-sm font-medium">Select Main Category</label>
                    <select name="category" value={searchParams.category} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md">
                        <optgroup label="Standard Categories">
                            {youtubeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </optgroup>
                         <optgroup label="Trending Niches">
                            {trendingNiches.map(niche => <option key={niche} value={niche}>{niche}</option>)}
                        </optgroup>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Enter ANY Other Keyword</label>
                    <input type="text" name="keywords" value={searchParams.keywords} onChange={handleInputChange} placeholder="Trending, viral, popular..." className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <div>
                    <label className="text-sm font-medium">Last How many Days?</label>
                    <input type="number" name="days" value={searchParams.days} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Duration Range (minutes)</label>
                    <input type="number" name="min" value={durationMinutes.min} onChange={handleDurationChange} placeholder="Min" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                    <input type="number" name="max" value={durationMinutes.max} onChange={handleDurationChange} placeholder="Max" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Subscriber Range</label>
                    <input type="number" name="minSubs" value={searchParams.minSubs} onChange={handleInputChange} placeholder="Min" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                    <input type="number" name="maxSubs" value={searchParams.maxSubs} onChange={handleInputChange} placeholder="Max" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Views Range</label>
                    <input type="number" name="minViews" value={searchParams.minViews} onChange={handleInputChange} placeholder="Min" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                    <input type="number" name="maxViews" value={searchParams.maxViews} onChange={handleInputChange} placeholder="Max" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <button onClick={handleSearch} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600">
                    {isLoading ? "Searching..." : "Find Viral Videos"}
                </button>
            </aside>

            {/* Search Results */}
            <main className="flex-1">
                {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}

                {isLoading && (
                    <div className="text-center p-8">
                        <svg className="animate-spin h-8 w-8 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-3 text-gray-400">Searching in: {searchQuery}...</p>
                    </div>
                )}

                {noResults && (
                    <div className="bg-gray-800 p-6 rounded-lg text-center">
                        <p className="text-xl font-bold text-red-400 mb-4">❌ No videos found with your filters!</p>
                        <div className="text-left text-gray-400 max-w-md mx-auto space-y-2">
                            <h4 className="font-semibold text-white">Troubleshooting Tips:</h4>
                            <ul className="list-disc list-inside text-sm">
                                <li>Increase Maximum Subscribers/Views values.</li>
                                <li>Increase Days to search (try 30+ days).</li>
                                <li>Try different keywords.</li>
                                <li>Remove some filters (especially the subscriber filter).</li>
                                <li>Try 'All Categories' first.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                     <div className="space-y-4">
                        <div className="bg-gray-800 p-3 rounded-lg flex flex-wrap gap-2 justify-center">
                           <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700">Download CSV</button>
                           <button onClick={handleDownloadTitles} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-700">Download Titles</button>
                           <button onClick={handleDownloadThumbnails} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-700">Download Thumbnails List</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {results.map(video => <VideoCard key={video.videoId} video={video} />)}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ViralTopicFinder;
