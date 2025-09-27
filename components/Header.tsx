import React from 'react';
import { View } from '../types';

interface HeaderProps {
  view: View;
}

const viewTitles: Record<View, string> = {
  [View.ViralIdeas]: 'Viral Title Ideas',
  [View.ViralTopicFinder]: 'Muzu Viral Topic Finder',
  [View.YoutubeNicheResearch]: 'YouTube Niche Research',
  [View.ScriptPromptTemplate]: 'Script Prompt Template',
  [View.ScriptWritingMuzu]: 'Script Writing by Muzu',
  [View.Chat]: 'Long Script Writing',
  [View.SilenceRemover]: 'Muzu Silence Remover',
  [View.AudioEnhancer]: 'Muzu Audio Enhancer',
  [View.Image]: 'Thumbnail Generator',
  [View.MuzuWorld]: 'Muzu Thumbnail Generator',
  [View.Logo]: 'Logo Generator',
  [View.YoutubeBanner]: 'YouTube Banner Generator',
  [View.YoutubeName]: 'YouTube Name Generator',
  [View.YoutubeSeo]: 'YouTube SEO',
};

const Header: React.FC<HeaderProps> = ({ view }) => {
  return (
    <header className="bg-gray-800 shadow-md p-4">
      <h1 className="text-2xl font-semibold text-white">{viewTitles[view]}</h1>
    </header>
  );
};

export default Header;