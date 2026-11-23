# Pathfinder

An interactive pathfinding playground for seeing how search algorithms explore a grid. Draw obstacles, choose a strategy, and watch it work its way to the goal.

## Run locally

The Next.js app and its `package.json` live in the `app` directory.

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Use the simulator

- Click or drag on the grid to add walls. Choose **Erase** to remove them.
- Use **Open field**, **Random**, or **Maze** to load a preset.
- Select an algorithm and choose **Run** to animate its search.
- Use the play, restart, speed, and timeline controls to explore the run.
- Choose **Compare all five** to compare path lengths and explored nodes on the current grid.
- Choose **Clear** to remove every wall and reset the grid.

## Algorithms

The grid uses four-direction movement with equal cost for each step.

| Algorithm | Search strategy | Shortest path guarantee |
| --- | --- | --- |
| A* | Prioritizes distance so far plus Manhattan distance to the goal | Yes |
| Dijkstra | Prioritizes total distance so far | Yes |
| Breadth-first search | Explores the grid in distance layers | Yes |
| Depth-first search | Follows a branch before backtracking | No |
| Greedy best-first | Prioritizes Manhattan distance to the goal | No |

## Project structure

```text
app/
  app/page.tsx       Simulator and search logic
  app/globals.css    Layout, responsive styles, and visual theme
  app/layout.tsx     Root layout and page metadata
```

## Scripts

Run these from `app/`:

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npx tsc --noEmit  # Check TypeScript types
npm run build     # Create a production build
```
