
import React, { useState } from 'react';

const AudioTools: React.FC = () => {
    const [transcribedText, setTranscribedText] = useState('');
    const [ttsText, setTtsText] = useState('Hello, this is a sample of text-to-speech audio.');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsTranscribing(true);
            setTranscribedText('');
            // Simulate transcription process
            setTimeout(() => {
                setTranscribedText(`This is a simulated transcription of the audio file: ${e.target.files![0].name}. The actual implementation would use a backend like whisper.cpp.`);
                setIsTranscribing(false);
            }, 3000);
        }
    };
    
    const handleTtsGenerate = () => {
        setIsGeneratingSpeech(true);
        // Simulate TTS generation
        setTimeout(() => {
            setIsGeneratingSpeech(false);
            alert("Audio generated! In a real app, this would provide a playable audio file.");
        }, 2000);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Speech to Text */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Speech to Text (Transcription)</h2>
                <p className="text-gray-400 mb-6">Upload an audio file to transcribe it into text. Powered by `whisper.cpp`.</p>
                
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <input type="file" id="audio-upload" className="hidden" accept="audio/*" onChange={handleFileChange} disabled={isTranscribing} />
                    <label htmlFor="audio-upload" className={`w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 ${isTranscribing ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        {isTranscribing ? 'Transcribing...' : 'Select Audio File'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">MP3, WAV, M4A up to 25MB.</p>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold text-white mb-2">Transcription Output:</h3>
                    <div className="bg-gray-700 p-4 rounded-lg min-h-[150px] text-gray-300">
                        {isTranscribing ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-400">Processing audio...</p>
                            </div>
                        ) : (
                            transcribedText || <p className="text-gray-500">Output will appear here...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Text to Speech */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Text to Speech (Generation)</h2>
                <p className="text-gray-400 mb-6">Enter text to generate speech audio. Powered by `bark.cpp`.</p>

                <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    rows={6}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none"
                    disabled={isGeneratingSpeech}
                />
                <button
                    onClick={handleTtsGenerate}
                    disabled={isGeneratingSpeech || !ttsText.trim()}
                    className="w-full mt-4 px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    {isGeneratingSpeech ? 'Generating...' : 'Generate Speech'}
                </button>
                
                {isGeneratingSpeech && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg text-center text-gray-300">
                        <p>Simulating audio generation...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioTools;
