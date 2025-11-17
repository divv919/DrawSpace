export type Shape =
  | "rectangle"
  | "ellipse"
  | "pencil"
  | "line"
  | "arrow"
  | "text";

export type Content = {
  type: Shape;
  text?: string;
  clientX?: number;
  clientY?: number;
  height?: number;
  width?: number;
  radiusX?: number;
  radiusY?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  points?: Json;
  color?: string;
};
