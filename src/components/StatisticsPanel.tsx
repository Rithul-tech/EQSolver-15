import React, { useState, useMemo, useEffect } from "react";
import { Table, Plus, Trash2, BarChart2, TrendingUp, Sparkles, AlertCircle, FileSpreadsheet } from "lucide-react";
import MathView from "./MathView";

interface DataPoint {
  x: number;
  y: number;
}

interface StatisticsPanelProps {
  onUpdateRegression: (
    scatterPoints: { x: number; y: number }[],
    regressionFormula: string,
    regressionModelLabel: string
  ) => void;
}

export default function StatisticsPanel({ onUpdateRegression }: StatisticsPanelProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { x: 1, y: 2.1 },
    { x: 2, y: 4.3 },
    { x: 3, y: 5.8 },
    { x: 4, y: 8.2 },
    { x: 5, y: 10.1 },
    { x: 6, y: 11.9 }
  ]);
  const [regressionType, setRegressionType] = useState<"linear" | "exponential" | "logarithmic">("linear");
  const [rawPaste, setRawPaste] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  const handleAddPoint = () => {
    const lastPt = dataPoints[dataPoints.length - 1];
    const newX = lastPt ? lastPt.x + 1 : 1;
    const newY = lastPt ? lastPt.y + 2 : 2;
    setDataPoints([...dataPoints, { x: newX, y: newY }]);
  };

  const handleRemovePoint = (index: number) => {
    if (dataPoints.length <= 2) return; // Need at least 2 points
    const copy = [...dataPoints];
    copy.splice(index, 1);
    setDataPoints(copy);
  };

  const handleValueChange = (index: number, field: "x" | "y", val: string) => {
    const copy = [...dataPoints];
    const parsed = parseFloat(val);
    copy[index][field] = isNaN(parsed) ? 0 : parsed;
    setDataPoints(copy);
  };

  const handlePasteSpreadsheet = () => {
    const rows = rawPaste.trim().split(/\r?\n/);
    const parsedPoints: DataPoint[] = [];

    rows.forEach(row => {
      const cols = row.split(/[\t,;\s]+/);
      if (cols.length >= 2) {
        const xVal = parseFloat(cols[0]);
        const yVal = parseFloat(cols[1]);
        if (!isNaN(xVal) && !isNaN(yVal)) {
          parsedPoints.push({ x: xVal, y: yVal });
        }
      }
    });

    if (parsedPoints.length >= 2) {
      setDataPoints(parsedPoints);
      setShowPasteBox(false);
      setRawPaste("");
    }
  };

  // Regression calculation engine
  const regressionResults = useMemo(() => {
    const n = dataPoints.length;
    if (n < 2) return null;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    let sumLogX = 0, sumLogY = 0, sumXLogY = 0, sumLogXLogY = 0, sumLogXX = 0;
    
    // Filter invalid points for specific math models
    const validPoints = dataPoints.filter(p => {
      if (regressionType === "logarithmic" && p.x <= 0) return false;
      if (regressionType === "exponential" && p.y <= 0) return false;
      return true;
    });

    const m = validPoints.length;
    if (m < 2) {
      return {
        error: "Insufficient valid points for selected regression. (Exponential requires Y > 0, Logarithmic requires X > 0)."
      };
    }

    validPoints.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;

      const logX = p.x > 0 ? Math.log(p.x) : 0;
      const logY = p.y > 0 ? Math.log(p.y) : 0;

      sumLogX += logX;
      sumLogY += logY;
      sumXLogY += p.x * logY;
      sumLogXLogY += logX * logY;
      sumLogXX += logX * logX;
    });

    let slope = 0;
    let intercept = 0;
    let r2 = 0;
    let mathJSFormula = "";
    let latexFormula = "";

    const meanY = sumY / m;
    let ssTot = 0;
    let ssRes = 0;

    validPoints.forEach(p => {
      ssTot += Math.pow(p.y - meanY, 2);
    });

    if (regressionType === "linear") {
      // y = mx + b
      const denom = (m * sumXX - sumX * sumX);
      if (denom !== 0) {
        slope = (m * sumXY - sumX * sumY) / denom;
        intercept = (sumY - slope * sumX) / m;
      }
      
      validPoints.forEach(p => {
        const predY = slope * p.x + intercept;
        ssRes += Math.pow(p.y - predY, 2);
      });

      r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;
      mathJSFormula = `${slope.toFixed(4)} * x + ${intercept.toFixed(4)}`;
      latexFormula = `y = ${slope.toFixed(4)}x ${intercept >= 0 ? "+" : ""} ${intercept.toFixed(4)}`;
      
    } else if (regressionType === "exponential") {
      // y = a * e^(b * x) -> ln(y) = ln(a) + b*x
      const denom = (m * sumXX - sumX * sumX);
      let b = 0;
      let lnA = 0;
      if (denom !== 0) {
        b = (m * sumXLogY - sumX * sumLogY) / denom;
        lnA = (sumLogY - b * sumX) / m;
      }
      const a = Math.exp(lnA);
      
      validPoints.forEach(p => {
        const predY = a * Math.exp(b * p.x);
        ssRes += Math.pow(p.y - predY, 2);
      });

      r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;
      mathJSFormula = `${a.toFixed(4)} * exp(${b.toFixed(4)} * x)`;
      latexFormula = `y = ${a.toFixed(4)} \\cdot e^{${b.toFixed(4)}x}`;
      slope = b; // parameter b
      intercept = a; // parameter a
      
    } else if (regressionType === "logarithmic") {
      // y = a + b * ln(x)
      const denom = (m * sumLogXX - sumLogX * sumLogX);
      let b = 0;
      let a = 0;
      if (denom !== 0) {
        b = (m * sumXY - sumLogX * sumY) / denom; // Wait, logarithmic fits y against ln(x)
        // Let's calculate standard log fit properly
        // sum(ln(x) * y)
        let sumLogXY = 0;
        validPoints.forEach(p => {
          sumLogXY += Math.log(p.x) * p.y;
        });
        b = (m * sumLogXY - sumLogX * sumY) / denom;
        a = (sumY - b * sumLogX) / m;
      }
      
      validPoints.forEach(p => {
        const predY = a + b * Math.log(p.x);
        ssRes += Math.pow(p.y - predY, 2);
      });

      r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;
      mathJSFormula = `${a.toFixed(4)} + ${b.toFixed(4)} * log(x)`;
      latexFormula = `y = ${a.toFixed(4)} + ${b.toFixed(4)} \\ln(x)`;
      slope = b; // parameter b
      intercept = a; // parameter a
    }

    return {
      slope,
      intercept,
      r2,
      mathJSFormula,
      latexFormula,
      validPoints
    };
  }, [dataPoints, regressionType]);

  // Synchronize computed results to parent for the graph curve and scatter plot overlays
  useEffect(() => {
    if (regressionResults && !regressionResults.error) {
      onUpdateRegression(
        regressionResults.validPoints || [],
        regressionResults.mathJSFormula || "",
        regressionType
      );
    }
  }, [regressionResults, regressionType]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="statistics-panel-container">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-150">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-500" id="stats-header-icon" />
          <h3 className="font-sans font-semibold text-slate-800 text-xs">Statistical Analysis & Regression</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded shadow-sm transition-colors"
            id="btn-toggle-paste"
          >
            <FileSpreadsheet className="w-3 h-3 text-slate-500" /> Spreadsheet Paste
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin" id="stats-workspace">
        {showPasteBox && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3" id="spreadsheet-paste-box">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Spreadsheet Paste Box (TSV / CSV)</span>
            <textarea
              rows={4}
              value={rawPaste}
              onChange={(e) => setRawPaste(e.target.value)}
              placeholder="Paste columns from Excel or Sheets. E.g.:&#10;1  2.1&#10;2  4.3&#10;3  5.8"
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded p-2 text-slate-800 font-mono text-xs outline-none transition-all shadow-sm"
              id="raw-paste-textarea"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasteBox(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                id="btn-cancel-paste"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSpreadsheet}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors shadow-sm"
                id="btn-confirm-paste"
              >
                Parse Points
              </button>
            </div>
          </div>
        )}

        {/* Regression Select Model */}
        <div className="flex flex-col gap-1.5" id="model-select-wrapper">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Best Fit Regression Model
          </label>
          <div className="grid grid-cols-3 gap-2" id="regression-buttons">
            {(["linear", "exponential", "logarithmic"] as const).map(type => (
              <button
                key={type}
                onClick={() => setRegressionType(type)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all uppercase tracking-wide ${
                  regressionType === type
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                    : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                }`}
                id={`btn-reg-${type}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Points Table Inputs */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" id="points-table-card">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-250">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Statistical Coordinate Dataset</span>
            <button
              onClick={handleAddPoint}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              id="btn-add-point"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100" id="table-scroll-area">
            {dataPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center px-4 py-1.5 gap-4 bg-white hover:bg-slate-50/40" id={`row-${idx}`}>
                <span className="text-[10px] text-slate-400 font-mono w-6">#{idx + 1}</span>
                <div className="flex-1 flex gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-mono text-slate-400">X:</span>
                    <input
                      type="number"
                      step="any"
                      value={pt.x}
                      onChange={(e) => handleValueChange(idx, "x", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm focus:border-indigo-500"
                      id={`input-pt-x-${idx}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-mono text-slate-400">Y:</span>
                    <input
                      type="number"
                      step="any"
                      value={pt.y}
                      onChange={(e) => handleValueChange(idx, "y", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs outline-none transition-colors shadow-sm focus:border-indigo-500"
                      id={`input-pt-y-${idx}`}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePoint(idx)}
                  disabled={dataPoints.length <= 2}
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-35 disabled:hover:text-slate-400 p-1 rounded transition-colors"
                  title="Remove point"
                  id={`btn-del-pt-${idx}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Computed Metrics */}
        {regressionResults && (
          <div className="space-y-4" id="stats-results-wrapper">
            {"error" in regressionResults ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs shadow-sm" id="stats-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regressionResults.error as string}</span>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in" id="regression-metrics">
                <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Best Fit Parameters
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="regression-cards-grid">
                  {/* Regression Model Formula */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="reg-eq-card">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Solved Equation</span>
                    <div className="flex items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded min-h-[50px]">
                      <MathView math={regressionResults.latexFormula} block={true} />
                    </div>
                  </div>

                  {/* R^2 Determination Coefficient */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="reg-r2-card">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Determination R²</span>
                    <div className="font-mono text-xl font-bold text-slate-800">
                      {regressionResults.r2 ? regressionResults.r2.toFixed(5) : "—"}
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block mt-1">
                      Fits {Math.max(0, Math.min(100, regressionResults.r2 * 100)).toFixed(2)}% of coordinates variance.
                    </span>
                  </div>
                </div>

                {/* Analytical breakdown */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2 font-sans" id="reg-summary-card">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Mathematical Metrics breakdown</span>
                  <div className="space-y-1 font-mono text-slate-600 text-xs">
                    <div className="flex justify-between border-b border-slate-200/50 pb-1">
                      <span>Regression Type:</span>
                      <span className="text-slate-800 capitalize font-semibold">{regressionType}</span>
                    </div>
                    {regressionType === "linear" && (
                      <>
                        <div className="flex justify-between pt-1">
                          <span>Slope (m):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.slope.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Y-intercept (b):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.intercept.toFixed(6)}</span>
                        </div>
                      </>
                    )}
                    {regressionType === "exponential" && (
                      <>
                        <div className="flex justify-between pt-1">
                          <span>Scale parameter (a):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.intercept.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Growth factor (b):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.slope.toFixed(6)}</span>
                        </div>
                      </>
                    )}
                    {regressionType === "logarithmic" && (
                      <>
                        <div className="flex justify-between pt-1">
                          <span>Constant scalar (a):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.intercept.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Log multiplier (b):</span>
                          <span className="text-slate-800 font-semibold">{regressionResults.slope.toFixed(6)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
