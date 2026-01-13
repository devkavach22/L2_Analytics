// ============================================
// TYPEWRITER TEXT - ANIMATED TEXT EFFECT
// ============================================

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const TypewriterText = ({ text, className, speed = 40 }: TypewriterTextProps) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-orange-500">|</span>
    </span>
  );
};

export default TypewriterText;
