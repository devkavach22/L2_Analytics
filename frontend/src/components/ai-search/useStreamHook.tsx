import { useEffect, useState } from 'react';


const DUMMY_CHUNKS = [
  '## Executive Summary\n\n hemanshiiiii',
  'Live analysis for **KovertHR** is in progress...\n\n',

  '### Attendance Stats\n',
  '- Present: **92%**\n',
  '- Absent: 5%\n',
  '- On Leave: 3%\n\n',

  '### Expense Insights\n',
  '```\n',
  'Approved: ₹85,000\n',
  'Pending:  ₹18,500\n',
  'Rejected: ₹4,200\n',
  '```\n\n',

  '### AI Suggestions\n',
  '1. **Enable auto-approval rules**\n',
  '2. **Reduce manual attendance corrections**\n',
  '3. **Improve expense audit trail**\n\n',

  '---\n',
  '*Dummy AI stream complete*'
];


export const useChatStream = (url: string) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

//   useEffect(() => {
//     const source = new EventSource(url);
//     setIsGenerating(true);

//     source.onmessage = (event) => {
//       setText(prev => prev + event.data);
//     };

//     source.addEventListener('end', () => {
//       setIsGenerating(false);
//       source.close();
//     });

//     source.onerror = () => {
//       setIsGenerating(false);
//       source.close();
//     };

//     return () => source.close();
//   }, [url]);
useEffect(() => {
    setIsGenerating(true);
    let index = 0;

    const interval = setInterval(() => {
      if (index < DUMMY_CHUNKS.length) {
        setText(prev => prev + DUMMY_CHUNKS[index]);
        index++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return { streamedText: text, isGenerating };
};
