const periodColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
];

export function periodColor(index: number) {
  return periodColors[index % periodColors.length];
}
