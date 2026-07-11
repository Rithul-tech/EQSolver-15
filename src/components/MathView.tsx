import React, { useMemo } from "react";
import katex from "katex";

interface MathViewProps {
  math: string;
  block?: boolean;
}

// Inner component to render a single pure KaTeX formula safely
interface KaTeXSpanProps {
  formula: string;
  displayMode: boolean;
  key?: React.Key;
}

function KaTeXSpan({ formula, displayMode }: KaTeXSpanProps) {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula.trim(), containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true
        });
      } catch (err) {
        console.warn("KaTeX rendering error:", err);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return (
    <span 
      ref={containerRef} 
      className={`select-all font-sans inline-block tracking-normal ${
        displayMode ? "text-lg sm:text-xl py-3 my-1 block text-center overflow-x-auto text-slate-900 font-medium" : "text-sm text-slate-800"
      }`} 
    />
  );
}

function cleanCodeAndWrappers(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Strip code blocks
  cleaned = cleaned.replace(/```(?:latex|math|chem|)?\n?([\s\S]*?)\n?```/g, "$1");
  cleaned = cleaned.replace(/`([^`\n]+)`/g, "$1");
  
  return cleaned.trim();
}

export default function MathView({ math, block = false }: MathViewProps) {
  const parsedElements = useMemo(() => {
    const cleaned = cleanCodeAndWrappers(math);
    if (!cleaned) return null;

    // Check if it's a pure single block math expression (fully enclosed)
    const isPureBlock = 
      (cleaned.startsWith("$$") && cleaned.endsWith("$$")) ||
      (cleaned.startsWith("\\[") && cleaned.endsWith("\\]"));
    
    if (isPureBlock) {
      const formula = cleaned.startsWith("$$") ? cleaned.slice(2, -2) : cleaned.slice(2, -2);
      return <KaTeXSpan formula={formula} displayMode={true} />;
    }

    // Check if it's a pure single inline math expression (fully enclosed)
    const isPureInline = 
      (cleaned.startsWith("$") && cleaned.endsWith("$") && !cleaned.slice(1, -1).includes("$")) ||
      (cleaned.startsWith("\\(") && cleaned.endsWith("\\)") && !cleaned.slice(2, -2).includes("\\("));

    if (isPureInline) {
      const formula = cleaned.startsWith("$") ? cleaned.slice(1, -1) : cleaned.slice(2, -2);
      return <KaTeXSpan formula={formula} displayMode={block} />;
    }

    // Otherwise, check if it contains ANY math delimiters ($$, $, \[, \], \(, \))
    // If it doesn't contain any math delimiters, but contains math control characters like \ or ^, or block is true, we treat it as pure math.
    const hasDelimiters = cleaned.includes("$") || cleaned.includes("\\[") || cleaned.includes("\\(");
    
    if (!hasDelimiters) {
      // If the caller requested block rendering or if it looks like standard raw LaTeX
      if (block || cleaned.includes("\\") || cleaned.includes("^") || cleaned.includes("_") || cleaned.includes("{")) {
        return <KaTeXSpan formula={cleaned} displayMode={block} />;
      }
      // Otherwise just a standard text span
      return <span className="text-sm text-slate-800 font-sans">{cleaned}</span>;
    }

    // Split text by block math ($$) and inline math ($)
    // Regex matches $$...$$ or $...$
    const parts = cleaned.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    
    return (
      <span className="font-sans text-sm text-slate-800 leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            const formula = part.slice(2, -2);
            return <KaTeXSpan key={index} formula={formula} displayMode={true} />;
          } else if (part.startsWith("$") && part.endsWith("$")) {
            const formula = part.slice(1, -1);
            return <KaTeXSpan key={index} formula={formula} displayMode={false} />;
          } else {
            // Check for other delimiters in plain text chunk, like \[ ... \] or \( ... \)
            // For simplicity, just return text part
            return <span key={index} className="whitespace-pre-wrap">{part}</span>;
          }
        })}
      </span>
    );
  }, [math, block]);

  return parsedElements;
}
