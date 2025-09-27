export enum View {
  ViralIdeas = 'VIRAL_IDEAS',
  ViralTopicFinder = 'VIRAL_TOPIC_FINDER',
  YoutubeNicheResearch = 'YOUTUBE_NICHE_RESEARCH',
  ScriptPromptTemplate = 'SCRIPT_PROMPT_TEMPLATE',
  ScriptWritingMuzu = 'SCRIPT_WRITING_MUZU',
  Chat = 'CHAT',
  SilenceRemover = 'SILENCE_REMOVER',
  AudioEnhancer = 'AUDIO_ENHANCER',
  Image = 'IMAGE',
  MuzuWorld = 'MUZU_WORLD',
  Logo = 'LOGO',
  YoutubeBanner = 'YOUTUBE_BANNER',
  YoutubeName = 'YOUTUBE_NAME',
  YoutubeSeo = 'YOUTUBE_SEO',
}

export enum BackendType {
  LlamaCpp = 'llama.cpp',
  WhisperCpp = 'whisper.cpp',
  StableDiffusionCpp = 'stable-diffusion.cpp',
  Transformers = 'transformers',
  vLLM = 'vLLM',
  BarkCpp = 'bark.cpp',
}

export interface Model {
  id: string;
  name: string;
  backend: BackendType;
  description: string;
  source: string;
  loaded: boolean;
}

export interface ChatMessage {
  id:string;
  role: 'user' | 'assistant';
  content: string;
}