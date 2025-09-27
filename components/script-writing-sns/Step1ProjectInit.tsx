import React from 'react';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Button from './ui/Button';

interface Step1Props {
  videoTitle: string;
  setVideoTitle: (value: string) => void;
  outlinePrompt: string;
  setOutlinePrompt: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const Step1ProjectInit: React.FC<Step1Props> = ({ videoTitle, setVideoTitle, outlinePrompt, setOutlinePrompt, onGenerate, isLoading }) => {
  return (
    <div className="space-y-6">
      <TextArea
        label="Detailed Outline Generation Prompt"
        rows={6}
        value={outlinePrompt}
        onChange={(e) => setOutlinePrompt(e.target.value)}
        placeholder="e.g., Create a script outline for a video explaining the basics of quantum computing. Start with a simple analogy, cover superposition and entanglement, and end with real-world applications..."
        disabled={isLoading}
      />
      <Input
        label="Video Title"
        type="text"
        value={videoTitle}
        onChange={(e) => setVideoTitle(e.target.value)}
        placeholder="e.g., Quantum Computing Explained for Beginners"
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          isLoading={isLoading}
          disabled={!videoTitle.trim() || !outlinePrompt.trim()}
        >
          Generate Outline
        </Button>
      </div>
    </div>
  );
};

export default Step1ProjectInit;
