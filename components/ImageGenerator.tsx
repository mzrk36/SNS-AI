import React, { useState } from 'react';
import { generateImage, enhancePrompt } from '../services/geminiService';
import { ImageIcon, CollectionIcon } from './icons/ImageIcon';
import DownloadIcon from './icons/DownloadIcon';

type GenerationMode = 'single' | 'bulk';

interface BulkResult {
    id: string;
    originalPrompt: string;
    modifiedPrompt?: string;
    imageUrl?: string;
    isLoading: boolean;
    error?: string;
}


const aspectRatios = [
  { value: '16:9', label: 'Thumbnail (16:9)' },
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Story (9:16)' },
  { value: '4:3', label: 'Classic (4:3)' },
];

const ImageGenerator: React.FC = () => {
  // Common State
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(true);

  // Mode State
  const [generationMode, setGenerationMode] = useState<GenerationMode>('single');

  // Single Mode State
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modifiedPrompt, setModifiedPrompt] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Bulk Mode State
  const [bulkPrompts, setBulkPrompts] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);


  const handleSingleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl(null);
    setError(null);
    setModifiedPrompt(null);
    
    let finalPrompt = prompt;

    if (enhancePromptEnabled) {
      setLoadingMessage('Enhancing prompt for high-CTR...');
      try {
        const enhanced = await enhancePrompt(prompt);
        finalPrompt = enhanced;
        setModifiedPrompt(enhanced);
      } catch (e) {
        console.error("Could not enhance prompt, using original.", e);
        finalPrompt = prompt;
      }
    }
    
    setLoadingMessage('Generating your masterpiece...');
    const result = await generateImage(finalPrompt, aspectRatio);
    
    if (result) {
      setImageUrl(result);
    } else {
      setError('Failed to generate image. Please try again.');
    }
    
    setIsLoading(false);
    setLoadingMessage('');
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawLines = bulkPrompts.split('\n').map(p => p.trim()).filter(p => p !== '');
    if (rawLines.length === 0 || isBulkLoading) return;

    const processedPrompts = rawLines.map(line => {
      // 1. Strip leading list markers like "1. " or "1) "
      let cleanLine = line.replace(/^\s*\d+[\.\)]\s*/, '');
      
      // 2. Look for "overlay text" in quotes at the end of the line
      const overlayRegex = /"([^"]+)"\s*$/;
      const match = cleanLine.match(overlayRegex);

      let mainPrompt = cleanLine;
      let overlayText: string | undefined = undefined;

      if (match) {
          overlayText = match[1]; // The text inside the quotes
          mainPrompt = cleanLine.replace(overlayRegex, '').trim(); // The rest of the line is the prompt
      }
      
      return { originalPrompt: line, mainPrompt, overlayText };
    }).slice(0, 5); // Limit to 5 prompts

    setIsBulkLoading(true);
    setBulkResults([]);

    const initialResults: BulkResult[] = processedPrompts.map((p, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      originalPrompt: p.originalPrompt,
      isLoading: true,
    }));
    setBulkResults(initialResults);

    for (let i = 0; i < processedPrompts.length; i++) {
      const { mainPrompt, overlayText } = processedPrompts[i];
      try {
        let finalPrompt = mainPrompt;
        let modifiedPromptVal: string | undefined;

        if (enhancePromptEnabled) {
          const enhanced = await enhancePrompt(mainPrompt, overlayText);
          finalPrompt = enhanced;
          modifiedPromptVal = enhanced;
        } else if (overlayText) {
          // If not enhancing, but there's overlay text, just append it.
          finalPrompt += ` with text "${overlayText}"`;
        }

        const resultUrl = await generateImage(finalPrompt, aspectRatio);

        if (!resultUrl) {
          throw new Error('Image generation returned no result.');
        }

        setBulkResults(prev => prev.map((res, index) =>
          index === i ? { ...res, imageUrl: resultUrl, modifiedPrompt: modifiedPromptVal, isLoading: false } : res
        ));
      } catch (err: any) {
        setBulkResults(prev => prev.map((res, index) =>
          index === i ? { ...res, error: err.message || 'An unknown error occurred.', isLoading: false } : res
        ));
      }
    }

    setIsBulkLoading(false);
  };


  const handleDownload = (url: string, p: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const safeFilename = p.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    link.download = `${safeFilename || 'generated-thumbnail'}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSingleMode = () => (
    <>
      <form onSubmit={handleSingleGenerate}>
        <div className="flex flex-col md:flex-row items-start gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A vibrant thumbnail for a video about deep sea creatures"
            rows={3}
            className="flex-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full md:w-auto px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Generate Thumbnail
          </button>
        </div>
      </form>
      {modifiedPrompt && !isLoading && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">High-CTR Prompt Used:</h3>
          <p className="text-gray-300 text-sm font-mono">{modifiedPrompt}</p>
        </div>
      )}
    </>
  );

  const renderBulkMode = () => (
    <form onSubmit={handleBulkGenerate}>
      <div className="flex flex-col md:flex-row items-start gap-4">
        <textarea
          value={bulkPrompts}
          onChange={(e) => setBulkPrompts(e.target.value)}
          placeholder="Enter up to 5 prompts, one per line..."
          rows={5}
          className="flex-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none"
          disabled={isBulkLoading}
        />
        <button
          type="submit"
          disabled={isBulkLoading || !bulkPrompts.trim()}
          className="w-full md:w-auto px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <CollectionIcon className="w-5 h-5 mr-2" />
          Generate Bulk
        </button>
      </div>
    </form>
  );

  const renderSingleResult = () => (
    <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 min-h-[400px] flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center text-gray-400">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">{loadingMessage}</p>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center">
          <p className="font-semibold">An Error Occurred</p>
          <p>{error}</p>
        </div>
      ) : imageUrl ? (
         <div className="relative group">
          <img src={imageUrl} alt={prompt} className="rounded-lg shadow-lg max-w-full max-h-[512px]" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
              <button
                  onClick={() => handleDownload(imageUrl, prompt)}
                  className="flex items-center justify-center px-5 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                  aria-label="Download image"
              >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download
              </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">Your generated thumbnail will appear here.</p>
          <p>Select an aspect ratio, enter a prompt, and click "Generate".</p>
        </div>
      )}
    </div>
  );

  const renderBulkResults = () => (
    <div className="mt-8">
      {bulkResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bulkResults.map((result) => (
            <div key={result.id} className="bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col">
              <div className="aspect-video bg-gray-700 rounded-md flex items-center justify-center mb-4 relative group">
                {result.isLoading && (
                  <div className="flex flex-col items-center text-gray-400">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-2 text-sm">Generating...</p>
                  </div>
                )}
                {result.error && <p className="text-red-400 text-center text-sm p-2">{result.error}</p>}
                {result.imageUrl && (
                  <>
                    <img src={result.imageUrl} alt={result.originalPrompt} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                      <button
                        onClick={() => handleDownload(result.imageUrl!, result.originalPrompt)}
                        className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                        aria-label="Download image"
                      >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate" title={result.originalPrompt}>{result.originalPrompt}</p>
              {result.modifiedPrompt && (
                <p className="text-xs text-blue-400/70 mt-1 truncate" title={result.modifiedPrompt}>Enhanced: {result.modifiedPrompt}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <CollectionIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">Your bulk generated thumbnails will appear here.</p>
            <p>Enter up to 5 prompts and click "Generate Bulk".</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="mb-6 flex border-b border-gray-700">
            <button onClick={() => setGenerationMode('single')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${generationMode === 'single' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                <ImageIcon className="w-5 h-5"/> Single Thumbnail
            </button>
            <button onClick={() => setGenerationMode('bulk')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${generationMode === 'bulk' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                <CollectionIcon className="w-5 h-5"/> Bulk Generator
            </button>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <label htmlFor="enhance-toggle" className="flex items-center cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                id="enhance-toggle" 
                className="sr-only" 
                checked={enhancePromptEnabled}
                onChange={() => setEnhancePromptEnabled(!enhancePromptEnabled)}
                disabled={isLoading || isBulkLoading}
              />
              <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enhancePromptEnabled ? 'translate-x-6 bg-blue-500' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-400 font-medium group-hover:text-white transition-colors">
              Auto-Enhance for High-CTR Thumbnail
            </div>
          </label>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {aspectRatios.map(ratio => (
            <button
              key={ratio.value}
              type="button"
              onClick={() => setAspectRatio(ratio.value)}
              disabled={isLoading || isBulkLoading}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                aspectRatio === ratio.value
                  ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {generationMode === 'single' ? renderSingleMode() : renderBulkMode()}
      </div>

      {generationMode === 'single' ? renderSingleResult() : renderBulkResults()}
    </div>
  );
};

export default ImageGenerator;