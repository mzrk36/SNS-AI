import React from 'react';

const TopicIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0114 18.442V19.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1.058a3.375 3.375 0 01-1.815-1.395l-.548-.547z" />
  </svg>
);

export default TopicIcon;
