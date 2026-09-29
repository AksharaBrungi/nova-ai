import React, { useState } from 'react';
import { Check, Copy, WrapText } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = value.trimEnd().split('\n');

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-400">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWrap(!wrap)}
            className={`p-1 rounded hover:bg-slate-800 transition-colors ${wrap ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle word wrap"
            aria-label="Toggle word wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all text-xs font-medium"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto p-4 font-mono text-xs md:text-[13px] leading-relaxed text-slate-200">
        <pre className={wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}>
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell pr-4 text-slate-600 select-none text-right text-[11px] font-mono tabular-nums">
                  {idx + 1}
                </span>
                <span className="table-cell">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
