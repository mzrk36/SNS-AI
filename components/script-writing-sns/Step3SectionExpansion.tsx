import React from 'react';
import { OutlineSection, ExpandedSections } from './types';
import TextArea from './ui/TextArea';
import Button from './ui/Button';

interface Step3Props {
  outline: OutlineSection[];
  expansionPrompt: string;
  setExpansionPrompt: (value: string) => void;
  expandedSections: ExpandedSections;
  onExpandOne: (index: number) => void;
  onExpandAll: () => void;
  onSectionEdit: (index: number, content: string) => void;
  onMerge: () => void;
  isLoading: boolean;
  expansionProgress: number;
}

const Step3SectionExpansion: React.FC<Step3Props> = ({
  outline, expansionPrompt, setExpansionPrompt, expandedSections,
  onExpandOne, onExpandAll, onSectionEdit, onMerge,
  isLoading, expansionProgress
}) => {
  const allExpanded = outline.length > 0 && outline.every((_, index) => expandedSections[index]);

  return (
    <div className="space-y-8">
      <div>
        <TextArea
          label="Outline Expansion Prompt"
          rows={4}
          value={expansionPrompt}
          onChange={(e) => setExpansionPrompt(e.target.value)}
          placeholder="e.g., Write in a clear, conversational, and slightly humorous tone. Use simple language and provide analogies to explain complex topics."
          disabled={isLoading}
        />
        <div className="mt-4 flex justify-end gap-4">
          <Button
            variant="secondary"
            onClick={onExpandAll}
            isLoading={isLoading && expansionProgress > 0}
            disabled={allExpanded || isLoading}
          >
            {isLoading && expansionProgress > 0 ? `Expanding... (${Math.round(expansionProgress * 100)}%)` : 'Expand All Sections at Once'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {outline.map((section, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">{index + 1}. {section.title}</h3>
            {expandedSections[index] !== undefined ? (
              <TextArea
                label=""
                rows={10}
                value={expandedSections[index]}
                onChange={(e) => onSectionEdit(index, e.target.value)}
                className="!p-0 !bg-transparent !border-none"
              />
            ) : (
              <div className="flex flex-col items-start gap-4">
                <p className="text-gray-300 italic">{section.summary}</p>
                <Button
                  variant="secondary"
                  onClick={() => onExpandOne(index)}
                  isLoading={isLoading && expansionProgress === 0}
                  disabled={isLoading}
                  className="py-2 px-4 text-sm"
                >
                  Expand Section
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {allExpanded && (
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button onClick={onMerge} disabled={isLoading}>
            Merge & Finalize Script
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step3SectionExpansion;
