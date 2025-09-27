import React from 'react';

const AudioEnhancerIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8v8m3-10v12m3-14v16m3-12v8m3-6v4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 10h4m-2-2v4" />
  </svg>
);

export default AudioEnhancerIcon;