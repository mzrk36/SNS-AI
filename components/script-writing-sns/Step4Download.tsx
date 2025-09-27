import React from 'react';
import Button from './ui/Button';

interface Step4Props {
  finalScript: string;
  onRestart: () => void;
}

const Step4Download: React.FC<Step4Props> = ({ finalScript, onRestart }) => {
  
  const handleDownload = () => {
    const blob = new Blob([finalScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script-by-muzu.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Your Final Script is Ready!</h2>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-sans text-gray-300">{finalScript}</pre>
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="secondary" onClick={onRestart}>
          Start New Project
        </Button>
        <Button onClick={handleDownload}>
          Download Script (.txt)
        </Button>
      </div>
    </div>
  );
};

export default Step4Download;