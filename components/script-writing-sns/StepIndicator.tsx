import React from 'react';
import { Step } from './types';

interface StepIndicatorProps {
  currentStep: Step;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: Step.INIT, label: 'Project Init' },
    { id: Step.OUTLINE, label: 'Outline' },
    { id: Step.EXPANSION, label: 'Expansion' },
    { id: Step.DOWNLOAD, label: 'Download' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted ? 'bg-blue-600 border-2 border-blue-600' : ''}
                    ${isCurrent ? 'border-2 border-blue-500' : ''}
                    ${!isCompleted && !isCurrent ? 'border-2 border-gray-600' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  ) : (
                    <span className="text-gray-400">{step.id}</span>
                  )}
                </div>
                <p className={`mt-2 text-sm text-center ${isCurrent || isCompleted ? 'text-white' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 transition-colors duration-300 ${isCompleted ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
