import React, { useState } from 'react';
import { generateLogo } from '../services/geminiService';
import LogoIcon from './icons/LogoIcon';
import DownloadIcon from './icons/DownloadIcon';

const logoStyles = [
  "Minimalist Flat Design", "Neon Cyberpunk", "Retro '80s Aesthetic",
  "Modern Geometric", "Hand-drawn Cartoon", "Luxury Corporate",
  "3D Rendered", "Abstract Art"
];

const colorPalette = [
  { name: 'Blue', value: '#3B82F6' }, { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#22C55E' }, { name: 'Yellow', value: '#EAB308' },
  { name: 'Purple', value: '#8B5CF6' }, { name: 'Black', value: '#1F2937' },
  { name: 'White', value: '#F9FAFB' }
];

const FormInput: React.FC<{ name: string; label: string; placeholder: string; description: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean }> = ({ name, label, placeholder, description, value, onChange, disabled }) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-200">{label}</label>
      <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
      />
      <p className="mt-1 text-xs text-gray-400">{description}</p>
  </div>
);

const LogoGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    channelName: '',
    channelNiche: '',
    logoStyle: logoStyles[0],
    primaryColors: [] as string[],
    additionalKeywords: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (colorName: string) => {
    setFormData(prev => {
      const newColors = prev.primaryColors.includes(colorName)
        ? prev.primaryColors.filter(c => c !== colorName)
        : [...prev.primaryColors, colorName];
      // Limit to 2 colors
      if (newColors.length > 2) {
        return prev;
      }
      return { ...prev, primaryColors: newColors };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.channelName || !formData.channelNiche || isLoading) return;

    setIsLoading(true);
    setImageUrl(null);
    setError(null);

    const result = await generateLogo(formData);

    if (result) {
      setImageUrl(result);
    } else {
      setError('Failed to generate logo. Please try again.');
    }

    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const safeFilename = formData.channelName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    link.download = `${safeFilename || 'generated-logo'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 h-fit">
        <h2 className="text-2xl font-bold mb-6 text-white">Design Your Channel Logo</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput name="channelName" label="Channel Name" placeholder="Your Channel Name" description="This will be the primary text in your logo." value={formData.channelName} onChange={handleInputChange} disabled={isLoading} />
          <FormInput name="channelNiche" label="Channel Niche/Topic" placeholder="e.g., Gaming, Cooking, Tech Reviews" description="What is your channel about? This informs the symbols and imagery." value={formData.channelNiche} onChange={handleInputChange} disabled={isLoading} />

          <div>
            <label htmlFor="logoStyle" className="block text-sm font-medium text-gray-200">Desired Logo Style</label>
            <select id="logoStyle" name="logoStyle" value={formData.logoStyle} onChange={handleInputChange} disabled={isLoading} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200">
              {logoStyles.map(style => <option key={style} value={style}>{style}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-400">Select the artistic style that best represents your brand.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Primary Color Palette (Choose up to 2)</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {colorPalette.map(color => (
                <button type="button" key={color.name} onClick={() => handleColorSelect(color.name)} disabled={isLoading} className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${formData.primaryColors.includes(color.name) ? 'border-white ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'border-transparent'}`} style={{ backgroundColor: color.value }} aria-label={`Select ${color.name}`}></button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">Choose up to two primary colors for your logo.</p>
          </div>
          
          <FormInput name="additionalKeywords" label="Additional Keywords (Optional)" placeholder="e.g., 'robot mascot', 'stylized fire'" description="Add extra details to refine your logo design." value={formData.additionalKeywords} onChange={handleInputChange} disabled={isLoading} />

          <button type="submit" disabled={isLoading || !formData.channelName || !formData.channelNiche} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg">
            <LogoIcon className="w-6 h-6 mr-3" />
            {isLoading ? 'Generating...' : 'Generate Logo'}
          </button>
        </form>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-xl p-6 min-h-[500px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center text-gray-400">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg">Generating your masterpiece...</p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center">
            <p className="font-semibold">An Error Occurred</p>
            <p>{error}</p>
          </div>
        ) : imageUrl ? (
          <div className="text-center">
            <div className="relative group w-80 h-80 mx-auto">
              <img src={imageUrl} alt="Generated Logo" className="rounded-lg shadow-lg w-full h-full object-contain" />
            </div>
            <button onClick={handleDownload} className="mt-6 flex items-center justify-center mx-auto px-5 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors">
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download Logo
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <LogoIcon className="w-24 h-24 mx-auto mb-4" />
            <p className="text-xl">Your generated logo will appear here.</p>
            <p>Fill out the form to create your unique brand identity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoGenerator;