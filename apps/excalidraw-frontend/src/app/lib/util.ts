import { Shape } from "@/types/canvas";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...input: any[]) {
  return twMerge(clsx(input));
}
type FixedHandles =
  | "center"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "left"
  | "right"
  | "top"
  | "bottom";
type Handles =
  | "center"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | undefined;

const handleToCursor: Record<FixedHandles, string> = {
  center: "cursor-move",
  tl: "cursor-se-resize",
  tr: "cursor-sw-resize",
  bl: "cursor-ne-resize",
  br: "cursor-nw-resize",
  left: "cursor-w-resize",
  right: "cursor-e-resize",
  top: "cursor-s-resize",
  bottom: "cursor-n-resize",
};
export function getCursor(
  handles: Handles,
  isDragging: boolean,
  currentShape: Shape,
  hoveredShapeIndex: number
): string {
  if (currentShape === "erasor") {
    return "cursor-crosshair";
  } else if (currentShape === "hand") {
    return isDragging ? "cursor-grabbing" : "cursor-grab";
  } else if (currentShape === "select") {
    if (handles) {
      return handleToCursor[handles] || "cursor-move";
    }
    if (hoveredShapeIndex !== -1) {
      return "cursor-move";
    }
    return "cursor-default";
  }
  return "cursor-crosshair";
}

// utils/stringToGradient.ts
// utils/stringToGradient.ts
// utils/stringToGradient.ts
export function stringToGradient(str: string) {
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // Extra avalanche
  hash ^= hash >>> 16;

  // Strong hue spread
  const hue1 = Math.abs(hash) % 360;

  // Opposite but slightly skewed for richness
  const hue2 = (hue1 + 160 + ((hash >> 8) % 80)) % 360;

  // 🎨 Brighter tuning
  const saturation1 = 85 + (hash % 10); // 85–95%
  const saturation2 = 85 + ((hash >> 3) % 10); // slight variance

  const lightness1 = 58 + ((hash >> 5) % 8); // 58–66%
  const lightness2 = 54 + ((hash >> 7) % 8); // 54–62%

  return {
    color1: `hsl(${hue1}, ${saturation1}%, ${lightness1}%)`,
    color2: `hsl(${hue2}, ${saturation2}%, ${lightness2}%)`,
  };
}

export function toTitleCase(str: string) {
  if (str.length === 0 || str.length === 1) {
    return str.toUpperCase();
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
