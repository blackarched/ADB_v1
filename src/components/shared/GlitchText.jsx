import React from 'react';

const GlitchText = ({ text, className }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 opacity-80 text-pink-500 animate-glitch-1">{text}</span>
      <span className="absolute inset-0 opacity-80 text-cyan-500 animate-glitch-2">{text}</span>
      {text}
    </span>
  );
};

const GlitchAnimation = () => (
  <style>{`
    @keyframes glitch-1 {
      0%, 100% { clip-path: inset(50% 50% 50% 50%); }
      20% { clip-path: inset(10% 0 85% 0); }
      40% { clip-path: inset(90% 0 1% 0); }
      60% { clip-path: inset(40% 0 40% 0); }
      80% { clip-path: inset(80% 0 5% 0); }
    }
    .animate-glitch-1 {
      animation: glitch-1 3.5s infinite linear alternate-reverse;
    }

    @keyframes glitch-2 {
      0%, 100% { clip-path: inset(50% 50% 50% 50%); }
      10% { clip-path: inset(1% 0 90% 0); }
      30% { clip-path: inset(85% 0 10% 0); }
      50% { clip-path: inset(30% 0 50% 0); }
      70% { clip-path: inset(70% 0 15% 0); }
      90% { clip-path: inset(95% 0 2% 0); }
    }
    .animate-glitch-2 {
      animation: glitch-2 4s infinite linear alternate;
    }
  `}</style>
);

const GlitchTextWrapper = (props) => (
  <>
    <GlitchAnimation />
    <GlitchText {...props} />
  </>
);

export default GlitchTextWrapper;