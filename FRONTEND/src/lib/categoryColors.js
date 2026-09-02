// A restrained palette drawn from the ledger theme, used consistently
// across pie charts, bar charts, and category tags so the same
// category always reads as the same color throughout the app.
const PALETTE = [
  "#1F6F54", // emerald
  "#B5533C", // rust
  "#B8935F", // gold
  "#3D6B8A", // slate blue
  "#6B4B8A", // muted plum
  "#8A6B1F", // ochre
  "#4B5650", // ink-soft
  "#A6754A", // clay
];

const cache = new Map();

export function colorForCategory(name) {
  if (cache.has(name)) return cache.get(name);
  const color = PALETTE[cache.size % PALETTE.length];
  cache.set(name, color);
  return color;
}