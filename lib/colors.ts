const freeColors = [
  "#047857",
  "#059669",
  "#16a34a",
  "#22c55e",
  "#65a30d",
  "#84cc16",
  "#0f766e",
  "#14b8a6",
  "#15803d",
  "#166534",
  "#4d7c0f",
  "#2f855a"
];

const busyColors = [
  "#b91c1c",
  "#dc2626",
  "#ef4444",
  "#f97316",
  "#c2410c",
  "#be123c",
  "#e11d48",
  "#b45309",
  "#991b1b",
  "#9f1239",
  "#c026d3",
  "#a21caf"
];

export function colorsForMemberIndex(index: number) {
  return {
    freeColor: freeColors[index % freeColors.length],
    busyColor: busyColors[index % busyColors.length]
  };
}
