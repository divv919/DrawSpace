"use client";
import { Content } from "@/types/canvas";
import type { Canvas } from "../lib/draw";
import React, { SetStateAction, useState } from "react";
import type { Camera } from "../lib/camera";
import { useToast } from "./useToast";
export function useErasorLocal({
  canvas,
  existingShapes,
  user,
}: {
  canvas: Canvas | null;
  existingShapes: (Content & { id?: string; tempId?: string })[];
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
  };
}) {
  const [isErasing, setIsErasing] = useState(false);
  const [erasedShapesIndexes, setErasedShapesIndexes] = useState<number[]>([]);
  const { showToast } = useToast();
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
      setErasedShapesIndexes((prev) => {
        const next = [...prev, elementIndex];
        canvas.redraw(camera, existingShapes, selectedShapeIndex, next);
        return next;
      });
    }
  };

  const finishErasing = (
    camera: Camera,
    selectedShapeIndex: number,
    setExistingShapes: React.Dispatch<
      SetStateAction<(Content & { id?: string; tempId?: string })[]>
    >
  ) => {
    if (!canvas) {
      return;
    }
    const toDeleteShapes = existingShapes.filter((_, index) =>
      erasedShapesIndexes.includes(index)
    );
    if (!(toDeleteShapes.length > 0)) {
      console.log(
        "No shapes to delete",

        toDeleteShapes
      );
      return;
    }

    const nextShapes = existingShapes.filter(
      (_, index) => !erasedShapesIndexes.includes(index)
    );
    console.log(erasedShapesIndexes);
    setExistingShapes(nextShapes);

    setErasedShapesIndexes([]);

    canvas.redraw(camera, nextShapes, selectedShapeIndex, []);
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
