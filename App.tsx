import React, { useState } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import LogoGenerator from './components/LogoGenerator';
import SilenceRemover from './components/SilenceRemover';
import AudioEnhancer from './components/AudioEnhancer';
import ViralIdeasGenerator from './components/ViralIdeasGenerator';
import ScriptWritingSNS from './components/script-writing-sns/ScriptWritingSNS';
import ViralTitleIdeas from './components/ViralTitleIdeas';
import SNSWorld from './components/SNSWorld';
import YoutubeBannerGenerator from './components/YoutubeBannerGenerator';
import YoutubeNameGenerator from './components/YoutubeNameGenerator';
import YoutubeNicheResearch from './components/YoutubeNicheResearch';
import YoutubeSeo from './components/YoutubeSeo';
import ViralTopicFinder from './components/ViralTopicFinder';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ViralIdeas);

  const renderContent = () => {
    switch (currentView) {
      case View.ViralIdeas:
        return <ViralTitleIdeas />;
      case View.ViralTopicFinder:
        return <ViralTopicFinder />;
      case View.YoutubeNicheResearch:
        return <YoutubeNicheResearch />;
      case View.ScriptPromptTemplate:
        return <ViralIdeasGenerator />;
      case View.ScriptWritingSNS:
        return <ScriptWritingSNS />;
      case View.Chat:
        return <ChatInterface />;
      case View.Image:
        return <ImageGenerator />;
      case View.SNSWorld:
        return <SNSWorld />;
      case View.Logo:
        return <LogoGenerator />;
      case View.YoutubeBanner:
        return <YoutubeBannerGenerator />;
      case View.YoutubeName:
        return <YoutubeNameGenerator />;
      case View.YoutubeSeo:
        return <YoutubeSeo />;
      case View.SilenceRemover:
        return <SilenceRemover />;
      case View.AudioEnhancer:
        return <AudioEnhancer />;
      default:
        return <ViralTitleIdeas />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header view={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;