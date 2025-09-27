import React from 'react';
import { OutlineSection } from './types';
import Button from './ui/Button';

interface Step2Props {
  outline: OutlineSection[];
  onProceed: () => void;
}

const Step2OutlineDisplay: React.FC<Step2Props> = ({ outline, onProceed }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Generated Script Outline</h2>
      <div className="space-y-4">
        {outline.map((section, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">{index + 1}. {section.title}</h3>
            <p className="text-gray-300">{section.summary}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onProceed}>
          Proceed to Expansion &rarr;
        </Button>
      </div>
    </div>
  );
};

export default Step2OutlineDisplay;
