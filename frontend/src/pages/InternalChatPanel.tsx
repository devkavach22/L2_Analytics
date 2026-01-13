import { useState } from "react";
import ChatGPTEditor from "../components/ai-search/ChatGPTEditor";

const filterContext = (context: string, query: string) => {
  if (!context) return "";
  const keywords = query.toLowerCase().split(" ");
  return context
    .split("\n")
    .filter((line) => keywords.some((k) => line.toLowerCase().includes(k)))
    .slice(0, 10)
    .join("\n");
};

export default function InternalChatPanel({
  reportText,
}: {
  reportText: string;
}) {
  const [input, setInput] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const ask = () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setContent((prev) => prev + `\n\n### Question\n${input}\n\n### Answer\n`);

    const filtered =
      filterContext(reportText, input) ||
      "No relevant data found in the report.";
    const chunks = filtered.split("\n");

    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        setContent((prev) => prev + chunks[i] + "\n");
        i++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 150);

    setInput("");
  };

  const save = () => {
    localStorage.setItem(`internal-chat-${Date.now()}`, content);
    alert("Internal chat saved");
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col h-full">
      <div className="px-3 py-2 text-xs text-slate-400 font-semibold border-b border-slate-800">
        Internal Report AI
      </div>

      <ChatGPTEditor content={content} isGenerating={isGenerating} />

      <div className="p-3 flex gap-2 border-t border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask from this report..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          className="flex-1 bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg outline-none"
        />
        <button
          onClick={ask}
          className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm"
        >
          Ask
        </button>
        <button
          onClick={save}
          className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}
