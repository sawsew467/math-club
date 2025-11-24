'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDisplayProps {
  content: string;
  inline?: boolean;
}

export function MathDisplay({ content, inline = false }: MathDisplayProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Parse content to find LaTeX expressions
      const processedContent = parseAndRenderMath(content);
      containerRef.current.innerHTML = processedContent;
    }
  }, [content]);

  return <span ref={containerRef} className={inline ? 'inline' : 'block my-2'} />;
}

function parseAndRenderMath(text: string): string {
  // Handle display math $$...$$
  text = text.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (e) {
      console.error('KaTeX error:', e);
      return `<span class="text-red-500">[Math Error: ${math}]</span>`;
    }
  });

  // Handle inline math $...$
  text = text.replace(/\$(.*?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      console.error('KaTeX error:', e);
      return `<span class="text-red-500">[Math Error: ${math}]</span>`;
    }
  });

  // Convert newlines to <br> tags
  text = text.replace(/\n/g, '<br>');

  return text;
}