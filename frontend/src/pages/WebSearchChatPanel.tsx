import { useState } from 'react';
import ChatGPTEditor from '../components/ai-search/ChatGPTEditor';

const WEB_DUMMY_CHUNKS = [
  'Searching the web...\n\n',
  '### Top Results\n',
  '- Industry growth expected in 2025\n',
  '- Automation adoption increasing\n\n',
  '### Summary\n',
  'Based on online sources, the market outlook is positive.\n',
  '\n---\n*Answer generated from web data*'
];

export default function WebSearchChatPanel() {
  const [input, setInput] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const ask = () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setContent(prev => prev + `\n\n### Web Query\n${input}\n\n`);

    let i = 0;
    const interval = setInterval(() => {
      if (i < WEB_DUMMY_CHUNKS.length) {
        setContent(prev => prev + WEB_DUMMY_CHUNKS[i]);
        i++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 180);

    setInput('');
  };

  const save = () => {
    localStorage.setItem(`web-chat-${Date.now()}`, content);
    alert('Web chat saved');
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col h-full">
      <div className="px-3 py-2 text-xs text-slate-400 font-semibold border-b border-slate-800">
        Web Search AI
      </div>

      <ChatGPTEditor content={content} isGenerating={isGenerating} />

      <div className="p-3 flex gap-2 border-t border-slate-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search on the web..."
            onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          className="flex-1 bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg outline-none"
        />
        <button onClick={ask} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
          Ask
        </button>
        <button onClick={save} className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm">
          Save
        </button>
      </div>
    </div>
  );
}
