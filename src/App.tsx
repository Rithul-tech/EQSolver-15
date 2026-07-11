import React, { useState, useEffect, useMemo } from "react";
import {
  Binary,
  Compass,
  FlaskConical,
  Grid3X3,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Play,
  Clipboard,
  FileDown,
  Info,
  ChevronRight,
  Maximize2,
  Minimize2,
  Atom,
  Settings,
  Flame,
  CornerDownRight,
  Sparkles,
  Cpu,
  Bookmark
} from "lucide-react";
import { SolverResult, SolverMode, ConstantItem, AttachedFile } from "./types";
import { SCIENTIFIC_CONSTANTS, FORMULA_TEMPLATES } from "./constants";
import GraphPanel from "./components/GraphPanel";
import MatrixPanel from "./components/MatrixPanel";
import ChemistryPanel from "./components/ChemistryPanel";
import StatisticsPanel from "./components/StatisticsPanel";
import MathView from "./components/MathView";
import FileAttachmentZone from "./components/FileAttachmentZone";

function translateInputToLatex(input: string): string {
  if (!input) return "";
  let s = input;

  // Simple cleanups
  s = s.replace(/\s+/g, " ");

  // Handle integrals: integrate(expression, var)
  s = s.replace(/integrate\(([^,]+),\s*([^)]+)\)/gi, (match, expr, variable) => {
    return `\\int {${expr}} \\, d{${variable}}`;
  });

  // Handle derivatives: derivative(expression, var)
  s = s.replace(/derivative\(([^,]+),\s*([^)]+)\)/gi, (match, expr, variable) => {
    return `\\frac{d}{d{${variable}}} \\left({${expr}}\\right)`;
  });

  // Handle limits: limit(expression, var, val)
  s = s.replace(/limit\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, (match, expr, variable, value) => {
    return `\\lim_{{${variable}} \\to {${value}}} {${expr}}`;
  });

  // Handle square root: sqrt(x)
  s = s.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

  // Replace * with \cdot
  s = s.replace(/\*/g, " \\cdot ");

  // Replace simple fractions like a/b when they are grouped or single chars
  // e.g. (x+1)/(x-1) -> \frac{x+1}{x-1}
  s = s.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}");
  s = s.replace(/(\w+)\/(\w+)/g, "\\frac{$1}{$2}");

  // Replace general functions
  s = s.replace(/\b(sin|cos|tan|ln|log|exp)\b/g, "\\$1");

  // Format subscripts/superscripts nicely
  s = s.replace(/(\w+)\^(\w+)/g, "$1^{$2}");

  return s;
}

export default function App() {
  const [activeMode, setActiveMode] = useState<SolverMode>("algebra");
  const [query, setQuery] = useState("y = a*x^2 + b*x + c");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // Dynamic sliders states
  const [currentVariables, setCurrentVariables] = useState<Record<string, number>>({
    a: 1.00,
    b: -4.00,
    c: 3.00
  });

  // Isolated variable focus
  const [focusedIsolation, setFocusedIsolation] = useState<{
    variableName: string;
    isolatedFormulaLatex: string;
    isolatedFormulaMathJS: string;
  } | null>(null);

  // Statistics datasets overlay
  const [scatterPoints, setScatterPoints] = useState<{ x: number; y: number }[]>([]);
  const [regressionFormula, setRegressionFormula] = useState<string>("");

  // Default initial algebraic load
  useEffect(() => {
    // Solve initial parabola on start
    handleSolveEquation("y = 1*x^2 - 4*x + 3");
  }, []);

  const handleSolveEquation = async (overrideQuery?: string) => {
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim() && !attachedFile) return;

    setIsLoading(true);
    setErrorMsg("");
    setSolverResult(null);
    setFocusedIsolation(null);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: activeQuery,
          mode: activeMode,
          currentVariables,
          file: attachedFile
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to solve the equation.");
      }

      setSolverResult(data);

      // Extract slider variables (variables other than dependent & independent, that have no value assigned yet)
      const vars = data.variables || [];
      const newVars: Record<string, number> = {};
      
      vars.forEach((v: string) => {
        if (v !== data.independentVariable && v !== data.dependentVariable) {
          // Keep existing value if we already have it, otherwise set to 1
          newVars[v] = currentVariables[v] !== undefined ? currentVariables[v] : 1.0;
        }
      });
      
      // Also check if we have predefined values inside query or templates
      setCurrentVariables(newVars);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected mathematical solver error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (expression: string, category: string) => {
    setQuery(expression);
    handleSolveEquation(expression);
  };

  const handleSliderChange = (name: string, val: number) => {
    setCurrentVariables(prev => ({
      ...prev,
      [name]: val
    }));
  };

  // Build list of slider variable objects for GraphPanel
  const graphSliderVariables = useMemo(() => {
    return Object.entries(currentVariables).map(([name, value]) => ({
      name,
      value,
      min: name === "m" || name === "m1" || name === "m2" ? 0.1 : -10.0,
      max: 10.0,
      step: 0.1
    }));
  }, [currentVariables]);

  const handleSelectIsolation = (iso: any) => {
    setFocusedIsolation(iso);
  };

  // Advanced Visual Keyboard insertion helper
  const handleInsertSymbol = (symbol: string) => {
    setQuery(prev => {
      // Find cursor position or append
      return prev + symbol;
    });
  };

  // Export current results as Markdown or LaTeX
  const handleExportText = (format: "markdown" | "latex") => {
    if (!solverResult) return;

    let content = "";
    if (format === "markdown") {
      content = `# EQSolver Computational Report\n\n`;
      content += `**Input Expression:** ${solverResult.latexExpression}\n`;
      content += `**Main Equation solved for:** ${solverResult.dependentVariable} = f(${solverResult.independentVariable})\n\n`;
      content += `## Step-by-Step Solving Breakdown\n\n`;
      solverResult.steps.forEach((step, idx) => {
        content += `### Step ${idx + 1}: ${step.title}\n`;
        content += `${step.explanation}\n`;
        content += `$$\n${step.latex}\n$$\n\n`;
      });
      content += `## Final Solution\n${solverResult.finalAnswer}\n`;
    } else {
      content = `% LaTeX Document Block generated by EQSolver\n`;
      content += `\\begin{align*}\n`;
      content += `\\text{Input: } & ${solverResult.latexExpression} \\\\\n`;
      solverResult.steps.forEach((step, idx) => {
        content += `\\text{Step ${idx + 1}: } & ${step.latex} && \\text{(${step.title})} \\\\\n`;
      });
      content += `\\text{Final Answer: } & ${solverResult.finalAnswer}\n`;
      content += `\\end{align*}\n`;
    }

    navigator.clipboard.writeText(content);
    alert(`${format.toUpperCase()} documentation successfully copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800 relative" id="eqsolver-app-root">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Primary Global Navigation Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between" id="global-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-indigo-600 p-2 rounded-lg shadow-sm border border-emerald-400/20" id="header-logo-container">
            <Atom className="w-5 h-5 text-white animate-spin-slow" id="logo-icon" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-base tracking-tight text-slate-800">EQSolver</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-mono">v3.5 Engine</span>
            </div>
            <p className="text-xs text-slate-500 font-sans">Multi-Disciplinary Symbolical & Numerical Computational Engine</p>
          </div>
        </div>

        {/* Global Stats or Indicators */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 font-mono" id="engine-telemetry">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reasoning Engine: Connected</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Dashboard Grid */}
      <main className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6" id="dashboard-grid">
        {/* Left Column: Command & Input Workspaces (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6" id="left-workspace-column">
          {/* Disciplinary Module Mode Switcher */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex flex-wrap gap-1 shadow-inner" id="workspace-mode-selector">
            {[
              { id: "algebra", label: "Math & Calculus", icon: Binary },
              { id: "physics", label: "Physics & Constants", icon: Atom },
              { id: "chemistry", label: "Chemistry Toolkit", icon: FlaskConical },
              { id: "matrix", label: "Matrix Operations", icon: Grid3X3 },
              { id: "statistics", label: "Stats & Regression", icon: TrendingUp },
              { id: "nlp", label: "NLP Word Problems", icon: MessageSquare }
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setActiveMode(mode.id as SolverMode);
                    // Prepopulate with a helpful starting value based on the selected workspace
                    if (mode.id === "algebra") setQuery("y = a*x^2 + b*x + c");
                    else if (mode.id === "physics") setQuery("E_k = 0.5 * m * v^2");
                    else if (mode.id === "chemistry") setQuery("Fe + O2 -> Fe2O3");
                    else if (mode.id === "nlp") setQuery("Solve for r when the area of a circle is 50 square meters.");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all uppercase ${
                    activeMode === mode.id
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                  id={`mode-btn-${mode.id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Render Active Specialized Panel Context */}
          {activeMode === "matrix" && (
            <div className="h-[600px]" id="matrix-panel-slot">
              <MatrixPanel />
            </div>
          )}

          {activeMode === "chemistry" && (
            <div className="h-[600px]" id="chemistry-panel-slot">
              <ChemistryPanel />
            </div>
          )}

          {activeMode === "statistics" && (
            <div className="h-[600px]" id="statistics-panel-slot">
              <StatisticsPanel
                onUpdateRegression={(points, formula, type) => {
                  setScatterPoints(points);
                  setRegressionFormula(formula);
                }}
              />
            </div>
          )}

          {/* Standard Input & Solvers for Algebra, Physics, NLP Word Problems */}
          {(activeMode === "algebra" || activeMode === "physics" || activeMode === "nlp") && (
            <div className="flex flex-col gap-6" id="algebraic-solving-suite">
              {/* Main Parser input card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4" id="equation-input-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-[10px] uppercase tracking-wider text-slate-500">
                    {activeMode === "nlp" ? "Conversational Math Query" : "Mathematical Expression Parser"}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">Accepts LaTeX, algebra, or standard variables</div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      activeMode === "nlp"
                        ? "e.g., A cylinder has a volume of 100 cubic cm and height of 5 cm. Solve for radius."
                        : "e.g., y = x^3 - 3*x + 2 or derivative(sin(x) * exp(x), x)"
                    }
                    onKeyDown={(e) => { if (e.key === "Enter") handleSolveEquation(); }}
                    className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded px-4 py-2 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm"
                    id="eq-query-input"
                  />
                  <button
                    onClick={() => handleSolveEquation()}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-5 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    id="btn-trigger-solve"
                  >
                    {isLoading ? <span className="animate-spin text-sm">⌬</span> : <Play className="w-3.5 h-3.5 fill-white text-white" />}
                    Solve
                  </button>
                </div>

                {/* File Attachment Dropzone */}
                <div className="border-t border-slate-100 pt-3" id="main-file-upload-section">
                  <FileAttachmentZone
                    file={attachedFile}
                    onFileChange={setAttachedFile}
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded border border-rose-200 text-xs shadow-sm" id="parsing-error">
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Real-time Math Preview WYSIWYG Feedback */}
                {activeMode !== "nlp" && query.trim() && (
                  <div className="bg-slate-50/50 p-3 rounded border border-slate-100 flex flex-col gap-1 shadow-sm animate-fade-in" id="realtime-preview-card">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Math Notation Preview</span>
                    <div className="bg-white p-2.5 rounded border border-slate-200/40 flex justify-center overflow-x-auto min-h-[44px] items-center">
                      <MathView math={translateInputToLatex(query)} block />
                    </div>
                  </div>
                )}

                {/* Dynamic Scientific Visual Keyboard */}
                {activeMode !== "nlp" && (
                  <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded border border-slate-100" id="visual-keyboard">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Symbol Insertion Assist</span>
                    <div className="flex flex-wrap gap-1.5" id="keyboard-grid">
                      {[
                        { label: "+", insert: " + " },
                        { label: "-", insert: " - " },
                        { label: "×", insert: " * " },
                        { label: "÷", insert: " / " },
                        { label: "x²", insert: "^2" },
                        { label: "xʸ", insert: "^" },
                        { label: "√x", insert: "sqrt(" },
                        { label: "π", insert: "pi" },
                        { label: "e", insert: "e" },
                        { label: "sin(x)", insert: "sin(x)" },
                        { label: "cos(x)", insert: "cos(x)" },
                        { label: "ln(x)", insert: "log(x)" },
                        { label: "d/dx", insert: "derivative(y, x)" },
                        { label: "∫", insert: "integrate(x, x)" },
                        { label: "Limit", insert: "limit(x, x, 0)" }
                      ].map((sym) => (
                        <button
                          key={sym.label}
                          onClick={() => handleInsertSymbol(sym.insert)}
                          className="px-2.5 py-1 text-xs font-mono bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded transition-colors shadow-sm"
                          id={`key-btn-${sym.label}`}
                        >
                          {sym.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fundamental Constants Linking (For Physics Mode) */}
              {activeMode === "physics" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-fade-in" id="scientific-constants-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans font-semibold text-[10px] uppercase tracking-wider text-slate-500">Fundamental Scientific Constants</h3>
                    <span className="text-[10px] text-slate-400 font-sans">Click on any constant to insert into expression</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="constants-grid">
                    {SCIENTIFIC_CONSTANTS.map((c) => (
                      <button
                        key={c.symbol}
                        onClick={() => handleInsertSymbol(c.symbol)}
                        className="flex flex-col text-left p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 hover:border-indigo-300 rounded-lg transition-all"
                        id={`const-card-${c.symbol}`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className="text-xs font-bold text-indigo-600 font-mono">{c.symbol}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{c.unit}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 line-clamp-1">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 line-clamp-1">{c.value.toExponential(4)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Solving Board */}
              {solverResult && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 animate-fade-in" id="solving-board">
                  {/* Solver Board Header */}
                  <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-4">
                    <div>
                      <h3 className="font-sans font-bold text-xs text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-emerald-500" /> Solved Step-by-Step Breakdown
                      </h3>
                      <p className="text-xs text-slate-500">Formal algebraic isolating steps & laws applied</p>
                    </div>
                    {/* Export capabilities */}
                    <div className="flex gap-2" id="export-controls">
                      <button
                        onClick={() => handleExportText("markdown")}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 transition-colors font-semibold shadow-sm"
                        id="btn-export-md"
                      >
                        <Clipboard className="w-3.5 h-3.5 text-emerald-600" /> Markdown
                      </button>
                      <button
                        onClick={() => handleExportText("latex")}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 transition-colors font-semibold shadow-sm"
                        id="btn-export-latex"
                      >
                        <FileDown className="w-3.5 h-3.5 text-indigo-600" /> LaTeX Code
                      </button>
                    </div>
                  </div>

                  {/* Variable Isolation Sub-Panel */}
                  {solverResult.variables && solverResult.variables.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100" id="isolation-widget">
                      <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Algebraic Variable Isolation</span>
                      <div className="flex flex-wrap gap-2 mb-3" id="variable-capsules">
                        {solverResult.variables.map((v) => {
                          const isIsolated = focusedIsolation?.variableName === v;
                          return (
                            <button
                              key={v}
                              onClick={() => {
                                const iso = solverResult.alternateIsolations?.find(i => i.variableName === v);
                                if (iso) {
                                  handleSelectIsolation(iso);
                                } else {
                                  // Call solver dynamically to isolate
                                  handleSolveEquation(`Isolate ${v} in: ${query}`);
                                }
                              }}
                              className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                                isIsolated
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                              }`}
                              id={`isolate-btn-${v}`}
                            >
                              Isolate: {v}
                            </button>
                          );
                        })}
                      </div>

                      {focusedIsolation && (
                        <div className="bg-white p-3 rounded border border-slate-200/60 font-mono text-xs text-slate-600 flex flex-col gap-1.5 shadow-inner" id="focused-isolation-display">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Isolated formula:</div>
                          <div className="text-sm font-bold text-indigo-700 flex items-center gap-1">
                            <span>{focusedIsolation.variableName} =</span>
                            <MathView math={focusedIsolation.isolatedFormulaLatex} />
                          </div>
                          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1.5">Numerical model: {focusedIsolation.isolatedFormulaMathJS}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* The actual steps block */}
                  <div className="space-y-3" id="steps-scroller">
                    {solverResult.steps.map((step, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4 rounded border border-slate-100 flex gap-4 animate-fade-in" id={`step-row-${idx}`}>
                        <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-700 flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="space-y-1.5 flex-1 overflow-hidden">
                          <h5 className="font-sans font-semibold text-xs text-indigo-700">{step.title}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed">{step.explanation}</p>
                          <div className="mt-1.5 bg-white px-3.5 py-2.5 rounded border border-slate-200/60 inline-block max-w-full overflow-x-auto shadow-sm">
                            <MathView math={step.latex} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Final Answer Callout badge */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex flex-col gap-1 text-center shadow-sm" id="final-answer-callout">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Final Computed Answer</span>
                    <div className="font-sans text-base font-semibold text-emerald-800" id="final-answer-content">
                      <MathView math={solverResult.finalAnswer} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Visualization & Graphing Engine (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6" id="right-visualization-column">
          {/* Quick Load Templates Drawer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="formula-templates-drawer">
            <h3 className="font-sans font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-3">Loaded Equation Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="templates-list-grid">
              {(FORMULA_TEMPLATES[activeMode] || FORMULA_TEMPLATES.algebra).map((t) => (
                <button
                  key={t.title}
                  onClick={() => handleLoadTemplate(t.expression, t.category)}
                  className="flex flex-col text-left p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/60 hover:border-emerald-300 rounded-lg transition-all shadow-sm"
                  id={`template-btn-${t.title.replace(/\s+/g, "-")}`}
                >
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded border border-slate-200 uppercase self-start mb-1.5">{t.category}</span>
                  <span className="text-xs font-bold text-slate-700 line-clamp-1">{t.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 truncate w-full mt-1">{t.expression}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic 2D Graph Panel slot */}
          <div className="flex-1 min-h-[450px]" id="graph-panel-slot">
            <GraphPanel
              primaryFormula={
                activeMode === "statistics" ? regressionFormula : (solverResult?.graphingFormula || "")
              }
              keyPoints={solverResult?.graphingKeyPoints || []}
              scatterData={activeMode === "statistics" ? scatterPoints : []}
              regressionLine={activeMode === "statistics" ? regressionFormula : ""}
              sliderVariables={activeMode === "statistics" ? [] : graphSliderVariables}
              onSliderChange={handleSliderChange}
            />
          </div>

          {/* Disciplinary contextual helper */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex gap-3 shadow-sm" id="contextual-helper">
            <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" id="tip-info-icon" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block">Workspace Tip</span>
              <p className="leading-relaxed text-slate-500">
                EQSolver performs dual-tier calculations. The client coordinates with local numerical engines (`mathjs`) for instant real-time slider graphing, while consulting Gemini on the server for symbolic solving, stoichiometry, and physics step explanations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global minimal footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-center text-xs text-slate-400 font-mono" id="global-footer">
        EQSolver Engine • Cloud-Native Multi-Disciplinary Solver Hub
      </footer>
    </div>
  );
}
