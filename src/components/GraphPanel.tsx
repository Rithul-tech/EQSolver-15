import React, { useState, useEffect, useRef, useMemo } from "react";
import * as math from "mathjs";
import { Play, RotateCcw, ZoomIn, ZoomOut, Maximize, Trash2, Sliders, Info, LineChart } from "lucide-react";
import { KeyPoint } from "../types";

interface GraphPanelProps {
  primaryFormula?: string; // mathjs formula string, e.g. "a * x^2 + b * x + c"
  keyPoints?: KeyPoint[];  // server provided key points (extrema, roots)
  scatterData?: { x: number; y: number }[]; // statistical dataset
  regressionLine?: string; // statistical regression line formula, e.g., "1.82 * x + 0.45"
  sliderVariables?: { name: string; value: number; min: number; max: number; step: number }[];
  onSliderChange?: (name: string, value: number) => void;
}

export default function GraphPanel({
  primaryFormula = "",
  keyPoints = [],
  scatterData = [],
  regressionLine = "",
  sliderVariables = [],
  onSliderChange
}: GraphPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });
  
  // Graph boundaries state
  const [xRange, setXRange] = useState({ min: -10, max: 10 });
  const [yRange, setYRange] = useState({ min: -10, max: 10 });
  
  // Dragging and Panning State
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const rangeAtDragStart = useRef({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });

  // Update container dimensions on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height || 350, 300)
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Set default view boundary fits if scatter data is available
  useEffect(() => {
    if (scatterData.length > 0) {
      const xs = scatterData.map(d => d.x);
      const ys = scatterData.map(d => d.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const padX = Math.max((maxX - minX) * 0.2, 2);
      const padY = Math.max((maxY - minY) * 0.2, 2);
      
      setXRange({ min: minX - padX, max: maxX + padX });
      setYRange({ min: minY - padY, max: maxY + padY });
    }
  }, [scatterData]);

  // Coordinate conversion: Cartesian -> SVG Coordinates
  const scaleX = (x: number) => {
    const ratio = (x - xRange.min) / (xRange.max - xRange.min);
    return ratio * dimensions.width;
  };

  const scaleY = (y: number) => {
    const ratio = (y - yRange.min) / (yRange.max - yRange.min);
    return dimensions.height - ratio * dimensions.height; // Flip Y for SVG
  };

  // SVG Coordinates -> Cartesian
  const invertX = (svgX: number) => {
    return xRange.min + (svgX / dimensions.width) * (xRange.max - xRange.min);
  };

  const invertY = (svgY: number) => {
    return yRange.min + ((dimensions.height - svgY) / dimensions.height) * (yRange.max - yRange.min);
  };

  // Reset graph view bounds to standard [-10, 10]
  const handleResetView = () => {
    setXRange({ min: -10, max: 10 });
    setYRange({ min: -10, max: 10 });
  };

  // Zoom Handler
  const handleZoom = (factor: number) => {
    const xCenter = (xRange.min + xRange.max) / 2;
    const yCenter = (yRange.min + yRange.max) / 2;
    const halfX = ((xRange.max - xRange.min) * factor) / 2;
    const halfY = ((yRange.max - yRange.min) * factor) / 2;
    
    setXRange({ min: xCenter - halfX, max: xCenter + halfX });
    setYRange({ min: yCenter - halfY, max: yCenter + halfY });
  };

  // Mouse Interaction: Pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    // Only drag with left mouse click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    rangeAtDragStart.current = {
      xMin: xRange.min,
      xMax: xRange.max,
      yMin: yRange.min,
      yMax: yRange.max
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    const xSpan = rangeAtDragStart.current.xMax - rangeAtDragStart.current.xMin;
    const ySpan = rangeAtDragStart.current.yMax - rangeAtDragStart.current.yMin;
    
    const deltaCartesianX = (dx / dimensions.width) * xSpan;
    const deltaCartesianY = (dy / dimensions.height) * ySpan;
    
    setXRange({
      min: rangeAtDragStart.current.xMin - deltaCartesianX,
      max: rangeAtDragStart.current.xMax - deltaCartesianX
    });
    setYRange({
      min: rangeAtDragStart.current.yMin + deltaCartesianY,
      max: rangeAtDragStart.current.yMax + deltaCartesianY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Compute Grid Lines
  const gridLines = useMemo(() => {
    const lines: { type: "x" | "y"; coord: number; label: string }[] = [];
    const getStep = (min: number, max: number) => {
      const span = max - min;
      const magnitude = Math.pow(10, Math.floor(Math.log10(span)));
      const normalized = span / magnitude;
      if (normalized < 2) return magnitude / 5;
      if (normalized < 5) return magnitude / 2;
      return magnitude;
    };

    const xStep = getStep(xRange.min, xRange.max);
    const startX = Math.ceil(xRange.min / xStep) * xStep;
    for (let x = startX; x <= xRange.max; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue; // skip axis
      lines.push({ type: "x", coord: x, label: parseFloat(x.toFixed(4)).toString() });
    }

    const yStep = getStep(yRange.min, yRange.max);
    const startY = Math.ceil(yRange.min / yStep) * yStep;
    for (let y = startY; y <= yRange.max; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue; // skip axis
      lines.push({ type: "y", coord: y, label: parseFloat(y.toFixed(4)).toString() });
    }

    return lines;
  }, [xRange, yRange]);

  // Safe evaluation context with slider overrides
  const evaluationScope = useMemo(() => {
    const scope: Record<string, number> = {};
    sliderVariables.forEach(v => {
      scope[v.name] = v.value;
    });
    return scope;
  }, [sliderVariables]);

  // Compute primary function points
  const primaryPathData = useMemo(() => {
    if (!primaryFormula) return "";
    
    let compiled: any;
    try {
      // Pre-compile the formula
      compiled = math.compile(primaryFormula);
    } catch (err) {
      console.warn("Compilation error for formula:", primaryFormula, err);
      return "";
    }

    const steps = 300;
    const points: { x: number; y: number }[] = [];
    const stepSize = (xRange.max - xRange.min) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xRange.min + i * stepSize;
      try {
        const scope = { ...evaluationScope, x };
        const val = compiled.evaluate(scope);
        if (typeof val === "number" && !isNaN(val) && isFinite(val)) {
          points.push({ x, y: val });
        } else {
          points.push({ x, y: NaN }); // create breaks
        }
      } catch {
        points.push({ x, y: NaN });
      }
    }

    // Build SVG Path
    let path = "";
    let isDrawingSegment = false;

    points.forEach((pt) => {
      if (isNaN(pt.y) || Math.abs(pt.y) > 100000) {
        isDrawingSegment = false;
        return;
      }
      
      const svgX = scaleX(pt.x);
      const svgY = scaleY(pt.y);
      
      // Keep points within bounding box plus margin for smooth rendering
      if (svgY < -100 || svgY > dimensions.height + 100) {
        isDrawingSegment = false;
        return;
      }

      if (!isDrawingSegment) {
        path += `M ${svgX} ${svgY}`;
        isDrawingSegment = true;
      } else {
        path += ` L ${svgX} ${svgY}`;
      }
    });

    return path;
  }, [primaryFormula, xRange, yRange, evaluationScope, dimensions]);

  // Compute regression line points (if any)
  const regressionPathData = useMemo(() => {
    if (!regressionLine) return "";
    
    let compiled: any;
    try {
      compiled = math.compile(regressionLine);
    } catch {
      return "";
    }

    const steps = 100;
    const points: { x: number; y: number }[] = [];
    const stepSize = (xRange.max - xRange.min) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xRange.min + i * stepSize;
      try {
        const val = compiled.evaluate({ x });
        if (typeof val === "number" && !isNaN(val) && isFinite(val)) {
          points.push({ x, y: val });
        }
      } catch {
        // ignore
      }
    }

    let path = "";
    points.forEach((pt, idx) => {
      const svgX = scaleX(pt.x);
      const svgY = scaleY(pt.y);
      if (idx === 0) {
        path += `M ${svgX} ${svgY}`;
      } else {
        path += ` L ${svgX} ${svgY}`;
      }
    });

    return path;
  }, [regressionLine, xRange, yRange, dimensions]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="graph-panel-container">
      {/* Top Header/Actions bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-slate-500" id="graph-header-icon" />
          <span className="font-sans font-semibold text-slate-800 text-xs tracking-tight">Interactive Cartesian Plotter</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom In"
            id="btn-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom Out"
            id="btn-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Reset Grid"
            id="btn-reset-grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas SVG */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-white select-none overflow-hidden cursor-move"
        id="graph-stage-wrapper"
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0"
          id="graph-svg"
        >
          {/* Grid lines */}
          {gridLines.map((line, idx) => {
            if (line.type === "x") {
              const svgX = scaleX(line.coord);
              return (
                <g key={`grid-x-${idx}`}>
                  <line
                    x1={svgX}
                    y1={0}
                    x2={svgX}
                    y2={dimensions.height}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={svgX}
                    y={dimensions.height - 8}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-mono pointer-events-none"
                  >
                    {line.label}
                  </text>
                </g>
              );
            } else {
              const svgY = scaleY(line.coord);
              return (
                <g key={`grid-y-${idx}`}>
                  <line
                    x1={0}
                    y1={svgY}
                    x2={dimensions.width}
                    y2={svgY}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={8}
                    y={svgY + 3}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="start"
                    className="font-mono pointer-events-none"
                  >
                    {line.label}
                  </text>
                </g>
              );
            }
          })}

          {/* Central Axes */}
          {/* Y Axis (x=0) */}
          {xRange.min < 0 && xRange.max > 0 && (
            <line
              x1={scaleX(0)}
              y1={0}
              x2={scaleX(0)}
              y2={dimensions.height}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              id="axis-y"
            />
          )}
          {/* X Axis (y=0) */}
          {yRange.min < 0 && yRange.max > 0 && (
            <line
              x1={0}
              y1={scaleY(0)}
              x2={dimensions.width}
              y2={scaleY(0)}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              id="axis-x"
            />
          )}

          {/* Regression Best Fit Line */}
          {regressionLine && regressionPathData && (
            <path
              d={regressionPathData}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="transition-all duration-300"
              id="graph-regression-curve"
            />
          )}

          {/* Primary Formula Curve */}
          {primaryFormula && primaryPathData ? (
            <path
              d={primaryPathData}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-200"
              id="graph-formula-curve"
            />
          ) : primaryFormula ? (
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2}
              fill="#ef4444"
              textAnchor="middle"
              className="font-sans font-medium text-xs"
              id="graph-error-msg"
            >
              Cannot resolve plot. Range might be out of domain.
            </text>
          ) : null}

          {/* Statistical Scatter Data Overlay */}
          {scatterData.map((pt, idx) => {
            const cx = scaleX(pt.x);
            const cy = scaleY(pt.y);
            // Don't render out of view bounds
            if (cx < 0 || cx > dimensions.width || cy < 0 || cy > dimensions.height) return null;
            return (
              <g key={`scatter-pt-${idx}`} className="group cursor-help">
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="#4f46e5"
                  className="opacity-0 group-hover:opacity-20 animate-ping transition-all"
                />
                <title>{`Point: (${pt.x}, ${pt.y})`}</title>
              </g>
            );
          })}

          {/* Highlight Key mathematical points (Extrema, Roots, Intercepts) */}
          {keyPoints.map((pt, idx) => {
            const cx = scaleX(pt.x);
            const cy = scaleY(pt.y);
            if (cx < 0 || cx > dimensions.width || cy < 0 || cy > dimensions.height) return null;
            return (
              <g key={`key-pt-${idx}`} className="group cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill="#ea580c"
                  stroke="#ffffff"
                  strokeWidth="2"
                  id={`keypoint-dot-${idx}`}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="12"
                  fill="#ea580c"
                  className="opacity-0 group-hover:opacity-35 animate-pulse"
                />
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <rect
                     x={cx + 10}
                     y={cy - 25}
                     width="120"
                     height="35"
                     rx="4"
                     fill="#1e293b"
                     stroke="#e2e8f0"
                     strokeWidth="1"
                  />
                  <text
                    x={cx + 16}
                    y={cy - 14}
                    fill="#ffedd5"
                    fontSize="10"
                    fontWeight="bold"
                    className="font-sans"
                  >
                    {pt.label}
                  </text>
                  <text
                    x={cx + 16}
                    y={cy - 3}
                    fill="#94a3b8"
                    fontSize="9"
                    className="font-mono"
                  >
                    ({pt.x.toFixed(2)}, {pt.y.toFixed(2)})
                  </text>
                </g>
                <title>{`${pt.label}: (${pt.x}, ${pt.y})`}</title>
              </g>
            );
          })}
        </svg>

        {/* Floating coordinate indicator */}
        <div className="absolute bottom-3 right-3 bg-white/95 border border-slate-200 text-slate-500 font-mono text-[10px] px-2 py-1 rounded shadow-sm pointer-events-none" id="graph-coordinate-badge">
          X: [{xRange.min.toFixed(1)}, {xRange.max.toFixed(1)}] | Y: [{yRange.min.toFixed(1)}, {yRange.max.toFixed(1)}]
        </div>
      </div>

      {/* Sliders and Dynamic Variable Modifiers */}
      {sliderVariables.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100" id="graph-sliders-panel">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" id="sliders-icon" />
            <h4 className="font-sans text-[10px] font-bold text-slate-600 uppercase tracking-wider">Dynamic Equation Constants</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sliderVariables.map((v) => (
              <div key={v.name} className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-150 shadow-sm" id={`slider-wrap-${v.name}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-medium text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded border border-indigo-100/55">Constant {v.name}</span>
                  <span className="font-mono font-bold text-slate-800">{v.value.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-mono">{v.min}</span>
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={v.value}
                    onChange={(e) => onSliderChange && onSliderChange(v.name, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    id={`slider-input-${v.name}`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono">{v.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
