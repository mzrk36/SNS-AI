import React from 'react';
import { View } from '../types';
import ChatIcon from './icons/ChatIcon';
import ImageIcon from './icons/ImageIcon';
import LogoIcon from './icons/LogoIcon';
import WaveformIcon from './icons/WaveformIcon';
import AudioEnhancerIcon from './icons/AudioEnhancerIcon';
import TrendingIcon from './icons/TrendingIcon';
import WorldIcon from './icons/WorldIcon';
import BannerIcon from './icons/BannerIcon';
import TagNameIcon from './icons/TagNameIcon';
import ResearchIcon from './icons/ResearchIcon';
import SeoIcon from './icons/SeoIcon';
import WhatsappIcon from './icons/WhatsappIcon';
import TopicIcon from './icons/TopicIcon';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const TemplateIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PenIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: View.ViralIdeas, icon: <TrendingIcon />, label: 'Viral Title Ideas' },
    { view: View.ViralTopicFinder, icon: <TopicIcon />, label: 'Viral Topic Ideas' },
    { view: View.YoutubeNicheResearch, icon: <ResearchIcon />, label: 'YouTube Niche Research' },
    { view: View.ScriptPromptTemplate, icon: <TemplateIcon />, label: 'Script Prompt Template' },
    { view: View.ScriptWritingMuzu, icon: <PenIcon />, label: 'Script Writing by Muzu' },
    { view: View.Chat, icon: <ChatIcon />, label: 'Long Script Writing' },
    { view: View.SilenceRemover, icon: <WaveformIcon />, label: 'Muzu Silence Remover' },
    { view: View.AudioEnhancer, icon: <AudioEnhancerIcon />, label: 'Muzu Audio Enhancer' },
    { view: View.Image, icon: <ImageIcon />, label: 'Thumbnail Generator' },
    { view: View.MuzuWorld, icon: <WorldIcon />, label: 'Muzu Thumbnail Generator' },
    { view: View.Logo, icon: <LogoIcon />, label: 'Logo Generator' },
    { view: View.YoutubeBanner, icon: <BannerIcon />, label: 'YouTube Banner Generator' },
    { view: View.YoutubeName, icon: <TagNameIcon />, label: 'YouTube Name Generator' },
    { view: View.YoutubeSeo, icon: <SeoIcon />, label: 'YouTube SEO' },
  ];

  return (
    <aside className="w-72 bg-gray-800 p-4 flex flex-col">
      <div className="flex items-center mb-8">
        <div className="p-2 bg-blue-600 rounded-lg">
          <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.685-2.685L11.25 18l1.938-.648a3.375 3.375 0 002.685-2.685L16.25 13.5l.648 1.938a3.375 3.375 0 002.685 2.685L21.75 18l-1.938.648a3.375 3.375 0 00-2.685 2.685z" />
          </svg>
        </div>
        <h1 className="ml-3 text-xl font-bold text-white">Muzu AI</h1>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.view}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.view}
              onClick={() => setView(item.view)}
            />
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <a
          href="https://chat.whatsapp.com/H7dL5H5UQ4w5yL1WhE5604"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full p-3 my-2 rounded-lg cursor-pointer transition-colors duration-200 bg-green-500 text-white hover:bg-green-600 font-semibold"
          aria-label="Join our WhatsApp Group"
        >
          <WhatsappIcon className="w-5 h-5" />
          <span className="ml-2">Join WhatsApp Group</span>
        </a>
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center">
              <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-200">Server Status: Online</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">API is running on localhost:8080</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;