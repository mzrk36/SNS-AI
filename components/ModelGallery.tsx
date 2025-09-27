
import React, { useState } from 'react';
import { Model, BackendType } from '../types';

const initialModels: Model[] = [
  { id: '1', name: 'Llama-3.2-8B-Instruct', backend: BackendType.LlamaCpp, description: 'State-of-the-art, high-performance LLM by Meta.', source: 'huggingface://meta-llama/Llama-3.2-8B-Instruct-GGUF', loaded: true },
  { id: '2', name: 'Whisper-Large-v3', backend: BackendType.WhisperCpp, description: 'Robust speech recognition model by OpenAI.', source: 'huggingface://openai/whisper-large-v3', loaded: false },
  { id: '3', name: 'Stable-Diffusion-XL', backend: BackendType.StableDiffusionCpp, description: 'High-quality text-to-image generation.', source: 'huggingface://stabilityai/stable-diffusion-xl-base-1.0', loaded: true },
  { id: '4', name: 'GPT-2', backend: BackendType.Transformers, description: 'A classic transformer model for text generation.', source: 'local://models/gpt2.gguf', loaded: false },
  { id: '5', name: 'Mixtral-8x7B', backend: BackendType.vLLM, description: 'High-throughput sparse mixture of experts model.', source: 'huggingface://mistralai/Mixtral-8x7B-Instruct-v0.1', loaded: false },
  { id: '6', name: 'Bark', backend: BackendType.BarkCpp, description: 'A transformer-based text-to-audio model.', source: 'huggingface://suno/bark', loaded: false },
];

const backendColors: Record<BackendType, string> = {
  [BackendType.LlamaCpp]: 'bg-green-500/20 text-green-300',
  [BackendType.WhisperCpp]: 'bg-blue-500/20 text-blue-300',
  [BackendType.StableDiffusionCpp]: 'bg-purple-500/20 text-purple-300',
  [BackendType.Transformers]: 'bg-yellow-500/20 text-yellow-300',
  [BackendType.vLLM]: 'bg-red-500/20 text-red-300',
  [BackendType.BarkCpp]: 'bg-indigo-500/20 text-indigo-300',
};

const ModelCard: React.FC<{ model: Model; onToggle: (id: string) => void; }> = ({ model, onToggle }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-blue-500 border border-transparent">
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-white">{model.name}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${backendColors[model.backend]}`}>
          {model.backend}
        </span>
      </div>
      <p className="text-gray-400 mt-2 text-sm">{model.description}</p>
      <p className="text-gray-500 mt-4 text-xs truncate">Source: {model.source}</p>
    </div>
    <div className="mt-6 flex justify-between items-center">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${model.loaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className={`text-sm font-medium ${model.loaded ? 'text-green-400' : 'text-red-400'}`}>
          {model.loaded ? 'Loaded' : 'Not Loaded'}
        </span>
      </div>
      <button 
        onClick={() => onToggle(model.id)}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
          model.loaded 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {model.loaded ? 'Unload' : 'Load'}
      </button>
    </div>
  </div>
);

const ModelGallery: React.FC = () => {
  const [models, setModels] = useState<Model[]>(initialModels);

  const handleToggleLoad = (id: string) => {
    setModels(prevModels =>
      prevModels.map(model =>
        model.id === id ? { ...model, loaded: !model.loaded } : model
      )
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map(model => (
        <ModelCard key={model.id} model={model} onToggle={handleToggleLoad} />
      ))}
    </div>
  );
};

export default ModelGallery;
