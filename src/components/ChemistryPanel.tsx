import React, { useState } from "react";
import { FlaskConical, Sparkles, Scale, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import { ChemistryResult, AttachedFile } from "../types";
import FileAttachmentZone from "./FileAttachmentZone";

export default function ChemistryPanel() {
  const [reactionInput, setReactionInput] = useState("Fe + O2 -> Fe2O3");
  const [phInput, setPhInput] = useState("0.001"); // [H+] concentration
  const [halfLifeInput, setHalfLifeInput] = useState("N_0 = 100, t = 15, t_half = 5.7");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ChemistryResult | null>(null);
  const [activeTab, setActiveTab] = useState<"balancer" | "ph" | "decay">("balancer");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // Stoichiometry mass state
  const [reactMole, setReactMole] = useState<string>("10"); // e.g. 10g
  const [selectedSubstance, setSelectedSubstance] = useState<string>("");

  const handleSolveChemistry = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setResult(null);

    const body: Record<string, any> = {};
    if (activeTab === "balancer") {
      body.reaction = reactionInput;
    } else if (activeTab === "ph") {
      body.phQuery = `Calculate pH, pOH, H+ and OH- for: ${phInput}`;
    } else {
      body.halfLifeQuery = halfLifeInput;
    }

    if (attachedFile) {
      body.file = attachedFile;
    }

    try {
      const response = await fetch("/api/chemistry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to process chemistry request.");
      }
      
      setResult(data);
      if (data.molarMasses && data.molarMasses.length > 0) {
        setSelectedSubstance(data.molarMasses[0].substance);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected chemistry solver error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Local client-side pH calculator for instant feedbacks
  const handleClientPhCalc = (val: string) => {
    setPhInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const ph = -Math.log10(parsed);
      const poh = 14 - ph;
      const oh = Math.pow(10, -poh);
      
      setResult({
        success: true,
        phValue: ph,
        finalExplanation: `Client-calculated metrics:\n- pH = ${ph.toFixed(4)}\n- pOH = ${poh.toFixed(4)}\n- [H⁺] = ${parsed.toExponential(4)} M\n- [OH⁻] = ${oh.toExponential(4)} M`,
        steps: [
          { title: "Apply log definition of pH", explanation: `pH is defined as -log10([H⁺]). Using the input [H⁺] of ${parsed} M, pH = -log10(${parsed}) = ${ph.toFixed(4)}.` },
          { title: "Deduce pOH", explanation: `Since pH + pOH = 14 at 25°C, pOH = 14 - pH = 14 - ${ph.toFixed(4)} = ${poh.toFixed(4)}.` },
          { title: "Calculate [OH⁻]", explanation: `[OH⁻] concentration is calculated as 10^(-pOH) = 10^(-${poh.toFixed(4)}) = ${oh.toExponential(4)} M.` }
        ]
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="chemistry-panel-container">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-600" id="chem-header-icon" />
          <h3 className="font-sans font-semibold text-slate-800 text-xs">Chemistry Toolkit</h3>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200" id="chem-tabs">
          <button
            onClick={() => { setActiveTab("balancer"); setResult(null); setErrorMsg(""); }}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === "balancer" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-balancer"
          >
            Stoichiometry & Balancer
          </button>
          <button
            onClick={() => { setActiveTab("ph"); setResult(null); setErrorMsg(""); }}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === "ph" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-ph"
          >
            pH Calculator
          </button>
          <button
            onClick={() => { setActiveTab("decay"); setResult(null); setErrorMsg(""); }}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === "decay" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-decay"
          >
            Half-Life Decay
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin" id="chemistry-workspace">
        {activeTab === "balancer" && (
          <div className="space-y-4" id="balancer-tab-content">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unbalanced Reaction Equation</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reactionInput}
                  onChange={(e) => setReactionInput(e.target.value)}
                  placeholder="e.g. C3H8 + O2 -> CO2 + H2O"
                  className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded px-4 py-2 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm"
                  id="reaction-input-field"
                />
                <button
                  onClick={handleSolveChemistry}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-4 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  id="btn-solve-reaction"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  Balance
                </button>
              </div>
              <span className="text-[10px] text-slate-400">Supports standard reactants and products separated by &quot;-&gt;&quot;. E.g., Fe + O2 -&gt; Fe2O3</span>
            </div>
          </div>
        )}

        {activeTab === "ph" && (
          <div className="space-y-4" id="ph-tab-content">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hydronium Ion Concentration [H⁺] (mol/L)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phInput}
                  onChange={(e) => handleClientPhCalc(e.target.value)}
                  placeholder="e.g. 1e-3 or 0.001"
                  className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded px-4 py-2 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm"
                  id="ph-input-field"
                />
                <button
                  onClick={handleSolveChemistry}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-4 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  id="btn-solve-ph"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Complex pH"}
                </button>
              </div>
              <span className="text-[10px] text-slate-400">Enter direct concentration or ask a question (e.g. &quot;What is the pH of 0.05M HCl?&quot;)</span>
            </div>
          </div>
        )}

        {activeTab === "decay" && (
          <div className="space-y-4" id="decay-tab-content">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Decay Kinetics Parameters / Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={halfLifeInput}
                  onChange={(e) => setHalfLifeInput(e.target.value)}
                  placeholder="e.g. Initial N_0 = 100, t = 12 years, t_half = 5 years"
                  className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded px-4 py-2 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm"
                  id="decay-input-field"
                />
                <button
                  onClick={handleSolveChemistry}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-4 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  id="btn-solve-decay"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Solve Decay"}
                </button>
              </div>
              <span className="text-[10px] text-slate-400">Provide parameters or natural queries (e.g., &quot;Carbon-14 remaining after 20000 years&quot;)</span>
            </div>
          </div>
        )}

        {/* File Attachment Dropzone */}
        <div className="border-t border-slate-100 pt-4" id="chem-file-upload-section">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Optional Document / Image Attachment</label>
          <FileAttachmentZone
            file={attachedFile}
            onFileChange={setAttachedFile}
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs shadow-sm" id="chem-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="space-y-5 animate-fade-in" id="chem-results-wrapper">
            <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Stoichiometric Analysis Results
            </h4>

            {result.balancedReaction && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center" id="chem-balanced-reaction">
                <span className="text-[10px] text-slate-500 font-sans block mb-1.5 uppercase tracking-wider font-semibold">Balanced Chemical Equation</span>
                <div className="font-mono text-lg font-bold text-emerald-700 bg-emerald-50 py-1.5 px-4 rounded border border-emerald-100 inline-block">
                  {result.balancedReaction}
                </div>
              </div>
            )}

            {/* Molar Masses Table & Stoichiometry Engine */}
            {result.molarMasses && result.molarMasses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="chem-tables-grid">
                {/* Molar Masses */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="molar-masses-card">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-2 font-sans uppercase tracking-wider">Calculated Molar Masses</span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded overflow-hidden">
                    {result.molarMasses.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs font-mono text-slate-600 bg-slate-50/50">
                        <span className="font-bold text-emerald-600">{m.substance}</span>
                        <span>{m.molarMass.toFixed(3)} g/mol</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mass to Mass Solver */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col" id="stoichiometry-calc-card">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-2 font-sans uppercase tracking-wider">Stoichiometric Mass Converter</span>
                  <div className="space-y-3 mt-1" id="m2m-controls">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-500">If we react:</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={reactMole}
                          onChange={(e) => setReactMole(e.target.value)}
                          className="w-24 bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono text-xs"
                          id="m2m-mass-input"
                        />
                        <span className="text-slate-500 flex items-center">grams of</span>
                        <select
                          value={selectedSubstance}
                          onChange={(e) => setSelectedSubstance(e.target.value)}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono text-xs flex-1 outline-none"
                          id="m2m-substance-select"
                        >
                          {result.molarMasses.map((m, idx) => (
                            <option key={idx} value={m.substance}>{m.substance}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Stoichiometric yield conversion */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs text-slate-600 space-y-1 font-mono shadow-inner" id="m2m-results">
                      {result.molarMasses.map((target, idx) => {
                        if (target.substance === selectedSubstance) return null;
                        
                        // Simple coefficients matching from equation reactants/products
                        const reactantItem = result.reactants?.find(r => r.formula === selectedSubstance) || 
                                             result.products?.find(p => p.formula === selectedSubstance);
                        const targetItem = result.reactants?.find(r => r.formula === target.substance) || 
                                           result.products?.find(p => p.formula === target.substance);
                        
                        const coefInput = reactantItem?.coefficient || 1;
                        const coefTarget = targetItem?.coefficient || 1;
                        
                        const inputMolarMass = result.molarMasses?.find(m => m.substance === selectedSubstance)?.molarMass || 1;
                        const targetMolarMass = target.molarMass;
                        
                        const inputGrams = parseFloat(reactMole) || 0;
                        const inputMoles = inputGrams / inputMolarMass;
                        const targetMoles = inputMoles * (coefTarget / coefInput);
                        const targetGrams = targetMoles * targetMolarMass;

                        return (
                          <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-100 last:border-0">
                            <span>Yield of <strong className="text-emerald-600">{target.substance}</strong>:</span>
                            <span className="font-bold text-slate-800">{targetGrams.toFixed(3)} g</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Balancing or Equations breaking */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4" id="chem-steps-wrapper">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Solving Process & Mechanism</span>
              <div className="space-y-3" id="chem-steps-list">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-3.5 rounded border border-slate-100 flex gap-3" id={`chem-step-card-${idx}`}>
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-700 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-sans font-semibold text-xs text-slate-800 mb-0.5">{step.title}</h5>
                      <p className="font-sans text-xs text-slate-500 leading-relaxed">{step.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chemical stoichiometry outputs */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="chem-conclusion">
              <span className="text-[10px] text-slate-500 font-sans block mb-1.5 uppercase tracking-wider font-semibold">Analytical Summary</span>
              <p className="font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded border border-slate-100 shadow-inner">
                {result.finalExplanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
