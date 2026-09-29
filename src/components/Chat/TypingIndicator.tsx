import React from 'react';
import { Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  statusText?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ statusText = 'NOVA is thinking...' }) => {
  return (
    <div className="flex items-start gap-3 my-3 text-slate-400">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
        </div>
        <span className="text-xs text-slate-400 font-medium">{statusText}</span>
      </div>
    </div>
  );
};
