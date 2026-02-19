import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypingEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 10); // Slightly faster than vo.tsx's 20ms for better UX
    return () => clearInterval(interval);
  }, [text]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>;
};

export default TypingEffect;
