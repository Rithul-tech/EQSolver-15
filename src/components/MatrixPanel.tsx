import React, { useState, useMemo } from "react";
import * as math from "mathjs";
import { Grid3X3, ArrowRightLeft, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

export default function MatrixPanel() {
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  
  // Matrix input state
  const [matrixA, setMatrixA] = useState<string[][]>([
    ["1", "2", "-1"],
    ["2", "0", "1"],
    ["1", "-1", "1"]
  ]);

  const [matrixB, setMatrixB] = useState<string[][]>([
    ["2", "1", "0"],
    ["1", "3", "2"],
    ["0", "1", "1"]
  ]);

  // Vector input state
  const [vectorU, setVectorU] = useState<string[]>(["2", "3", "-1"]);
  const [vectorV, setVectorV] = useState<string[]>(["1", "-2", "2"]);

  const [activeTab, setActiveTab] = useState<"matrix" | "vector">("matrix");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Resize matrices dynamically
  const handleDimensionChange = (newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    
    // Create new structures preserving existing values where possible
    const newA = Array(newRows).fill(null).map((_, r) => {
      return Array(newCols).fill(null).map((_, c) => {
        return (matrixA[r] && matrixA[r][c]) || "0";
      });
    });
    setMatrixA(newA);

    const newB = Array(newRows).fill(null).map((_, r) => {
      return Array(newCols).fill(null).map((_, c) => {
        return (matrixB[r] && matrixB[r][c]) || "0";
      });
    });
    setMatrixB(newB);
    setErrorMsg("");
  };

  const handleCellChange = (mat: "A" | "B", r: number, c: number, val: string) => {
    if (mat === "A") {
      const copy = matrixA.map(row => [...row]);
      copy[r][c] = val;
      setMatrixA(copy);
    } else {
      const copy = matrixB.map(row => [...row]);
      copy[r][c] = val;
      setMatrixB(copy);
    }
  };

  const handleVectorChange = (vec: "U" | "V", idx: number, val: string) => {
    if (vec === "U") {
      const copy = [...vectorU];
      copy[idx] = val;
      setVectorU(copy);
    } else {
      const copy = [...vectorV];
      copy[idx] = val;
      setVectorV(copy);
    }
  };

  // Safe numerical parse of a matrix
  const parseMatrix = (mat: string[][]) => {
    return mat.map(row => row.map(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }));
  };

  const parseVector = (vec: string[]) => {
    return vec.map(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    });
  };

  // Core calculations memoized
  const matrixStats = useMemo(() => {
    setErrorMsg("");
    const numA = parseMatrix(matrixA);
    const numB = parseMatrix(matrixB);
    
    let detA: number | null = null;
    let invA: number[][] | null = null;
    let transposeA: number[][] = [];
    let addAB: number[][] | null = null;
    let multAB: number[][] | null = null;
    let eigenvaluesA: any = null;

    try {
      // Transpose (always valid)
      transposeA = math.transpose(numA) as number[][];

      // Addition (valid if dimensions match)
      if (matrixA.length === matrixB.length && matrixA[0].length === matrixB[0].length) {
        addAB = math.add(numA, numB) as number[][];
      }

      // Multiplication (valid if colsA === rowsB)
      if (matrixA[0].length === matrixB.length) {
        multAB = math.multiply(numA, numB) as number[][];
      }

      // Square matrix specific operations (determinant, inverse, eigenvalues)
      if (rows === cols) {
        detA = math.det(numA);
        
        if (detA !== 0) {
          invA = math.inv(numA) as number[][];
        }

        // Eigenvalues for square matrices using math.eigs (available in mathjs for real symmetric/symmetric-like)
        try {
          const eigs = math.eigs(numA);
          eigenvaluesA = eigs.values;
        } catch {
          // mathjs eigs may fail if matrix is not symmetric or contains complex eigenvalues
          eigenvaluesA = null;
        }
      }
    } catch (err: any) {
      console.error("Matrix MathJS Error:", err);
      setErrorMsg(err.message || "Failed to calculate matrix metrics.");
    }

    return { detA, invA, transposeA, addAB, multAB, eigenvaluesA };
  }, [matrixA, matrixB, rows, cols]);

  const vectorStats = useMemo(() => {
    const u = parseVector(vectorU);
    const v = parseVector(vectorV);

    let dot: number | null = null;
    let cross: number[] | null = null;
    let magU = 0;
    let magV = 0;

    try {
      dot = math.dot(u, v);
      magU = math.norm(u) as number;
      magV = math.norm(v) as number;

      if (u.length === 3 && v.length === 3) {
        cross = math.cross(u, v) as number[];
      }
    } catch (err: any) {
      console.error(err);
    }

    return { dot, cross, magU, magV };
  }, [vectorU, vectorV]);

  const handleClearMatrix = (mat: "A" | "B") => {
    const cleared = Array(rows).fill(null).map(() => Array(cols).fill("0"));
    if (mat === "A") setMatrixA(cleared);
    else setMatrixB(cleared);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="matrix-panel-container">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-slate-500" id="matrix-header-icon" />
          <h3 className="font-sans font-semibold text-slate-800 text-xs">Linear Algebra Toolkit</h3>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200" id="matrix-tabs">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === "matrix" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-matrix"
          >
            Matrices
          </button>
          <button
            onClick={() => setActiveTab("vector")}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === "vector" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-vector"
          >
            Vectors
          </button>
        </div>
      </div>

      {activeTab === "matrix" ? (
        <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin" id="matrix-workspace">
          {/* Dimension selectors */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200" id="dim-controls">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dimension:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDimensionChange(2, 2)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                  rows === 2 && cols === 2
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                    : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                }`}
                id="btn-dim-2x2"
              >
                2 x 2
              </button>
              <button
                onClick={() => handleDimensionChange(3, 3)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                  rows === 3 && cols === 3
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                    : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                }`}
                id="btn-dim-3x3"
              >
                3 x 3
              </button>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <label className="font-sans font-medium text-[10px] uppercase text-slate-500 tracking-wider">Rows:</label>
              <select
                value={rows}
                onChange={(e) => handleDimensionChange(parseInt(e.target.value), cols)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono text-xs focus:border-indigo-500 outline-none"
                id="select-rows"
              >
                {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <label className="font-sans font-medium text-[10px] uppercase text-slate-500 tracking-wider">Cols:</label>
              <select
                value={cols}
                onChange={(e) => handleDimensionChange(rows, parseInt(e.target.value))}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono text-xs focus:border-indigo-500 outline-none"
                id="select-cols"
              >
                {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Grid of Matrices A and B */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="matrix-grids-wrapper">
            {/* Matrix A */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col" id="matrix-a-card">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Matrix A ({rows}×{cols})
                </span>
                <button
                  onClick={() => handleClearMatrix("A")}
                  className="text-slate-400 hover:text-slate-600 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
                  id="btn-clear-a"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Zero
                </button>
              </div>
              <div
                className="grid gap-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                id="matrix-a-grid"
              >
                {matrixA.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`a-${r}-${c}`}
                      type="text"
                      value={val}
                      onChange={(e) => handleCellChange("A", r, c, e.target.value)}
                      className="bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded p-2 text-center text-slate-800 font-mono text-xs transition-colors outline-none shadow-sm"
                      id={`cell-a-${r}-${c}`}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Matrix B */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col" id="matrix-b-card">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Matrix B ({rows}×{cols})
                </span>
                <button
                  onClick={() => handleClearMatrix("B")}
                  className="text-slate-400 hover:text-slate-600 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
                  id="btn-clear-b"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Zero
                </button>
              </div>
              <div
                className="grid gap-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                id="matrix-b-grid"
              >
                {matrixB.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`b-${r}-${c}`}
                      type="text"
                      value={val}
                      onChange={(e) => handleCellChange("B", r, c, e.target.value)}
                      className="bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded p-2 text-center text-slate-800 font-mono text-xs transition-colors outline-none shadow-sm"
                      id={`cell-b-${r}-${c}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs shadow-sm" id="matrix-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Calculations / Output */}
          <div className="space-y-3" id="matrix-calculations-wrapper">
            <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Computations & Metrics
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="matrix-metrics-grid">
              {/* Determinant of A */}
              {rows === cols && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="metric-det">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Determinant det(A)</span>
                  <div className="font-mono text-lg font-bold text-slate-800">
                    {matrixStats.detA !== null ? matrixStats.detA.toFixed(4) : "—"}
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans block mt-1">
                    {matrixStats.detA === 0 ? "Singular (Invertible: No)" : "Non-Singular (Invertible: Yes)"}
                  </span>
                </div>
              )}

              {/* Transpose of A */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col" id="metric-transpose">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Transpose Aᵀ</span>
                <div className="mt-auto bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-xs text-indigo-600 text-center">
                  {matrixStats.transposeA.map((row, r) => (
                    <div key={`t-${r}`} className="flex justify-center gap-3 py-0.5">
                      [{row.map(v => v.toFixed(2)).join(", ")}]
                    </div>
                  ))}
                </div>
              </div>

              {/* Inverse of A */}
              {rows === cols && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col" id="metric-inverse">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Inverse A⁻¹</span>
                  <div className="mt-auto bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-xs text-emerald-600 text-center">
                    {matrixStats.invA ? (
                      matrixStats.invA.map((row, r) => (
                        <div key={`inv-${r}`} className="flex justify-center gap-3 py-0.5">
                          [{row.map(v => v.toFixed(2)).join(", ")}]
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Singular Matrix (No inverse)</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="matrix-algebraic-operations">
              {/* Addition A + B */}
              {matrixStats.addAB && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="op-add">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Addition (A + B)</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-xs text-slate-700">
                    {matrixStats.addAB.map((row, r) => (
                      <div key={`add-${r}`} className="flex justify-center gap-4 py-1">
                        [{row.map(v => parseFloat(v.toFixed(2))).join(", ")}]
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiplication A * B */}
              {matrixStats.multAB && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="op-mult">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Product (A × B)</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-xs text-slate-700">
                    {matrixStats.multAB.map((row, r) => (
                      <div key={`mult-${r}`} className="flex justify-center gap-4 py-1">
                        [{row.map(v => parseFloat(v.toFixed(2))).join(", ")}]
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Eigenvalues square matrix */}
            {rows === cols && matrixStats.eigenvaluesA && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="metric-eigs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Eigenvalues of Matrix A (Real Symmetric Cases)</span>
                <div className="flex flex-wrap gap-2">
                  {(matrixStats.eigenvaluesA as any).map((val: any, idx: number) => {
                    const realVal = typeof val === "number" ? val : val.re;
                    return (
                      <div key={`eig-${idx}`} className="bg-indigo-50 px-3 py-1 rounded border border-indigo-100/60 font-mono text-xs text-indigo-700 font-semibold shadow-sm">
                        λ_{idx + 1} = {realVal.toFixed(4)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-5 overflow-y-auto space-y-5" id="vector-workspace">
          {/* Dimensional details */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap gap-6" id="vector-inputs">
            <div className="flex flex-col gap-2.5 flex-1 min-w-[200px]" id="vector-u-card">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Vector U (3D)
              </span>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-mono px-1">[</span>
                {vectorU.map((val, idx) => (
                  <input
                    key={`u-${idx}`}
                    type="text"
                    value={val}
                    onChange={(e) => handleVectorChange("U", idx, e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-indigo-500 focus:border-indigo-500 text-center text-slate-800 font-mono text-xs py-1 rounded outline-none transition-colors"
                    id={`vector-u-input-${idx}`}
                  />
                ))}
                <span className="text-xs text-slate-400 font-mono px-1">]</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 min-w-[200px]" id="vector-v-card">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Vector V (3D)
              </span>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-mono px-1">[</span>
                {vectorV.map((val, idx) => (
                  <input
                    key={`v-${idx}`}
                    type="text"
                    value={val}
                    onChange={(e) => handleVectorChange("V", idx, e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-emerald-500 focus:border-emerald-500 text-center text-slate-800 font-mono text-xs py-1 rounded outline-none transition-colors"
                    id={`vector-v-input-${idx}`}
                  />
                ))}
                <span className="text-xs text-slate-400 font-mono px-1">]</span>
              </div>
            </div>
          </div>

          {/* Vector operations results */}
          <div className="space-y-3" id="vector-calculations-wrapper">
            <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vector Analytics</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="vector-results-grid">
              {/* Dot product */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="vector-dot">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Dot Product (U · V)</span>
                <div className="font-mono text-lg font-bold text-slate-800">
                  {vectorStats.dot !== null ? vectorStats.dot.toFixed(4) : "—"}
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-1">
                  {vectorStats.dot === 0 ? "Vectors are Orthogonal (Perpendicular)" : "Non-orthogonal vectors"}
                </span>
              </div>

              {/* Magnitudes */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm" id="vector-magnitudes">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Magnitudes (Lengths)</span>
                <div className="space-y-1 text-xs font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>||U|| =</span>
                    <span className="font-semibold text-slate-800">{vectorStats.magU.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>||V|| =</span>
                    <span className="font-semibold text-slate-800">{vectorStats.magV.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* Cross product */}
              {vectorStats.cross && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm md:col-span-2" id="vector-cross">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2 font-sans">Cross Product (U × V)</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-xs text-indigo-700 text-center font-semibold">
                    [{vectorStats.cross.map(v => v.toFixed(3)).join(", ")}]
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans block mt-1 text-center">
                    Resulting vector is perpendicular to both Vector U and Vector V.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
