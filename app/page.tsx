"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Algorithm = "A* Search" | "Dijkstra" | "Breadth-first" | "Depth-first" | "Greedy best-first";
type Cell = { row: number; col: number; wall: boolean };
const ROWS = 21, COLS = 35;
const START = 3 * COLS + 4, END = 17 * COLS + 30;
const algorithms: { name: Algorithm; short: string; color: string; detail: string }[] = [
  { name: "A* Search", short: "A*", color: "#9b8cff", detail: "Balances distance traveled with the estimated distance to the goal." },
  { name: "Dijkstra", short: "Dijkstra", color: "#53c9ed", detail: "Finds the shortest path by exploring the lowest total cost first." },
  { name: "Breadth-first", short: "BFS", color: "#5ee0b4", detail: "Explores every neighbor in waves. Guarantees the shortest path." },
  { name: "Depth-first", short: "DFS", color: "#f5bd67", detail: "Follows one branch deeply before backtracking. Not always shortest." },
  { name: "Greedy best-first", short: "Greedy", color: "#f38ba8", detail: "Heads toward the goal using only the estimated remaining distance." },
];

function makeGrid(): Cell[] { return Array.from({ length: ROWS * COLS }, (_, i) => ({ row: Math.floor(i / COLS), col: i % COLS, wall: false })); }
function neighbors(i: number) { const r = Math.floor(i / COLS), c = i % COLS; return [r > 0 ? i - COLS : -1, c < COLS - 1 ? i + 1 : -1, r < ROWS - 1 ? i + COLS : -1, c > 0 ? i - 1 : -1].filter(n => n >= 0); }
function heuristic(a: number, b: number) { return Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS)) + Math.abs(a % COLS - b % COLS); }
function solve(grid: Cell[], algorithm: Algorithm) {
  const frontier = [START], came = new Map<number, number>(), visited = new Set<number>(), g = new Map<number, number>([[START, 0]]), frames: number[][] = [], closed: number[] = [];
  while (frontier.length) {
    if (algorithm === "Depth-first") { /* stack order */ } else frontier.sort((a, b) => {
      if (algorithm === "Breadth-first") return (g.get(a) ?? 0) - (g.get(b) ?? 0);
      const ga = g.get(a) ?? Infinity, gb = g.get(b) ?? Infinity;
      const score = (i: number) => algorithm === "Dijkstra" ? g.get(i) ?? Infinity : algorithm === "Greedy best-first" ? heuristic(i, END) : (g.get(i) ?? 0) + heuristic(i, END);
      return score(a) - score(b) || ga - gb;
    });
    const current = algorithm === "Depth-first" ? frontier.pop()! : frontier.shift()!;
    if (visited.has(current)) continue;
    visited.add(current); closed.push(current);
    if (closed.length % 1 === 0) frames.push([...closed]);
    if (current === END) break;
    for (const next of neighbors(current)) {
      if (grid[next].wall || visited.has(next)) continue;
      const cost = (g.get(current) ?? 0) + 1;
      if (cost < (g.get(next) ?? Infinity)) { g.set(next, cost); came.set(next, current); frontier.push(next); }
    }
  }
  const path: number[] = []; let node: number | undefined = END;
  if (came.has(END) || START === END) { while (node !== undefined && node !== START) { path.push(node); node = came.get(node); } path.push(START); path.reverse(); }
  return { frames, path, visited: closed.length, distance: path.length ? path.length - 1 : 0, found: path.length > 0 };
}

export default function Home() {
  const [grid, setGrid] = useState<Cell[]>(makeGrid);
  const [algorithm, setAlgorithm] = useState<Algorithm>("A* Search");
  const [active, setActive] = useState<{ algorithm: Algorithm; frames: number[][]; path: number[]; visited: number; distance: number; found: boolean } | null>(null);
  const [step, setStep] = useState(0); const [playing, setPlaying] = useState(false); const [speed, setSpeed] = useState(2);
  const [tool, setTool] = useState<"wall" | "erase">("wall"); const [dragging, setDragging] = useState(false);
  const [runs, setRuns] = useState<ReturnType<typeof solve>[]>([]); const [seedName, setSeedName] = useState("Open field");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedAlgo = algorithms.find(a => a.name === algorithm)!;
  const visibleCells = useMemo(() => {
    const visited = new Set(active?.frames[Math.min(step, Math.max(0, (active?.frames.length ?? 1) - 1))] ?? []);
    const path = new Set(active && step >= active.frames.length ? active.path : []);
    return { visited, path };
  }, [active, step]);
  useEffect(() => { if (playing) timer.current = setInterval(() => setStep(s => { if (!active || s >= active.frames.length) { setPlaying(false); return s; } return s + 1; }), Math.max(18, 170 / speed)); else if (timer.current) clearInterval(timer.current); return () => { if (timer.current) clearInterval(timer.current); }; }, [playing, speed, active]);
  useEffect(() => { const stop = () => setDragging(false); window.addEventListener("pointerup", stop); return () => window.removeEventListener("pointerup", stop); }, []);

  const reset = useCallback(() => { setActive(null); setStep(0); setPlaying(false); setRuns([]); }, []);
  const paint = (i: number) => { if (i === START || i === END) return; reset(); setGrid(old => old.map((c, n) => n === i ? { ...c, wall: tool === "wall" } : c)); };
  const clearWalls = () => { setGrid(makeGrid()); setSeedName("Open field"); reset(); };
  const randomWalls = () => { setGrid(old => old.map((c, i) => ({ ...c, wall: i !== START && i !== END && Math.random() < .25 }))); setSeedName("Random maze"); reset(); };
  const generateMaze = () => {
    const cells = makeGrid().map(c => ({ ...c, wall: c.row % 2 === 0 || c.col % 2 === 0 }));
    for (let r = 1; r < ROWS; r += 2) for (let c = 1; c < COLS; c += 2) cells[r * COLS + c].wall = false;
    for (let r = 1; r < ROWS - 1; r += 2) for (let c = 1; c < COLS - 1; c += 2) { const dirs = [[2, 0], [0, 2]]; const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)]; cells[(r + dr / 2) * COLS + c + dc / 2].wall = false; }
    for (let c = 4; c <= 30; c++) cells[3 * COLS + c].wall = false;
    cells[START].wall = false; cells[END].wall = false; setGrid(cells); setSeedName("Recursive maze"); reset();
  };
  const run = () => { const result = solve(grid, algorithm); setActive({ ...result, algorithm }); setStep(0); setPlaying(true); setRuns([]); };
  const runCompare = () => { setRuns(algorithms.map(a => solve(grid, a.name))); setActive(null); setPlaying(false); };
  const maxSteps = active ? active.frames.length : 0;

  return <main className="app-shell" onPointerLeave={() => setDragging(false)}>
    <section className="main-area">
      <header className="topbar"><div className="breadcrumb"><span className="wordmark">FIELD / 01</span><span>LEARNING TOOL</span></div><div className="top-actions"><span className="top-note">A small lab for big ideas</span></div></header>
      <div className="content">
        <div className="heading-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> PATHFINDING / PLAYGROUND</div><h1>Find the <span>way.</span></h1><p className="subtitle">Draw a few walls. Choose a search strategy. Watch it find the goal.</p></div><button className="compare-toggle" onClick={runCompare}><span className="compare-icon">⇄</span> Compare all five</button></div>
        <div className="workspace-grid">
          <section className="board-card">
            <div className="board-header"><div><span className="panel-label">CANVAS</span><span className="canvas-size">35 × 21 grid</span></div><div className="board-tools"><button className={`tool-btn ${tool === "wall" ? "tool-active" : ""}`} onClick={() => setTool("wall")}>▰ <span>Wall</span></button><button className={`tool-btn ${tool === "erase" ? "tool-active" : ""}`} onClick={() => setTool("erase")}>⌫ <span>Erase</span></button><span className="tool-divider"/><button className="icon-btn clear-btn" title="Delete all walls and reset the grid" aria-label="Delete all walls and reset the grid" onClick={clearWalls}>⌫ <span>Clear</span></button><button className="icon-btn" title="Generate random walls" onClick={randomWalls}>⤨</button></div></div>
            <div className="grid-wrap"><div className="grid-board" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} onContextMenu={e => e.preventDefault()}>{grid.map((cell, i) => <div key={i} onPointerDown={e => { e.preventDefault(); setDragging(true); paint(i); }} onPointerEnter={() => { if (dragging) paint(i); }} className={`cell ${cell.wall ? "wall" : ""} ${visibleCells.visited.has(i) ? "visited" : ""} ${visibleCells.path.has(i) ? "path" : ""} ${i === START ? "start-cell" : ""} ${i === END ? "end-cell" : ""}`}>{i === START ? <span className="marker">➤</span> : i === END ? <span className="marker goal">◎</span> : null}</div>)}</div></div>
            <div className="legend"><span><i className="legend-start">➤</i> Start</span><span><i className="legend-end">◎</i> Goal</span><span><i className="legend-wall"/> Wall</span><span><i className="legend-visited"/> Explored</span><span><i className="legend-path"/> Shortest path</span><span className="legend-seed">◌ {seedName}</span></div>
            <div className="playback"><button className="play-btn" onClick={() => { if (!active) run(); else if (step >= maxSteps) setStep(0); else setPlaying(!playing); }} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button><button className="skip-btn" onClick={() => { reset(); run(); }}>↻</button><div className="timeline"><div className="timeline-labels"><span>{playing ? "Exploring the grid" : active ? active.found ? "Path found" : "No path found" : "Ready to explore"}</span><span>STEP {String(step).padStart(3, "0")} <i>/</i> {String(maxSteps).padStart(3, "0")}</span></div><input type="range" min={0} max={Math.max(maxSteps, 1)} value={Math.min(step, Math.max(maxSteps, 1))} onChange={e => { setPlaying(false); setStep(Number(e.target.value)); }} style={{ "--progress": `${maxSteps ? step / maxSteps * 100 : 0}%` } as React.CSSProperties}/></div><div className="speed-control"><span>Speed</span><select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></div></div>
          </section>
          <aside className="control-card">
            <div className="control-head"><div><span className="panel-label">CONFIGURATION</span><h2>Find your path</h2></div><span className="settings-mark">⚙</span></div>
            <label className="field-label" htmlFor="algorithm">SEARCH ALGORITHM</label><div className="select-wrap"><select id="algorithm" value={algorithm} onChange={e => { setAlgorithm(e.target.value as Algorithm); reset(); }} className="algorithm-select">{algorithms.map(a => <option key={a.name}>{a.name}</option>)}</select><span>⌄</span></div>
            <div className="algo-info"><span className="algo-dot" style={{ background: selectedAlgo.color }}/><p>{selectedAlgo.detail}</p></div>
            <div className="heuristic-row"><span>Heuristic</span><span className="heuristic-value">Manhattan <i>⌄</i></span></div>
            <div className="separator"/><div className="section-title">QUICK PRESETS <span>↗</span></div><div className="preset-grid"><button onClick={clearWalls}><span className="preset-icon open-icon">▦</span><b>Open field</b><small>No obstacles</small></button><button onClick={randomWalls}><span className="preset-icon random-icon">▩</span><b>Random</b><small>25% density</small></button><button onClick={generateMaze}><span className="preset-icon maze-icon">▥</span><b>Maze</b><small>Recursive backtrack</small></button></div>
            <button className="run-btn" onClick={run}><span>▶</span>Run {selectedAlgo.short}<kbd>⏎</kbd></button>
            <div className="algo-footer"><span><i/> {active ? active.found ? "Simulation complete" : "No route found" : "Ready when you are"}</span><span>{seedName}</span></div>
          </aside>
        </div>
        <div className="insights-row"><section className="insight-card"><div className="insight-top"><span className="panel-label">LIVE METRICS</span><span className="live-badge"><i/> LIVE</span></div><div className="metrics"><div><b>{active ? active.visited : "—"}</b><span>Nodes explored</span></div><i/><div><b>{active?.distance || "—"}</b><span>Path length</span></div><i/><div><b>{active ? active.found ? `${(active.visited / (active.visited + active.distance || 1) * 100).toFixed(0)}%` : "—" : "—"}</b><span>Search efficiency</span></div><i/><div><b>{active ? `${(active.frames.length * 0.016).toFixed(2)}s` : "—"}</b><span>Elapsed time</span></div></div></section><section className="insight-card complexity"><span className="panel-label">ALGORITHM PROFILE</span><div className="complexity-row"><span><i style={{ background: selectedAlgo.color }}/> {selectedAlgo.short}</span><span>Completeness <b>Yes</b></span><span>Optimal <b>{algorithm === "Depth-first" || algorithm === "Greedy best-first" ? "No" : "Yes"}</b></span><span>Worst case <code>O(b<sup>d</sup>)</code></span></div></section></div>
        {runs.length > 0 && <section className="comparison"><div className="comparison-heading"><div><span className="panel-label">HEAD TO HEAD</span><h2>One maze, five strategies.</h2></div><button onClick={() => setRuns([])}>✕</button></div><div className="comparison-grid">{algorithms.map((a, i) => <div className="comparison-item" key={a.name}><span className="comparison-color" style={{ background: a.color }}/><b>{a.short}</b><strong>{runs[i].found ? runs[i].distance : "—"}</strong><small>steps · {runs[i].visited} explored</small><div className="comparison-bar"><i style={{ background: a.color, width: `${runs[i].found ? Math.max(5, runs[i].distance / Math.max(...runs.filter(r => r.found).map(r => r.distance), 1) * 100) : 0}%` }}/></div></div>)}</div></section>}
        <footer className="page-footer"><span>Built for curious minds <i>✳</i></span><span>Search. Discover. Understand.</span></footer>
      </div>
    </section>
  </main>;
}
