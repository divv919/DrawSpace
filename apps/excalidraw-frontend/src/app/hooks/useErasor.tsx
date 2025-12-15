"use client";
import { Content } from "@/types/canvas";
import type { Canvas } from "../lib/draw";
import React, { SetStateAction, useState } from "react";
import type { Camera } from "../lib/camera";
export function useErasor({
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
    >,
    socket: WebSocket
  ) => {
    if (!canvas) {
      return;
    }
    const toDeleteShapes = existingShapes.filter((_, index) =>
      erasedShapesIndexes.includes(index)
    );
    if (
      !(toDeleteShapes.length > 0) ||
      !toDeleteShapes.every((val) => typeof val.id === "string")
    ) {
      return;
    }
    if (
      user.access === "user" &&
      toDeleteShapes.filter((shape) => shape.userId !== user.userId).length > 0
    ) {
      alert("not allowed to erase items drawn by other people");
      //prompt not allowed
      return;
    }
    const nextShapes = existingShapes.filter(
      (_, index) => !erasedShapesIndexes.includes(index)
    );
    setExistingShapes(nextShapes);

    toDeleteShapes.forEach((shape) => {
      const formatShape = { ...shape, operation: "delete" };
      socket.send(
        JSON.stringify({
          ...formatShape,
        })
      );
    });

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
