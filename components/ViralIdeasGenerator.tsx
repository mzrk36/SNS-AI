import React, { useState } from 'react';
import { analyzeCompetitorData } from '../services/geminiService';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';

type Step = 'input' | 'analysis' | 'generators';

interface CompetitorData {
  id: number;
  transcript: string;
  comments: string;
}

const ScriptPromptGenerator: React.FC = () => {
    const [step, setStep] = useState<Step>('input');
    const [competitorData, setCompetitorData] = useState<CompetitorData[]>([
        { id: 1, transcript: '', comments: '' },
        { id: 2, transcript: '', comments: '' },
    ]);
    const [analysisResult, setAnalysisResult] = useState('');
    const [outlineWordCount, setOutlineWordCount] = useState(8000);
    const [outlineSectionCount, setOutlineSectionCount] = useState(10);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleDataChange = (id: number, field: 'transcript' | 'comments', value: string) => {
        setCompetitorData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addCompetitor = () => {
        if (competitorData.length < 5) {
            setCompetitorData(prev => [...prev, { id: Date.now(), transcript: '', comments: '' }]);
        }
    };

    const removeCompetitor = (id: number) => {
        setCompetitorData(prev => prev.filter(item => item.id !== id));
    };

    const handleAnalyze = async () => {
        const hasData = competitorData.some(d => d.transcript.trim() || d.comments.trim());
        if (!hasData) {
            setError('Please paste at least one transcript or set of comments.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeCompetitorData(competitorData);
            setAnalysisResult(result);
            setStep('analysis');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProceedToGenerators = () => {
        setStep('generators');
    };

    const handleReset = () => {
        setStep('input');
        setCompetitorData([
            { id: 1, transcript: '', comments: '' },
            { id: 2, transcript: '', comments: '' },
        ]);
        setAnalysisResult('');
        setError(null);
        setIsLoading(false);
    };

    const handleBack = () => {
        setError(null);
        if (step === 'generators') setStep('analysis');
        else if (step === 'analysis') setStep('input');
    };
    
    const getOutlinePrompt = () => `ROLE
You are a senior narrative strategist specializing in “silent revenge / strategic comeback” stories for YouTube and social platforms. Your task is to produce a detailed outline for a single ${outlineWordCount}-word script that mirrors top performers in this niche: first-person voice, calm power, high-plausibility tactics, and a satisfying status-reversal payoff.

OBJECTIVE
Create a ${outlineSectionCount}-section outline (names + exact word counts + short summaries) for an ${outlineWordCount}-word script that:
- Flows logically from violation → reframe → strategy → reveal → escalation → confrontation → resolution → grace note.
- Uses contrast framing to sustain attention (e.g., silence vs noise, exclusion vs access, chaos vs control, past vs future, revenge vs resolution).
- Aligns with the competitors’ tone and audience: dignified, surgical, detail-rich, emotionally restrained, with legal/financial realism and cathartic closure.

INPUT (you will receive only this)
- VIDEO TITLE: “[VIDEO_TITLE]”

INTERPRETATION GUIDELINES
- Infer the scenario, protagonist POV (first-person), antagonists, and stakes from the title.
- Assume the audience is predominantly women 25–54 who identify as overlooked/underestimated and want competence-forward, cathartic justice without melodrama.
- Tone: calm, precise, confident; “quiet blade” energy; sensory beats + concrete artifacts (texts, deeds, receipts, filings).
- Style hallmarks to include across the outline’s summaries:
  - A vivid sensory hook in Section 1.
  - At least one recurring motif (e.g., silence, keys, light, ocean/air, house/space) threaded across 3+ sections.
  - A “strategy montage” section with specific artifacts (documents, screenshots, calls, meetings).
  - One or two pattern interrupts (e.g., PI findings, deed reveal, venue switch, legal notice).
  - A face-to-face scene for the final boundary.
  - A final mic-drop identity line concept.
  - Realism anchors (plausible timelines, processes, sums; small frictions).

STRUCTURE REQUIREMENTS
- Number of sections: ${outlineSectionCount} (exactly).
- Word allocation: Assign a specific word count to each section; total must sum to exactly ${outlineWordCount} words.
- Distribution: Weight the middle (strategy, reveal, escalation, confrontation) more heavily than the opening and closing.
- Contrast framing: Each section’s summary must include one explicit contrast move (use “vs” or “but”).
- Engagement: Include one brief, organic audience prompt (CTA) in Section 4 or 5 and one at Section 9 or 10 (inside the summary).
- Do NOT write the script—only the outline.

OUTPUT FORMAT
Return a clean markdown table with exactly ${outlineSectionCount} rows and 3 columns:
- Section Name
- Word Allocation (integer)
- Summary (2–4 sentences; include: the beat’s purpose, the contrast move, any key artifacts/receipts, and the motif where relevant)

CONSTRAINTS & QUALITY GATES
- Sum check: After the table, print “Total Words:” followed by the sum (must equal ${outlineWordCount} exactly).
- Plausibility: Indicate 1 realism anchor in at least three different section summaries (e.g., waiting periods, legal steps, money figures).
- Open loops: Seed at least one open loop by Section 2 and resolve it by Section 8–10 (note this in the relevant summaries).
- Antagonist depth: Give antagonists at least one humanizing or plausible-motive note in summaries (raises stakes without excusing behavior).
- Closing: The final section’s summary must reference a future-facing plan and a mic-drop identity line concept.

REFERENCE BEAT MODEL (adapt names to fit the title)
1) Hook: Inciting violation + motif seed.
2) The Stillness: Shock → internal reframe (“resolution, not revenge”).
3) Stakes & Backstory via contrast (then vs now).
4) Decision & Plan: Strategy declared + first CTA.
5) Strategy Montage: Calls, documents, receipts (pattern interrupt).
6) First Reveal/Power Shift: Antagonist meets new reality.
7) Escalation & Cost: Pushback, consequences, small frictions (realism).
8) Showdown: Calm confrontation; open loop closes.
9) Resolution & Rebuild: Boundaries set; second CTA.
10) Grace Note & Future: Identity reframe + next chapter; mic-drop line concept.

NOW PRODUCE
Using only the provided VIDEO TITLE, generate the ${outlineSectionCount}-section outline table per the format above, with exact word allocations summing to ${outlineWordCount} and summaries that incorporate contrast framing, artifacts, motifs, realism anchors, and clear beat purposes. Do not write the script.`;

    const getExpansionPrompt = () => `ROLE
You are a professional human scriptwriter specializing in first-person, narrative storytelling in the “silent revenge / strategic comeback” niche. You write with calm power, high plausibility, and a satisfying status-reversal payoff. Your work must match or exceed top competitors’ quality.

GOAL
Expand ONE section of a larger ${outlineWordCount}-word script (the final script is ${outlineWordCount} words across all sections). For each request, write only the section provided by the user, at the exact word count specified.

TARGET AUDIENCE
Primarily women ages 25–54 who identify as overlooked or underestimated and seek competence-forward, cathartic justice without melodrama. They value dignity, realism, legal/financial savvy, and mic-drop boundaries.

SCRIPT STYLE
- Storytelling format: first-person confessional narrative (past tense with occasional present-tense moments for immediacy).
- Tone: calm, precise, confident; “quiet blade” energy.
- Texture: sensory details + concrete artifacts (“receipts” like texts, deeds, filings, emails).
- Realism: plausible timelines, steps, sums, and small frictions.
- Contrast framing: weave contrasts throughout (silence vs noise, exclusion vs access, chaos vs control, past vs future, revenge vs resolution).

INPUT YOU WILL RECEICE (only these three)
- Section Name (string, exactly as in the outline)
- Word Allocation (integer)
- Section Summary (2–4 sentences from the outline)

OUTPUT YOU MUST PRODUCE
- A plain script for that single section only.
- Start with the exact Section Name as a standalone heading on its own line.
- Then write the narrative paragraph(s) that fulfill the summary and allocated words.
- No voice-over directions. No scene instructions. No camera cues. No brackets. No bullet points. No extra commentary.

HARD CONSTRAINTS
- Write ONLY the requested section. Do not include or preview other sections.
- Word count must be EXACTLY the allocation (not 1 word more or less).
- Maintain transitional flow: open with a soft bridge from the prior beat (without summarizing previous sections) and end with a subtle pivot toward the next beat (without naming it).
- Keep it human-professional: varied sentence length, clean rhythm, precise diction, natural dialogue where needed.
- Hooks are required: the first 1–2 sentences of the section must re-capture attention.
- Apply contrast framing within the section (use “but,” “yet,” or implied oppositions).
- If the summary indicates CTAs for this section, integrate them organically as one or two sentences in-voice. Otherwise, exclude CTAs.
- Do not include headings like “Word Count,” “Summary,” or any meta text—only the heading and the script content.

WRITING RULES & TONE GUARDRAILS
- First-person voice; restrained emotion; confidence over anger.
- Show, don’t shout: use concrete actions and artifacts rather than rants.
- Legal/financial plausibility: incorporate realism anchors if the summary hints at them (e.g., waiting periods, notarization, bank hold times, costs).
- Recurring motif: if the outline/summary mentions a motif (e.g., keys, silence, ocean, light), thread it in subtly.
- Rhetorical mechanics: occasional parallelism and triads; crisp closing line per section.
- Antagonist depth: when relevant, include one humanizing detail or plausible motive (without excusing behavior).

TRANSITIONAL FLOW (MANDATORY)
- Opening bridge: 1–2 clauses that imply continuity from the previous beat (e.g., “By morning, the house had the quiet I asked for,” or “The invitation still sat in my inbox, but the decision no longer did”).
- Closing pivot: 1–2 clauses that naturally pull forward (e.g., “The papers were signed; now I needed proof,” or “If they wanted tradition, they could start with the truth”).

HOOKS & CONTRAST
- Begin each section with a mini-hook—an image, tension line, or unexpected fact that arrests attention.
- Include at least one explicit contrast (“but,” “yet,” “instead”) to keep momentum.

REALISM & RECEIPTS
- When the summary mentions procedures or assets, include specific, plausible artifacts (e.g., timestamps, document names, offices, fees) and small frictions (e.g., waiting for a transfer to clear).
- Keep figures reasonable and timelines believable for credibility.

CTA RULE
- Only include a CTA if the section summary explicitly calls for it. If included, it must feel organic and in-voice (e.g., a reflective question). Never break the narrative with platform instructions.

QUALITY CHECK BEFORE YOU OUTPUT
- Exact word count achieved.
- Section begins with the exact Section Name heading.
- Strong opening hook; clear contrast; subtle opening bridge and closing pivot.
- No meta text, directions, or formatting beyond the heading + narrative.

NOW EXPAND
Using the provided Section Name, Word Allocation, and Section Summary, write the section as a polished narrative that matches or exceeds competitor quality, targets the specified audience, and adheres to all constraints above. Remember: exact word count, professional human tone, hooks, contrast framing, realism, and seamless transitions.`;

    const getFullPromptText = () => {
        return `SCRIPT OUTLINE GENERATOR\n${'-'.repeat(25)}\n${getOutlinePrompt()}\n\n\nOUTLINE EXPANSION GENERATOR\n${'-'.repeat(25)}\n${getExpansionPrompt()}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getFullPromptText()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            setError("Failed to copy prompts to clipboard.");
        });
    };

    const handleDownload = () => {
        const text = getFullPromptText();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'script-generator-prompts.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderInputStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">1. Paste Competitor Data</h2>
                <p className="text-gray-400 mt-2">Provide transcripts and comments from your competitors' viral videos. Add up to 5 competitors for a more detailed analysis.</p>
            </div>
            {competitorData.map((data, index) => (
                <div key={data.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-white">Competitor {index + 1}</h3>
                        {competitorData.length > 2 && (
                            <button onClick={() => removeCompetitor(data.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-600 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <textarea value={data.transcript} onChange={(e) => handleDataChange(data.id, 'transcript', e.target.value)} placeholder={`Paste Transcript ${index + 1}...`} rows={8} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y" disabled={isLoading} />
                    <textarea value={data.comments} onChange={(e) => handleDataChange(data.id, 'comments', e.target.value)} placeholder={`Paste Comments ${index + 1}...`} rows={5} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-y" disabled={isLoading} />
                </div>
            ))}
            {competitorData.length < 5 && (
                <button onClick={addCompetitor} className="w-full py-2 text-blue-400 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-blue-500 transition-colors">
                    + Add Another Competitor
                </button>
            )}
            <button onClick={handleAnalyze} disabled={isLoading} className="w-full mt-4 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg">
                {isLoading ? 'Analyzing...' : 'Analyze Competitors'}
            </button>
        </div>
    );

    const renderAnalysisStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">2. Competitor Analysis Report</h2>
                <p className="text-gray-400 mt-2">Here is a detailed breakdown of your competitors' strategies based on the data you provided.</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg max-h-[60vh] overflow-y-auto border border-gray-700">
                <pre className="whitespace-pre-wrap font-sans text-gray-300">{analysisResult}</pre>
            </div>
            <button onClick={handleProceedToGenerators} className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center text-lg">
                Create Script Outline Generator
            </button>
        </div>
    );

    const renderGeneratorsStep = () => (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">3. Script Generator Prompts</h2>
                <p className="text-gray-400 mt-2">Configure and use these prompts to generate high-quality script outlines and full scripts.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <div>
                    <label htmlFor="word-count" className="block text-sm font-medium text-gray-200">Total Word Count</label>
                    <input type="number" id="word-count" value={outlineWordCount} onChange={e => setOutlineWordCount(Number(e.target.value))} step="100" min="1000" className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label htmlFor="section-count" className="block text-sm font-medium text-gray-200">Number of Sections</label>
                    <input type="number" id="section-count" value={outlineSectionCount} onChange={e => setOutlineSectionCount(Number(e.target.value))} min="2" max="20" className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
            <div className="relative bg-gray-900/50 p-4 rounded-lg max-h-[60vh] overflow-y-auto border border-gray-700 space-y-6">
                 <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        {isCopied ? 'Copied!' : 'Copy All'}
                    </button>
                     <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                        <DownloadIcon className="w-4 h-4" />
                        .txt
                    </button>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Script Outline Generator</h3>
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 bg-gray-800 p-3 rounded">{getOutlinePrompt()}</pre>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Outline Expansion Generator</h3>
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 bg-gray-800 p-3 rounded">{getExpansionPrompt()}</pre>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}
            
            {step === 'input' && renderInputStep()}
            {step === 'analysis' && renderAnalysisStep()}
            {step === 'generators' && renderGeneratorsStep()}
            
            {step !== 'input' && (
                <div className="flex justify-center items-center gap-6">
                    <button onClick={handleBack} disabled={isLoading} className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold disabled:opacity-50">
                        &larr; Back
                    </button>
                    <button onClick={handleReset} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold disabled:opacity-50">
                        Start Over
                    </button>
                </div>
            )}
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default ScriptPromptGenerator;