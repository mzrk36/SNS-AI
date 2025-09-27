import React, { useState, useRef, useEffect } from 'react';

// Helper function to convert an AudioBuffer to a WAV file Blob
const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk size
    setUint16(1); // audio format 1
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    const channels: Float32Array[] = [];
    for (let i = 0; i < numOfChan; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
            view.setInt16(pos, sample < 0 ? sample * 32768 : sample * 32767, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: "audio/wav" });
};


const SilenceRemover: React.FC = () => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [keepSilence, setKeepSilence] = useState(0.05);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, message]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(e.target.files);
        }
    };

    const handleProcess = async () => {
        if (!files || files.length === 0) {
            addLog("Error: No files selected.");
            return;
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        setIsProcessing(true);
        setProgress(0);
        setLogs([]);
        addLog(`Starting batch processing for ${files.length} file(s)...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            addLog(`[${i + 1}/${files.length}] Decoding "${file.name}"...`);
            
            try {
                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                
                addLog(`Processing "${file.name}"...`);

                const channelData = audioBuffer.getChannelData(0); // Process mono channel
                const sampleRate = audioBuffer.sampleRate;
                const SILENCE_THRESHOLD = 0.005;
                const MAX_SILENCE_SAMPLES = Math.floor(keepSilence * sampleRate);

                const segmentsToKeep = [];
                let isCurrentSegmentSilent = Math.abs(channelData[0]) < SILENCE_THRESHOLD;
                let segmentStartIndex = 0;

                for (let j = 1; j < channelData.length; j++) {
                    const isSampleSilent = Math.abs(channelData[j]) < SILENCE_THRESHOLD;
                    if (isSampleSilent !== isCurrentSegmentSilent) {
                        const segmentEndIndex = j;
                        const duration = segmentEndIndex - segmentStartIndex;
                        
                        if (isCurrentSegmentSilent) {
                            if (duration <= MAX_SILENCE_SAMPLES) {
                                segmentsToKeep.push(channelData.slice(segmentStartIndex, segmentEndIndex));
                            }
                        } else {
                            segmentsToKeep.push(channelData.slice(segmentStartIndex, segmentEndIndex));
                        }
                        segmentStartIndex = j;
                        isCurrentSegmentSilent = isSampleSilent;
                    }
                }

                const lastSegmentDuration = channelData.length - segmentStartIndex;
                if (isCurrentSegmentSilent) {
                    if (lastSegmentDuration <= MAX_SILENCE_SAMPLES) segmentsToKeep.push(channelData.slice(segmentStartIndex));
                } else {
                    segmentsToKeep.push(channelData.slice(segmentStartIndex));
                }
                
                const totalLength = segmentsToKeep.reduce((sum, segment) => sum + segment.length, 0);
                if (totalLength === 0) {
                    addLog(`Skipped "${file.name}" as it contains only silence.`);
                    setProgress(((i + 1) / files.length) * 100);
                    continue;
                }

                const newBufferData = new Float32Array(totalLength);
                let offset = 0;
                segmentsToKeep.forEach(segment => {
                    newBufferData.set(segment, offset);
                    offset += segment.length;
                });
                
                const newAudioBuffer = audioContextRef.current.createBuffer(1, totalLength, sampleRate);
                newAudioBuffer.copyToChannel(newBufferData, 0);

                const wavBlob = bufferToWav(newAudioBuffer);
                const downloadUrl = URL.createObjectURL(wavBlob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                const trimmedFilename = file.name.replace(/\.[^/.]+$/, "") + "_trimmed.wav";
                link.download = trimmedFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);

                addLog(`Complete! "${trimmedFilename}" has been downloaded.`);
            } catch (error) {
                addLog(`Error processing "${file.name}": ${(error as Error).message}`);
            }
            setProgress(((i + 1) / files.length) * 100);
        }
        
        addLog("Batch processing finished.");
        setIsProcessing(false);
    };


    return (
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3m0 0h3m-3 0V9m0 6v-3m6-6v12m3-12v12m3-12v12M9 3v18" /></svg>
                <h2 className="text-2xl font-bold text-white">Muzu Silence Remover</h2>
            </div>
            <p className="text-gray-400 mb-8">Remove silent sections from your audio files directly in the browser. Your files are processed locally and are never uploaded.</p>
            
            <div className="space-y-6">
                <div>
                    <input type="file" id="audio-files" className="hidden" accept="audio/wav, audio/mpeg, audio/mp3, audio/ogg, audio/flac, audio/m4a" multiple onChange={handleFileChange} disabled={isProcessing} />
                    <label htmlFor="audio-files" className="w-full flex justify-center items-center px-6 py-4 font-semibold text-white bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:opacity-50 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {files && files.length > 0 ? `${files.length} file(s) selected` : "Choose Audio Files"}
                    </label>
                </div>

                <div>
                    <label htmlFor="keep-silence" className="block text-sm font-medium text-gray-200 mb-2">Keep Silence Upto (seconds):</label>
                    <input type="number" id="keep-silence" value={keepSilence} onChange={e => setKeepSilence(parseFloat(e.target.value))} step="0.01" min="0" disabled={isProcessing} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200" />
                </div>

                <button onClick={handleProcess} disabled={isProcessing || !files || files.length === 0} className="w-full px-6 py-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {isProcessing ? "Processing..." : "Remove Silence (Batch)"}
                </button>

                {isProcessing && (
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {logs.length > 0 && (
                     <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm text-gray-400 border border-gray-700">
                        {logs.map((log, index) => <p key={index} className="whitespace-pre-wrap">{`> ${log}`}</p>)}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SilenceRemover;