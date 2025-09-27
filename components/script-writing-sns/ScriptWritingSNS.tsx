import React, { useState } from 'react';
import { Step, OutlineSection, ExpandedSections } from './types';
import { generateScriptOutline, expandScriptSection } from '../../services/geminiService';
import StepIndicator from './StepIndicator';
import Loader from './ui/Loader';
import Step1ProjectInit from './Step1ProjectInit';
import Step2OutlineDisplay from './Step2OutlineDisplay';
import Step3SectionExpansion from './Step3SectionExpansion';
import Step4Download from './Step4Download';

const ScriptWritingMuzu: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INIT);
  const [videoTitle, setVideoTitle] = useState('');
  const [outlinePrompt, setOutlinePrompt] = useState('');
  const [expansionPrompt, setExpansionPrompt] = useState('Write in a clear, conversational, and engaging tone. Use simple language and provide analogies to explain complex topics.');
  
  const [generatedOutline, setGeneratedOutline] = useState<OutlineSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});
  const [finalScript, setFinalScript] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expansionProgress, setExpansionProgress] = useState(0);

  const resetState = () => {
    setCurrentStep(Step.INIT);
    setVideoTitle('');
    setOutlinePrompt('');
    setGeneratedOutline([]);
    setExpandedSections({});
    setFinalScript('');
    setIsLoading(false);
    setErrorMessage(null);
    setExpansionProgress(0);
  };

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    setLoadingMessage('Generating your script outline...');
    setErrorMessage(null);
    try {
      const outline = await generateScriptOutline(outlinePrompt, videoTitle);
      setGeneratedOutline(outline);
      setCurrentStep(Step.OUTLINE);
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandOne = async (index: number) => {
    if (expandedSections[index]) return; // Already expanded

    setIsLoading(true);
    setLoadingMessage(`Expanding section ${index + 1}...`);
    setErrorMessage(null);
    setExpansionProgress(0);

    try {
      const scriptContent = await expandScriptSection(expansionPrompt, generatedOutline[index]);
      setExpandedSections(prev => ({ ...prev, [index]: scriptContent }));
    } catch (error: any) {
      setErrorMessage(error.message || `Failed to expand section ${index + 1}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandAll = async () => {
    setIsLoading(true);
    setLoadingMessage('Expanding all sections...');
    setErrorMessage(null);

    const sectionsToExpand = generatedOutline.map((_, i) => i).filter(i => !expandedSections[i]);
    
    for (let i = 0; i < sectionsToExpand.length; i++) {
        const index = sectionsToExpand[i];
        setExpansionProgress((i) / sectionsToExpand.length);
        setLoadingMessage(`Expanding section ${index + 1} of ${generatedOutline.length}...`);
        try {
            const scriptContent = await expandScriptSection(expansionPrompt, generatedOutline[index]);
            setExpandedSections(prev => ({ ...prev, [index]: scriptContent }));
        } catch (error: any) {
            setErrorMessage(`Error on section ${index + 1}: ${error.message}. Process stopped.`);
            setIsLoading(false);
            return;
        }
    }
    
    setExpansionProgress(1);
    setIsLoading(false);
  };

  const handleSectionEdit = (index: number, content: string) => {
    setExpandedSections(prev => ({ ...prev, [index]: content }));
  };

  const handleMergeScript = () => {
    const scriptParts = generatedOutline.map((section, index) => {
        return `## ${index + 1}. ${section.title}\n\n${expandedSections[index] || ''}`;
    });
    setFinalScript(scriptParts.join('\n\n---\n\n'));
    setCurrentStep(Step.DOWNLOAD);
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case Step.INIT:
        return <Step1ProjectInit 
            videoTitle={videoTitle} setVideoTitle={setVideoTitle}
            outlinePrompt={outlinePrompt} setOutlinePrompt={setOutlinePrompt}
            onGenerate={handleGenerateOutline} isLoading={isLoading}
        />;
      case Step.OUTLINE:
        return <Step2OutlineDisplay 
            outline={generatedOutline}
            onProceed={() => setCurrentStep(Step.EXPANSION)}
        />;
      case Step.EXPANSION:
        return <Step3SectionExpansion
            outline={generatedOutline}
            expansionPrompt={expansionPrompt} setExpansionPrompt={setExpansionPrompt}
            expandedSections={expandedSections}
            onExpandOne={handleExpandOne}
            onExpandAll={handleExpandAll}
            onSectionEdit={handleSectionEdit}
            onMerge={handleMergeScript}
            isLoading={isLoading}
            expansionProgress={expansionProgress}
        />;
      case Step.DOWNLOAD:
        return <Step4Download finalScript={finalScript} onRestart={resetState} />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isLoading && expansionProgress === 0 && <Loader message={loadingMessage} />}
      <StepIndicator currentStep={currentStep} />
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        {errorMessage && (
            <div className="p-4 mb-6 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">
                <p className="font-bold">An Error Occurred</p>
                <p>{errorMessage}</p>
            </div>
        )}
        {renderCurrentStep()}
      </div>
      <footer className="text-center text-gray-500 text-sm mt-8">
        <p>&copy; {new Date().getFullYear()} Script Writing by Muzu. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ScriptWritingMuzu;