import React from 'react';

// A helper component for styled code blocks
const CodeBlock: React.FC<{ children: React.ReactNode, language?: string }> = ({ children, language }) => (
    <pre className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 overflow-x-auto">
        <code className={`font-mono text-sm ${language ? `language-${language}` : ''} text-gray-300`}>
            {children}
        </code>
    </pre>
);

// A helper for section titles
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b-2 border-blue-500 pb-2">{children}</h2>
);

// A helper for sub-titles
const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-semibold text-blue-400 mt-6 mb-3">{children}</h3>
);

// A helper for definition lists
const Definition: React.FC<{ term: string; children: React.ReactNode }> = ({ term, children }) => (
    <div className="mt-2">
        <p className="font-semibold text-gray-200">{term}:</p>
        <p className="text-gray-400 ml-4">{children}</p>
    </div>
);

const ProjectBlueprint: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Project Blueprint: Muzu Thumbnail Generator</h1>
        <p className="text-gray-400 mb-6">
            This application is a sophisticated tool that leverages multiple AI models for a seamless user experience. It has two primary user journeys: Text-to-Thumbnail and Image-to-Thumbnail. This document breaks down the core AI prompts, settings, and logic that power the application.
        </p>

        <SectionTitle>1. Prompt for Enhancing a Text Idea</SectionTitle>
        <p className="text-gray-400">
            This is used when the user chooses the "Start with a Text Idea" flow. The goal is to transform a simple user idea into a rich, detailed prompt suitable for an image generator.
        </p>
        <Definition term="File">services/geminiService.ts</Definition>
        <Definition term="Function">enhancePrompt()</Definition>
        <Definition term="AI Model">gemini-2.5-flash</Definition>

        <SubTitle>Core Prompt (System Instruction)</SubTitle>
        <p className="text-gray-400 mb-2">This prompt sets the context and rules for the AI, telling it to act as an expert prompt engineer.</p>
        <CodeBlock>
{`You are an expert prompt engineer for AI image generators. Your task is to take a user's simple idea and expand it into a detailed, vivid, single-sentence prompt suitable for generating a high-quality, viral YouTube thumbnail. The style should be eye-catching and dynamic. If the user provides optional overlay text, you must incorporate instructions for rendering that text into the prompt. The text description should be stylistic (e.g., 'bold, glowing yellow text', 'modern sans-serif font') and placed appropriately for maximum impact.`}
        </CodeBlock>

        <SubTitle>User Input to the AI</SubTitle>
        <p className="text-gray-400 mb-2">The user's idea and optional overlay text are combined into a simple string format like this:</p>
        <CodeBlock>
{`User Idea: "A cat discovering a hidden treasure chest on a mysterious island"
Optional Overlay Text: "YOU WON'T BELIEVE THIS!"`}
        </CodeBlock>


        <SectionTitle>2. Prompt for Analyzing an Existing Image</SectionTitle>
        <p className="text-gray-400">
            Used for the "Reimagine from an Image" flow, this prompt has the AI analyze an uploaded image and deconstruct it into structured data and a new, descriptive prompt.
        </p>
        <Definition term="File">services/geminiService.ts</Definition>
        <Definition term="Function">analyzeImageAndCreatePrompt()</Definition>
        <Definition term="AI Model">gemini-2.5-flash</Definition>

        <SubTitle>Core Prompt (Text Instruction)</SubTitle>
        <p className="text-gray-400 mb-2">This text is sent to the model along with the user's image.</p>
        <CodeBlock>
{`You are a world-class thumbnail analyst. Your task is to meticulously analyze the provided image and generate a JSON object containing a detailed breakdown and a concise, single-sentence, recreation-ready prompt for an AI image generator. The JSON output must strictly adhere to the provided schema.`}
        </CodeBlock>

        <SubTitle>Key Setting: JSON Output Schema</SubTitle>
        <p className="text-gray-400 mb-2">
            This is the most important "setting" for this function. The application forces the AI to provide its answer in a specific JSON format, ensuring the output is always predictable and usable. The schema defines the exact "thumbnail settings" the AI must analyze:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li><span className="font-semibold text-gray-300">mainSubjects:</span> "Who/what is the focus, their pose, angle, size."</li>
            <li><span className="font-semibold text-gray-300">styleAndMedium:</span> "Cartoon, 3D, photorealistic, cinematic, sketch, flat vector, etc."</li>
            <li><span className="font-semibold text-gray-300">colorPaletteAndMood:</span> "Dominant colors, overall emotional tone."</li>
            <li><span className="font-semibold text-gray-300">textElements:</span> "Font style, text placement, text colors, outline effects. State 'None' if no text is present."</li>
            <li><span className="font-semibold text-gray-300">background:</span> "Solid color, gradient, realistic scene, abstract shapes, blurred, etc."</li>
            <li><span className="font-semibold text-gray-300">compositionAndLayout:</span> "Subject placement, framing, layering (foreground/background)."</li>
            <li><span className="font-semibold text-gray-300">specialEffects:</span> "Glow, highlights, shadows, arrows, motion blur, overlays."</li>
            <li><span className="font-semibold text-gray-300">finalPrompt:</span> A concluding, single-sentence prompt that combines all the analysis points, ready for image generation.</li>
        </ul>
        

        <SectionTitle>3. Settings for Final Image Generation</SectionTitle>
        <p className="text-gray-400">
            This is the final step for both flows. It takes the text prompt (either enhanced from an idea or generated from an image analysis) and creates the visual thumbnail.
        </p>
        <Definition term="File">services/geminiService.ts</Definition>
        <Definition term="Function">generateImage()</Definition>
        <Definition term="AI Model">imagen-4.0-generate-001</Definition>
        
        <SubTitle>Prompt</SubTitle>
        <p className="text-gray-400 mb-2">The prompt for this step is simply the string output from either the `enhancePrompt` or `analyzeImageAndCreatePrompt` function.</p>

        <SubTitle>Thumbnail Generation Settings (Configuration)</SubTitle>
        <p className="text-gray-400 mb-2">These settings are passed to the imagen model to control the output image's properties.</p>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li><span className="font-semibold text-gray-300">numberOfImages: 1</span> - Instructs the AI to generate only one image per request.</li>
            <li><span className="font-semibold text-gray-300">outputMimeType: 'image/png'</span> - Specifies the desired file format for the output.</li>
            <li><span className="font-semibold text-gray-300">aspectRatio: '16:9'</span> - This is a critical setting that forces the image to be generated in the standard widescreen aspect ratio used for YouTube thumbnails.</li>
        </ul>
    </div>
  );
};

export default ProjectBlueprint;