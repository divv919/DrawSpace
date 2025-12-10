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
