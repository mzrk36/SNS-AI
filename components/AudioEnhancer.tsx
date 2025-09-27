import React, { useState, useRef, useEffect, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import TrashIcon from './icons/TrashIcon';

type MediaType = 'audio' | 'video';
type ProcessingStatus = 'queued' | 'analyzing' | 'applying' | 'ready' | 'error';

interface EnhancedFile {
  id: string;
  file: File;
  objectUrl: string;
  duration: string;
  type: MediaType;
  status: ProcessingStatus;
  statusText: string;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const AudioEnhancer: React.FC = () => {
    const [files, setFiles] = useState<EnhancedFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<EnhancedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [speechStrength, setSpeechStrength] = useState(75);
    const [noiseReduction, setNoiseReduction] = useState(60);
    const [showEnhanced, setShowEnhanced] = useState(true);

    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [mediaDuration, setMediaDuration] = useState(0);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const noiseFilterRef = useRef<BiquadFilterNode | null>(null);

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const getFileMetadata = (file: File, objectUrl: string): Promise<{ duration: string; type: MediaType }> => {
        return new Promise((resolve) => {
            const type = file.type.startsWith('audio') ? 'audio' : 'video';
            const mediaElement = document.createElement(type);
            mediaElement.src = objectUrl;
            mediaElement.onloadedmetadata = () => {
                resolve({ duration: formatTime(mediaElement.duration), type });
            };
            mediaElement.onerror = () => {
                resolve({ duration: '00:00', type });
            };
        });
    };
    
    const processFiles = useCallback(async (newFiles: FileList | null) => {
        if (!newFiles) return;
        const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'));

        if (validFiles.length !== newFiles.length) {
            showError('Some files were not supported. Please upload audio or video files.');
        }

        const newEnhancedFiles: EnhancedFile[] = [];
        for (const file of validFiles) {
            const id = `${file.name}-${file.lastModified}`;
            if (files.some(f => f.id === id)) continue;

            const objectUrl = URL.createObjectURL(file);
            const { duration, type } = await getFileMetadata(file, objectUrl);

            const enhancedFile: EnhancedFile = { id, file, objectUrl, duration, type, status: 'queued', statusText: 'Queued' };
            newEnhancedFiles.push(enhancedFile);
        }

        if (newEnhancedFiles.length > 0) {
            setFiles(prev => [...prev, ...newEnhancedFiles]);
        }
    }, [files]);

     const simulateProcessing = useCallback((fileId: string) => {
        const updateStatus = (id: string, status: ProcessingStatus, statusText: string) => {
            setFiles(prevFiles => prevFiles.map(f => f.id === id ? { ...f, status, statusText } : f));
        };

        updateStatus(fileId, 'analyzing', 'Analyzing...');
        setTimeout(() => {
            updateStatus(fileId, 'applying', 'Applying effects...');
            setTimeout(() => {
                updateStatus(fileId, 'ready', 'Ready');
            }, 3000);
        }, 2000);
    }, []);

    useEffect(() => {
        const queuedFile = files.find(f => f.status === 'queued');
        const isProcessing = files.some(f => ['analyzing', 'applying'].includes(f.status));
        if (queuedFile && !isProcessing) {
            simulateProcessing(queuedFile.id);
        }
    }, [files, simulateProcessing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        e.target.value = '';
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    }, []);

    const removeFile = (id: string) => {
        setFiles(prev => {
            const newFiles = prev.filter(f => {
                if (f.id === id) {
                    URL.revokeObjectURL(f.objectUrl);
                    return false;
                }
                return true;
            });
            if (selectedFile?.id === id) {
                setSelectedFile(newFiles.length > 0 ? newFiles.find(f => f.status === 'ready') || null : null);
            }
            return newFiles;
        });
    };
    
    const setupAudioContext = () => {
        if (!mediaRef.current || audioContextRef.current) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (mediaSourceNodeRef.current && mediaSourceNodeRef.current.mediaElement !== mediaRef.current) {
             mediaSourceNodeRef.current.disconnect();
             mediaSourceNodeRef.current = null;
        }
        
        if (!mediaSourceNodeRef.current) {
            mediaSourceNodeRef.current = context.createMediaElementSource(mediaRef.current as HTMLMediaElement);
        }

        const gainNode = context.createGain();
        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        
        mediaSourceNodeRef.current.connect(context.destination);

        audioContextRef.current = context;
        gainNodeRef.current = gainNode;
        noiseFilterRef.current = noiseFilter;
    };
    
    useEffect(() => {
        return () => { audioContextRef.current?.close().catch(console.error); };
    }, []);

    useEffect(() => {
        const audioContext = audioContextRef.current;
        const source = mediaSourceNodeRef.current;
        const gain = gainNodeRef.current;
        const filter = noiseFilterRef.current;

        if (!audioContext || !source || !gain || !filter || !selectedFile) return;
        
        source.disconnect();
        gain.disconnect();
        filter.disconnect();

        if (showEnhanced) {
            const gainValue = 1 + (speechStrength / 100) * 0.5; // Range: 1.0 to 1.5
            gain.gain.setValueAtTime(gainValue, audioContext.currentTime);

            const cutoffFrequency = 20000 - (noiseReduction / 100) * 17000; // Range: 20kHz to 3kHz
            filter.frequency.setValueAtTime(cutoffFrequency, audioContext.currentTime);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(audioContext.destination);
        } else {
            source.connect(audioContext.destination);
        }
    }, [speechStrength, noiseReduction, showEnhanced, selectedFile]);

    useEffect(() => {
        const media = mediaRef.current;
        if (!media) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(media.currentTime);
        const onLoadedMetadata = () => setMediaDuration(media.duration);

        media.addEventListener('play', onPlay);
        media.addEventListener('pause', onPause);
        media.addEventListener('timeupdate', onTimeUpdate);
        media.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            media.removeEventListener('play', onPlay);
            media.removeEventListener('pause', onPause);
            media.removeEventListener('timeupdate', onTimeUpdate);
            media.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [selectedFile]);

    const selectAndPlayFile = (file: EnhancedFile) => {
        if (file.status === 'ready') {
            setSelectedFile(file);
        }
    };
    
    const togglePlay = () => {
        if (mediaRef.current) {
            if (!audioContextRef.current) {
                setupAudioContext();
            }
            const audioContext = audioContextRef.current;
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            isPlaying ? mediaRef.current.pause() : mediaRef.current.play();
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (mediaRef.current) {
            mediaRef.current.currentTime = Number(e.target.value);
            setCurrentTime(Number(e.target.value));
        }
    };
    
    const StatusIndicator = ({ status }: { status: ProcessingStatus }) => {
        const statusMap = {
            queued: { text: 'Queued', color: 'text-gray-400', icon: null },
            analyzing: { text: 'Analyzing...', color: 'text-yellow-400', icon: <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div> },
            applying: { text: 'Applying...', color: 'text-blue-400', icon: <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div> },
            ready: { text: 'Ready', color: 'text-green-400', icon: <div className="w-2 h-2 bg-green-400 rounded-full"></div> },
            error: { text: 'Error', color: 'text-red-400', icon: null },
        };
        const current = statusMap[status];
        return (
            <div className="flex items-center gap-2">
                {current.icon}
                <span className={`text-xs ${current.color}`}>{current.text}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full max-w-7xl mx-auto">
            {error && (
                <div className="absolute top-24 right-8 bg-red-500/90 text-white p-4 rounded-lg shadow-xl z-50 animate-fade-in-out">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            
            <div className="lg:w-1/3 flex flex-col gap-4">
                 <div 
                    onDrop={handleDrop} 
                    onDragOver={handleDragEvents} 
                    onDragEnter={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-blue-500 bg-gray-800/50' : 'border-gray-600'}`}
                >
                    <UploadCloudIcon className="w-12 h-12 text-gray-500 mb-4"/>
                    <p className="text-gray-400 text-center">Drop audio or video to enhance</p>
                    <p className="text-gray-500 text-sm mb-4">or</p>
                    <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileChange} accept="audio/*,video/*"/>
                    <label htmlFor="file-upload" className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">Choose Files</label>
                </div>
            </div>

            <div className="lg:w-2/3 bg-gray-800 rounded-xl p-6 flex flex-col">
                <div className="flex-1 flex flex-col">
                    {!selectedFile ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <h3 className="text-xl font-semibold">Select a processed file to begin</h3>
                            <p>Upload media to start the enhancement process.</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
                                {selectedFile.type === 'video' ? (
                                    <video ref={mediaRef as React.RefObject<HTMLVideoElement>} key={selectedFile.id} src={selectedFile.objectUrl} className="w-full h-full rounded-lg" />
                                ) : (
                                    <>
                                        <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} key={selectedFile.id} src={selectedFile.objectUrl} />
                                        <div className='text-center'>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                                            <p className="text-gray-400 mt-2 font-semibold">Audio Preview</p>
                                            <p className="text-gray-500 text-sm truncate max-w-xs">{selectedFile.file.name}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-transform active:scale-95">
                                    {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.068v3.864a1 1 0 001.555.832l3.197-1.932a1 1 0 000-1.664l-3.197-1.932z" clipRule="evenodd" /></svg>}
                                </button>
                                <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                                <input type="range" min="0" max={mediaDuration || 100} value={currentTime} onChange={handleSeek} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
                                <span className="text-sm font-mono">{formatTime(mediaDuration)}</span>
                            </div>
                            
                            <div className="border-t border-gray-700 my-6"></div>

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">AI Enhancement Controls</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium transition-colors ${!showEnhanced ? 'text-white' : 'text-gray-500'}`}>Original</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={showEnhanced} onChange={() => setShowEnhanced(!showEnhanced)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                    <span className={`text-sm font-medium transition-colors ${showEnhanced ? 'text-white' : 'text-gray-500'}`}>Enhanced</span>
                                </div>
                            </div>

                            <div className={`space-y-4 transition-opacity ${showEnhanced ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <div>
                                    <label className="block text-sm mb-1 text-gray-300">Speech Enhancement</label>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="0" max="100" value={speechStrength} onChange={(e) => setSpeechStrength(Number(e.target.value))} className="w-full range-thumb" />
                                        <span className="text-sm font-mono w-10">{speechStrength}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-gray-300">Background Noise Reduction</label>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="0" max="100" value={noiseReduction} onChange={(e) => setNoiseReduction(Number(e.target.value))} className="w-full range-thumb" />
                                        <span className="text-sm font-mono w-10">{noiseReduction}%</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                 <div className="border-t border-gray-700 mt-6 pt-4">
                    <h2 className="text-lg font-semibold mb-2">File Queue</h2>
                    <div className="overflow-y-auto max-h-48 space-y-2">
                        {files.map(f => (
                            <div 
                                key={f.id} 
                                onClick={() => selectAndPlayFile(f)}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${f.status === 'ready' ? 'cursor-pointer' : 'cursor-default'} ${selectedFile?.id === f.id ? 'bg-blue-600/30' : 'bg-gray-700/50 hover:bg-gray-600/50'}`}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                                    <p className="text-xs text-gray-400">{f.duration}</p>
                                </div>
                                <StatusIndicator status={f.status}/>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded-full transition-colors"><TrashIcon /></button>
                            </div>
                        ))}
                        {files.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No files uploaded.</p>}
                    </div>
                </div>
            </div>

            <style>{`
                .range-thumb {
                    -webkit-appearance: none; appearance: none;
                    background-color: transparent; cursor: pointer;
                }
                .range-thumb::-webkit-slider-runnable-track {
                    background-color: #4b5563; height: 0.5rem; border-radius: 9999px;
                }
                .range-thumb::-moz-range-track {
                    background-color: #4b5563; height: 0.5rem; border-radius: 9999px;
                }
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    margin-top: -4px;
                    height: 1.25rem; width: 1.25rem;
                    background-color: #f9fafb;
                    border-radius: 9999px;
                    border: 2px solid #3b82f6;
                }
                .range-thumb::-moz-range-thumb {
                    height: 1.25rem; width: 1.25rem;
                    background-color: #f9fafb;
                    border-radius: 9999px;
                    border: 2px solid #3b82f6;
                }
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(-10px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 5s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AudioEnhancer;