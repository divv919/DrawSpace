"use client";
import { Content } from "@/types/canvas";
import type { Canvas } from "../lib/draw";
import React, { SetStateAction, useState } from "react";
import type { Camera } from "../lib/camera";
export function useErasor({
  canvas,
  existingShapes,
}: {
  canvas: Canvas | null;
  existingShapes: Content[];
}) {
  const [isErasing, setIsErasing] = useState(false);
  const [erasedShapesIndexes, setErasedShapesIndexes] = useState<number[]>([]);

  const captureErasingShapes = (
    camera: Camera,
    selectedShapeIndex: number,
    e: React.MouseEvent
  ) => {
    if (!canvas) {
      return;
    }
    const elementIndex = canvas.getHoveredElementIndex(camera, existingShapes, {
      x: e.clientX ?? 0,
      y: e.clientY ?? 0,
    });
    if (!erasedShapesIndexes.includes(elementIndex) && elementIndex !== -1) {
      setErasedShapesIndexes((prev) => [...prev, elementIndex]);
    }
    canvas.redraw(
      camera,
      existingShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
  };

  const finishErasing = (
    camera: Camera,
    selectedShapeIndex: number,
    setExistingShapes: React.Dispatch<SetStateAction<Content[]>>
  ) => {
    if (!canvas) {
      return;
    }
    setExistingShapes((prev) =>
      prev.filter((_, index) => !erasedShapesIndexes.includes(index))
    );
    setErasedShapesIndexes([]);

    canvas.redraw(
      camera,
      existingShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
  };
  return {
    erasedShapesIndexes,
    isErasing,
    setIsErasing,
    captureErasingShapes,
    finishErasing,
    setErasedShapesIndexes,
  };
}
