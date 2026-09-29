import { DocumentChunk, SourceCitation } from '../types/chat';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Split raw document text into clean, contextual chunks
 */
export function chunkText(
  text: string,
  docId: string,
  docName: string,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const chunkSize = options.chunkSize || 600;
  const chunkOverlap = options.chunkOverlap || 120;

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return [];

  const chunks: DocumentChunk[] = [];
  const paragraphs = normalized.split(/\n\s*\n/);

  let currentChunk = '';
  let chunkIdx = 1;

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if (currentChunk.length + cleanPara.length + 2 <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + cleanPara;
    } else {
      // If single paragraph is larger than chunk size, split by sentences
      if (cleanPara.length > chunkSize) {
        const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [cleanPara];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
          } else {
            if (currentChunk) {
              chunks.push({
                id: `${docId}-chunk-${chunkIdx}`,
                docId,
                docName,
                chunkIndex: chunkIdx++,
                text: currentChunk.trim(),
                tokenCount: Math.ceil(currentChunk.length / 4),
              });
              // overlap
              const overlapText = currentChunk.slice(-chunkOverlap);
              currentChunk = overlapText + ' ' + sentence.trim();
            } else {
              currentChunk = sentence.trim();
            }
          }
        }
      } else {
        if (currentChunk) {
          chunks.push({
            id: `${docId}-chunk-${chunkIdx}`,
            docId,
            docName,
            chunkIndex: chunkIdx++,
            text: currentChunk.trim(),
            tokenCount: Math.ceil(currentChunk.length / 4),
          });
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText + '\n\n' + cleanPara;
        } else {
          currentChunk = cleanPara;
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `${docId}-chunk-${chunkIdx}`,
      docId,
      docName,
      chunkIndex: chunkIdx++,
      text: currentChunk.trim(),
      tokenCount: Math.ceil(currentChunk.length / 4),
    });
  }

  return chunks;
}

/**
 * Enhanced BM25 / Keyword + N-gram Semantic Relevance Ranker
 */
export function searchKnowledgeChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): { chunk: DocumentChunk; score: number; snippet: string }[] {
  if (!chunks.length || !query.trim()) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK).map((c) => ({
      chunk: c,
      score: 0.5,
      snippet: c.text.slice(0, 200) + '...',
    }));
  }

  // Calculate term frequencies
  const scored = chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;
    let matchPositions: number[] = [];

    // Exact phrase bonus
    if (textLower.includes(query.toLowerCase().trim())) {
      score += 15;
    }

    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 3;
        const pos = textLower.indexOf(term);
        if (pos !== -1) matchPositions.push(pos);
      } else if (textLower.includes(term)) {
        score += 1;
      }
    }

    // Contextual snippet extraction
    let snippet = '';
    if (matchPositions.length > 0) {
      const firstPos = Math.min(...matchPositions);
      const start = Math.max(0, firstPos - 60);
      const end = Math.min(chunk.text.length, firstPos + 220);
      snippet = (start > 0 ? '...' : '') + chunk.text.substring(start, end).trim() + (end < chunk.text.length ? '...' : '');
    } else {
      snippet = chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : '');
    }

    return {
      chunk,
      score,
      snippet,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Formats retrieved chunks into system context for RAG
 */
export function formatRAGPromptContext(
  retrieved: { chunk: DocumentChunk; score: number; snippet: string }[]
): { contextString: string; citations: SourceCitation[] } {
  if (!retrieved.length) {
    return { contextString: '', citations: [] };
  }

  const citations: SourceCitation[] = retrieved.map((r) => ({
    title: `${r.chunk.docName} (Section ${r.chunk.chunkIndex})`,
    docName: r.chunk.docName,
    chunkIndex: r.chunk.chunkIndex,
    snippet: r.snippet,
    score: r.score,
    isWeb: false,
  }));

  const contextBlocks = retrieved
    .map(
      (r, idx) =>
        `[Document Source ${idx + 1}: ${r.chunk.docName} | Section ${r.chunk.chunkIndex}]\n"${r.chunk.text}"`
    )
    .join('\n\n');

  const contextString = `\n\n=== RELEVANT KNOWLEDGE BASE EXCERPTS ===\n${contextBlocks}\n=== END KNOWLEDGE BASE EXCERPTS ===\n\nCRITICAL INSTRUCTIONS FOR KNOWLEDGE BASE ANSWERS:\n- Rely primarily on the above excerpts to answer the user's question.\n- Cite the specific document name and section whenever referencing facts.\n- If the uploaded excerpts do not contain the answer, state clearly: "I could not find this information in the uploaded documents." Do not speculate or invent facts.\n`;

  return { contextString, citations };
}
