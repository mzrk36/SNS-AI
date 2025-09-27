import React, { useState } from 'react';
import { generateYoutubeBanner, analyzeAndFillBannerForm, YoutubeBannerParams } from '../services/geminiService';
import BannerIcon from './icons/BannerIcon';
import DownloadIcon from './icons/DownloadIcon';

// Options for dropdowns
const aestheticOptions = ["Minimalist", "Vibrant & Energetic", "Dark & Moody", "Retro / Vintage", "Futuristic / Sci-Fi", "Corporate & Clean", "Grunge / Textured", "Abstract"];
const moodOptions = ["Inspiring & Motivational", "Mysterious & Intriguing", "Playful & Fun", "Professional & Authoritative", "Calm & Relaxing", "Epic & Cinematic", "Humorous & Lighthearted"];
const compositionOptions = ["Centered Focus", "Rule of Thirds", "Symmetrical Balance", "Asymmetrical Layout", "Dynamic & Diagonal Lines", "Minimalist with Negative Space"];
const fontOptions = ["Modern Sans-Serif (e.g., Helvetica)", "Bold Display (Impactful)", "Elegant Serif (e.g., Times New Roman)", "Script & Handwritten", "Futuristic & Tech", "Retro & Vintage", "Graffiti Style"];
const artStyleOptions = ["Hyperrealistic Photography", "Digital Painting", "3D Render", "Anime / Manga Style", "Clean Vector Art", "Cartoon & Illustrated", "Watercolor"];

// Helper for form fields to reduce repetition
const FormField: React.FC<{
    name: string;
    label: string;
    placeholder?: string;
    type?: 'input' | 'textarea' | 'select';
    options?: string[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    disabled: boolean;
}> = ({ name, label, placeholder, type = 'input', options = [], value, onChange, disabled }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-200">{label}</label>
        {type === 'input' && <input type="text" id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200" />}
        {type === 'textarea' && <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={3} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y" />}
        {type === 'select' && <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200">{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>}
    </div>
);

const initialFormData: YoutubeBannerParams = {
    channelName: '',
    channelNiche: '',
    channelTheme: '',
    aesthetic: aestheticOptions[0],
    mood: moodOptions[0],
    primaryVisualElements: '',
    secondaryVisualElements: '',
    compositionStyle: compositionOptions[0],
    fontStyle: fontOptions[0],
    tagline: '',
    cta: '',
    dominantColors: '',
    accentColors: '',
    artStyle: artStyleOptions[0],
    specificDetails: '',
};

const YoutubeBannerGenerator: React.FC = () => {
    // State for UI mode and AI prompt
    const [formMode, setFormMode] = useState<'ai' | 'manual'>('ai');
    const [aiPrompt, setAiPrompt] = useState('');
    
    // State for form data
    const [formData, setFormData] = useState<YoutubeBannerParams>(initialFormData);
    
    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAiAnalyze = async () => {
        if (!aiPrompt.trim() || isLoading) return;

        setIsLoading(true);
        setImageUrl(null);
        setError(null);
        
        try {
            const result = await analyzeAndFillBannerForm(aiPrompt);
            setFormData(result);
            setFormMode('manual'); // Switch to manual editor to show results
        } catch (err: any) {
            setError(err.message || 'AI analysis failed. Please try again or fill the form manually.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.channelName || !formData.channelNiche || isLoading) return;

        setIsLoading(true);
        setImageUrl(null);
        setError(null);

        const result = await generateYoutubeBanner(formData);

        if (result) {
            setImageUrl(result);
        } else {
            setError('Failed to generate banner. Please try again or refine your prompts.');
        }

        setIsLoading(false);
    };
    
    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        const safeFilename = formData.channelName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
        link.download = `${safeFilename || 'generated-banner'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Form Section */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 h-fit">
                <h2 className="text-2xl font-bold mb-6 text-white">YouTube Banner Generator</h2>
                
                <div className="mb-6 flex border-b border-gray-700">
                    <button onClick={() => setFormMode('ai')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${formMode === 'ai' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        AI Analyst
                    </button>
                    <button onClick={() => setFormMode('manual')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${formMode === 'manual' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        Manual Editor
                    </button>
                </div>

                {formMode === 'ai' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-200">Describe Your Channel in a Few Sentences</label>
                            <textarea
                                id="ai-prompt"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., My channel is called 'Cosmic Reads'. It's all about reviewing classic sci-fi novels. I want a mysterious, retro vibe, maybe with some futuristic elements. The main colors should be dark blues and purples..."
                                rows={8}
                                className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleAiAnalyze}
                            disabled={isLoading || !aiPrompt.trim()}
                            className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze & Fill Form'}
                        </button>
                    </div>
                )}

                {formMode === 'manual' && (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                        <FormField name="channelName" label="Channel Name*" placeholder="Your Channel's Name" value={formData.channelName} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="tagline" label="Tagline (Optional)" placeholder="e.g., New Videos Every Week" value={formData.tagline} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="channelNiche" label="Channel Niche*" placeholder="e.g., Sci-Fi Book Reviews, Daily Vlogging" value={formData.channelNiche} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="channelTheme" label="Core Theme" placeholder="e.g., Exploring the cosmos, minimalist living" value={formData.channelTheme} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="aesthetic" label="Aesthetic" type="select" options={aestheticOptions} value={formData.aesthetic} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="mood" label="Mood" type="select" options={moodOptions} value={formData.mood} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="primaryVisualElements" label="Primary Visual Elements" placeholder="e.g., A portrait of an astronaut, a stack of old books" value={formData.primaryVisualElements} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="secondaryVisualElements" label="Secondary/Background Elements" placeholder="e.g., A nebulae, a cozy library" value={formData.secondaryVisualElements} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="compositionStyle" label="Composition Style" type="select" options={compositionOptions} value={formData.compositionStyle} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="fontStyle" label="Font Style" type="select" options={fontOptions} value={formData.fontStyle} onChange={handleInputChange} disabled={isLoading} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="dominantColors" label="Dominant Colors" placeholder="e.g., deep blue, black" value={formData.dominantColors} onChange={handleInputChange} disabled={isLoading} />
                            <FormField name="accentColors" label="Accent Colors" placeholder="e.g., electric pink, gold" value={formData.accentColors} onChange={handleInputChange} disabled={isLoading} />
                        </div>
                        <FormField name="artStyle" label="Art Style" type="select" options={artStyleOptions} value={formData.artStyle} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="specificDetails" label="Specific Details / Negative Prompts" type="textarea" placeholder="e.g., 'Include subtle lens flare', 'no human faces'" value={formData.specificDetails} onChange={handleInputChange} disabled={isLoading} />
                        <FormField name="cta" label="Call to Action (Optional)" placeholder="e.g., Subscribe for More!" value={formData.cta} onChange={handleInputChange} disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !formData.channelName || !formData.channelNiche} className="w-full mt-4 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg">
                            <BannerIcon className="w-6 h-6 mr-3" />
                            {isLoading ? 'Generating...' : 'Generate Banner'}
                        </button>
                    </form>
                )}
            </div>

            {/* Display Section */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
                {error && <div className="w-full mb-4 p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg text-center"><p className="font-semibold">An Error Occurred</p><p>{error}</p></div>}
                <div className="w-full aspect-video bg-gray-900/50 rounded-lg relative flex items-center justify-center border border-gray-700">
                    {/* Safe Zone Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/30 pointer-events-none" style={{ width: '60.4%', height: '29.4%' }}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/30 bg-gray-900/50 px-1">Safe Zone</span>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center text-gray-400">
                            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-lg">Processing...</p>
                        </div>
                    )}
                    
                    {imageUrl && <img src={imageUrl} alt="Generated Banner" className="w-full h-full object-contain rounded-lg" />}
                    {!isLoading && !imageUrl && (
                        <div className="text-center text-gray-500 p-4">
                            <BannerIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-lg">Your generated banner will appear here.</p>
                        </div>
                    )}
                </div>
                 {imageUrl && !isLoading && (
                    <button onClick={handleDownload} className="mt-6 flex items-center justify-center mx-auto px-5 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download Banner
                    </button>
                 )}
            </div>
             <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};

export default YoutubeBannerGenerator;