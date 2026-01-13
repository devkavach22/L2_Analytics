// ============================================
// TERMINAL STREAM - TIPTAP EDITOR FOR LOGS
// ============================================

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TerminalStreamProps {
  content: string;
  isGenerating: boolean;
}

export const TerminalStream = ({ content, isGenerating }: TerminalStreamProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none text-slate-300 max-w-none h-full font-mono',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    
    if (!content) {
      editor.commands.clearContent();
    } else {
      const formatted = content.split('\n').map(line => `<p>${line}</p>`).join('');
      editor.commands.setContent(formatted);
      editor.commands.scrollIntoView();
    }
  }, [content, editor]);

  return (
    <div className="h-full overflow-y-auto px-6 py-4 bg-[#0b1120] max-h-[600px]">
      <style>{`
        .ProseMirror p { margin-bottom: 0.5em; line-height: 1.6; }
        .ProseMirror { min-height: 100%; outline: none; }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: #f97316; font-weight: 700; }
        .ProseMirror code { background: #1e293b; padding: 0.2em 0.4em; color: #e2e8f0; }
      `}</style>
      <EditorContent editor={editor} />
      {isGenerating && (
        <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1" />
      )}
    </div>
  );
};

export default TerminalStream;
