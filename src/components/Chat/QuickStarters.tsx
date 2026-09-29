import React from 'react';
import {
  Calculator,
  Code2,
  FileText,
  Lightbulb,
  Languages,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface QuickStartersProps {
  onSelectPrompt: (prompt: string) => void;
}

export const QuickStarters: React.FC<QuickStartersProps> = ({ onSelectPrompt }) => {
  const categories = [
    {
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
      title: 'Math & Tools',
      prompt: 'Calculate 25% of 8400 and convert 250 USD to INR.',
      description: 'Precise calculation & unit/currency conversion',
    },
    {
      icon: <Code2 className="w-4 h-4 text-indigo-400" />,
      title: 'Code Generation',
      prompt: 'Write a TypeScript function for token bucket rate limiting with clean error handling and unit test examples.',
      description: 'High-quality code, patterns & explanations',
    },
    {
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      title: 'Analysis & RAG',
      prompt: 'Explain the architecture of RAG (Retrieval-Augmented Generation) and how vector similarity search works.',
      description: 'Deep dives, summarization & breakdowns',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      title: 'Brainstorming',
      prompt: 'Brainstorm 5 innovative product features for a modern conversational AI dashboard.',
      description: 'Creative ideation, product strategy & naming',
    },
    {
      icon: <Languages className="w-4 h-4 text-rose-400" />,
      title: 'Translation',
      prompt: "Translate 'Empowering intelligence through seamless natural interaction' into Telugu (తెలుగు) and Hindi (हिन्दी).",
      description: 'Multilingual translation & localization',
    },
    {
      icon: <Compass className="w-4 h-4 text-purple-400" />,
      title: 'Research & Search',
      prompt: 'What are the most promising breakthroughs in multimodal foundation models this year?',
      description: 'Real-time search & synthesis of web topics',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Brand Hero Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>NOVA AI Assistant Active</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          How can NOVA assist you today?
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Intelligent conversation, safe tool execution, document RAG, image analysis, and multilingual reasoning.
        </p>
      </div>

      {/* Grid of Starter Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {categories.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex flex-col justify-between text-left p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-150 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/60 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                {item.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-500 truncate group-hover:text-slate-400 font-mono">
              "{item.prompt}"
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
