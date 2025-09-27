import React from 'react';

const WaveformIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3m0 0h3m-3 0V9m0 6v-3m6-6v12m3-12v12m3-12v12M9 3v18" />
  </svg>
);

export default WaveformIcon;