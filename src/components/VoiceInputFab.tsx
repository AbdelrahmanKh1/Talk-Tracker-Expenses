import React from 'react';

interface VoiceInputFabProps {
  onVoiceClick: () => void;
}

const VoiceInputFab = ({ onVoiceClick }: VoiceInputFabProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
      <button 
        onClick={onVoiceClick}
        className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:from-teal-600 hover:to-blue-700 transition-all duration-200 hover:shadow-xl hover:scale-105"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 23h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default VoiceInputFab;
