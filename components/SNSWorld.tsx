import React, { useState, useCallback, useRef } from 'react';
import { enhancePrompt, analyzeImageAndCreatePrompt, generateImage } from '../services/geminiService';
import DownloadIcon from './icons/DownloadIcon';
import UploadCloudIcon from './icons/UploadCloudIcon';

type AppState = 'HOME' | 'INPUT' | 'REVIEW_PROMPT' | 'GENERATING' | 'RESULT';
type FlowType = 'text' | 'image' | null;

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

const SNSWorld: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('HOME');
    const [flowType, setFlowType] = useState<FlowType>(null);
    const [userIdea, setUserIdea] = useState('');
    const [overlayText, setOverlayText] = useState('');
    const [uploadedImage, setUploadedImage] = useState<{ file: File, url: string, base64: string, mimeType: string } | null>(null);
    const [enhancedPrompt, setEnhancedPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setAppState('HOME');
        setFlowType(null);
        setUserIdea('');
        setOverlayText('');
        if (uploadedImage) URL.revokeObjectURL(uploadedImage.url);
        setUploadedImage(null);
        setEnhancedPrompt('');
        setGeneratedImage(null);
        setFinalPrompt('');
        setLoadingMessage('');
        setError(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { data, mimeType } = await fileToBase64(file);
                if (uploadedImage) URL.revokeObjectURL(uploadedImage.url);
                setUploadedImage({ file, url: URL.createObjectURL(file), base64: data, mimeType });
            } catch (err) {
                setError("Failed to read the image file.");
            }
        }
    };

    const handleSubmitTextIdea = async () => {
        if (!userIdea.trim()) return;
        setLoadingMessage('Enhancing your idea into a prompt...');
        setAppState('GENERATING');
        setError(null);
        try {
            const prompt = await enhancePrompt(userIdea, overlayText || undefined);
            setEnhancedPrompt(prompt);
            setAppState('REVIEW_PROMPT');
        } catch (err: any) {
            setError(err.message || 'Failed to enhance prompt.');
            setAppState('INPUT');
        }
    };

    const handleGenerateFromReview = async () => {
        if (!enhancedPrompt.trim()) return;
        setLoadingMessage('Generating your thumbnail...');
        setAppState('GENERATING');
        setFinalPrompt(enhancedPrompt);
        setError(null);
        try {
            const imageUrl = await generateImage(enhancedPrompt, '16:9');
            if (imageUrl) {
                setGeneratedImage(imageUrl);
                setAppState('RESULT');
            } else {
                throw new Error('The model did not return an image.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate image.');
            setAppState('REVIEW_PROMPT');
        }
    };

    const handleSubmitImage = async () => {
        if (!uploadedImage) return;
        setLoadingMessage('Analyzing your image...');
        setAppState('GENERATING');
        setError(null);
        try {
            const analysisResult = await analyzeImageAndCreatePrompt(uploadedImage.base64, uploadedImage.mimeType);
            let promptForGeneration = analysisResult.finalPrompt;
            if (overlayText.trim()) {
                promptForGeneration += ` The thumbnail includes the text "${overlayText}" in a stylized, high-impact font.`;
            }
            setFinalPrompt(promptForGeneration);
            setLoadingMessage('Generating your thumbnail...');
            const imageUrl = await generateImage(promptForGeneration, '16:9');
            if (imageUrl) {
                setGeneratedImage(imageUrl);
                setAppState('RESULT');
            } else {
                throw new Error('The model did not return an image.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process the image and generate a new one.');
            setAppState('INPUT');
        }
    };

    const renderHome = () => (
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-6">AI Thumbnail Generator</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button onClick={() => { setFlowType('text'); setAppState('INPUT'); }} className="p-8 bg-gray-700 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-2">Start with a Text Idea</h2>
                    <p className="text-gray-400">Transform your concept into a viral thumbnail.</p>
                </button>
                <button onClick={() => { setFlowType('image'); setAppState('INPUT'); }} className="p-8 bg-gray-700 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-2">Reimagine from an Image</h2>
                    <p className="text-gray-400">Analyze an existing image to create a new version.</p>
                </button>
            </div>
        </div>
    );
    
    const renderInput = () => (
        <div className="max-w-2xl mx-auto">
            {flowType === 'text' && (
                <div className="mb-6">
                    <label htmlFor="user-idea" className="block text-lg font-medium mb-2">Your Idea</label>
                    <textarea id="user-idea" value={userIdea} onChange={(e) => setUserIdea(e.target.value)} rows={4} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., A cat discovering a hidden treasure chest..."></textarea>
                </div>
            )}
            {flowType === 'image' && (
                 <div className="mb-6">
                    <label className="block text-lg font-medium mb-2">Upload an Image</label>
                    <div onClick={() => fileInputRef.current?.click()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-blue-500">
                        {uploadedImage ? (
                            <img src={uploadedImage.url} alt="Uploaded preview" className="max-h-48 rounded-md" />
                        ) : (
                            <div className="space-y-1 text-center">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-400">
                                    <p className="pl-1">Click to upload</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </div>
            )}
            <div className="mb-6">
                <label htmlFor="overlay-text" className="block text-lg font-medium mb-2">Clickbait Text Overlay <span className="text-sm text-gray-400">(Optional)</span></label>
                <input id="overlay-text" type="text" value={overlayText} onChange={(e) => setOverlayText(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., YOU WON'T BELIEVE THIS!" />
            </div>
            <div className="flex gap-4">
                <button onClick={() => setAppState('HOME')} className="px-6 py-3 font-semibold bg-gray-600 rounded-lg hover:bg-gray-700">Back</button>
                <button onClick={flowType === 'text' ? handleSubmitTextIdea : handleSubmitImage} className="flex-1 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500" disabled={flowType === 'text' ? !userIdea.trim() : !uploadedImage}>
                    {flowType === 'text' ? 'Enhance Prompt' : 'Generate Thumbnail'}
                </button>
            </div>
        </div>
    );

    const renderReviewPrompt = () => (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Review & Refine Your Prompt</h2>
            <textarea value={enhancedPrompt} onChange={(e) => setEnhancedPrompt(e.target.value)} rows={8} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"></textarea>
            <div className="flex gap-4 mt-6">
                <button onClick={() => setAppState('INPUT')} className="px-6 py-3 font-semibold bg-gray-600 rounded-lg hover:bg-gray-700">Back</button>
                <button onClick={handleGenerateFromReview} className="flex-1 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Generate Image</button>
            </div>
        </div>
    );
    
    const renderGenerating = () => (
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="text-xl text-gray-300">{loadingMessage}</p>
        </div>
    );

    const renderResult = () => (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Generation Complete!</h2>
            {generatedImage && (
                <div className="relative group aspect-video bg-gray-900 rounded-lg shadow-xl mx-auto mb-6">
                    <img src={generatedImage} alt="Generated Thumbnail" className="w-full h-full object-contain rounded-lg" />
                    <a href={generatedImage} download="thumbnail.png" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"><DownloadIcon className="mr-2" /> Download</div>
                    </a>
                </div>
            )}
            <div className="text-left bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Final Prompt Used:</h3>
                <p className="font-mono text-sm text-gray-300">{finalPrompt}</p>
            </div>
            <button onClick={resetState} className="mt-8 px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Start Over</button>
        </div>
    );

    const renderContent = () => {
        if (error) {
            return <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg text-center">{error}</div>;
        }
        switch (appState) {
            case 'HOME': return renderHome();
            case 'INPUT': return renderInput();
            case 'REVIEW_PROMPT': return renderReviewPrompt();
            case 'GENERATING': return renderGenerating();
            case 'RESULT': return renderResult();
            default: return <div>Error: Invalid State</div>
        }
    }

    return (
         <div className="bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
            {renderContent()}
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
         </div>
    );
};

export default SNSWorld;
