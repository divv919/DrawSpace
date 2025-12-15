"use client";

import { Content } from "@/types/canvas";
import React, { SetStateAction, useState } from "react";
import { Camera } from "../lib/camera";
import { Canvas } from "../lib/draw";

export function useSelectedShape({
  existingShapes,
  lastMousePosition,
  setExistingShapes,
}: {
  existingShapes: Content[];
  lastMousePosition: React.RefObject<{
    x: number;
    y: number;
  }>;
  setExistingShapes: React.Dispatch<
    SetStateAction<(Content & { id?: string; tempId?: string })[]>
  >;
}) {
  const [isMovingObject, setIsMovingObject] = useState(false);
  const [isResizingObject, setIsResizingObject] = useState(false);
  const [hoveredShapeIndex, setHoveredShapeIndex] = useState(-1);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(-1);
  const [handle, setHandle] = useState<
    | "center"
    | "tl"
    | "tr"
    | "bl"
    | "br"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | undefined
  >(undefined);
  const handleObjectMove = (
    camera: Camera,
    e: React.MouseEvent,
    erasedShapesIndexes: number[],
    canvas: Canvas,
    socket: WebSocket,
    user: {
      userId: undefined | string;
      access: "user" | "admin" | "moderator" | undefined;
    }
  ) => {
    // add logic for moving object
    const selectedShape = existingShapes[selectedShapeIndex];
    if (selectedShape.userId !== user.userId && user.access === "user") {
      alert("cannot move object");

      setIsMovingObject(false);
      // setSelectedShapeIndex(-1);
      setHandle(undefined);

      return;
    }
    const worldDeltaX =
      (e.clientX - lastMousePosition.current.x) / camera.scale;
    const worldDeltaY =
      (e.clientY - lastMousePosition.current.y) / camera.scale;
    lastMousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
    let updatedShape = selectedShape;
    if (selectedShape.type === "pencil") {
      updatedShape = {
        ...selectedShape,
        startX: (selectedShape.startX ?? 0) + worldDeltaX,
        startY: (selectedShape.startY ?? 0) + worldDeltaY,
        endX: (selectedShape.endX ?? 0) + worldDeltaX,
        endY: (selectedShape.endY ?? 0) + worldDeltaY,
        points: selectedShape.points.map((point: { x: number; y: number }) => ({
          x: (point.x ?? 0) + worldDeltaX,
          y: (point.y ?? 0) + worldDeltaY,
        })),
      };
    } else {
      updatedShape = {
        ...selectedShape,
        startX: (selectedShape.startX ?? 0) + worldDeltaX,
        startY: (selectedShape.startY ?? 0) + worldDeltaY,
        endX: (selectedShape.endX ?? 0) + worldDeltaX,
        endY: (selectedShape.endY ?? 0) + worldDeltaY,
      };
    }
    const updatedShapes = [...existingShapes];
    updatedShapes[selectedShapeIndex] = updatedShape;
    canvas.redraw(
      camera,
      updatedShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );

    const formattedUpdate = { ...updatedShape, operation: "update" };

    setExistingShapes(updatedShapes);
    socket.send(JSON.stringify(formattedUpdate));
  };

  const handleObjectResize = (
    camera: Camera,
    e: React.MouseEvent,
    erasedShapesIndexes: number[],
    canvas: Canvas,
    socket: WebSocket,
    user: {
      userId: undefined | string;
      access: "user" | "admin" | "moderator" | undefined;
    }
  ) => {
    const worldDeltaX =
      (e.clientX - lastMousePosition.current.x) / camera.scale;
    const worldDeltaY =
      (e.clientY - lastMousePosition.current.y) / camera.scale;

    const selectedShape = existingShapes[selectedShapeIndex];
    if (selectedShape.userId !== user.userId && user.access === "user") {
      setIsResizingObject(false);
      // setSelectedShapeIndex(-1);
      setHandle(undefined);
      alert("cannot resize other's shape");
      return;
    }
    let updatedShape: Content;
    if (selectedShape.type === "text") {
      return;
    }
    if (selectedShape.type === "pencil") {
      // === PENCIL STROKE: Scale all points proportionally ===
      const points = selectedShape.points || [];
      if (points.length === 0) {
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Calculate current bounding box from points
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      points.forEach((p: { x: number; y: number }) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      // Calculate new bounding box based on handle
      let newMinX = minX,
        newMinY = minY,
        newMaxX = maxX,
        newMaxY = maxY;

      if (handle === "left") newMinX += worldDeltaX;
      else if (handle === "right") newMaxX += worldDeltaX;
      else if (handle === "top") newMinY += worldDeltaY;
      else if (handle === "bottom") newMaxY += worldDeltaY;
      else if (handle === "tl") {
        newMinX += worldDeltaX;
        newMinY += worldDeltaY;
      } else if (handle === "tr") {
        newMaxX += worldDeltaX;
        newMinY += worldDeltaY;
      } else if (handle === "bl") {
        newMinX += worldDeltaX;
        newMaxY += worldDeltaY;
      } else if (handle === "br") {
        newMaxX += worldDeltaX;
        newMaxY += worldDeltaY;
      }

      // Check if the bounding box flipped
      const xFlipped = newMinX > newMaxX;
      const yFlipped = newMinY > newMaxY;

      if (xFlipped || yFlipped) {
        // Swap the handle for smooth continued dragging
        const handleSwapMap: Record<string, Record<string, string>> = {
          xOnly: {
            left: "right",
            right: "left",
            tl: "tr",
            tr: "tl",
            bl: "br",
            br: "bl",
          },
          yOnly: {
            top: "bottom",
            bottom: "top",
            tl: "bl",
            bl: "tl",
            tr: "br",
            br: "tr",
          },
          both: {
            tl: "br",
            tr: "bl",
            bl: "tr",
            br: "tl",
          },
        };

        let newHandle = handle;
        if (xFlipped && yFlipped && handle) {
          newHandle = (handleSwapMap.both[handle] as typeof handle) || handle;
        } else if (xFlipped && handle) {
          newHandle = (handleSwapMap.xOnly[handle] as typeof handle) || handle;
        } else if (yFlipped && handle) {
          newHandle = (handleSwapMap.yOnly[handle] as typeof handle) || handle;
        }

        setHandle(newHandle);
      }

      // Scale all points from old bbox to new bbox
      const oldWidth = maxX - minX;
      const oldHeight = maxY - minY;
      const newWidth = newMaxX - newMinX;
      const newHeight = newMaxY - newMinY;

      const newPoints = points.map((p: { x: number; y: number }) => ({
        x:
          oldWidth === 0
            ? newMinX
            : newMinX + ((p.x - minX) / oldWidth) * newWidth,
        y:
          oldHeight === 0
            ? newMinY
            : newMinY + ((p.y - minY) / oldHeight) * newHeight,
      }));

      updatedShape = {
        ...selectedShape,
        points: newPoints,
        startX: newMinX,
        startY: newMinY,
        endX: newMaxX,
        endY: newMaxY,
      };
    } else if (
      selectedShape.type === "line" ||
      selectedShape.type === "arrow"
    ) {
      // === LINE/ARROW: Move the endpoint at the handle position ===
      const startX = selectedShape.startX ?? 0;
      const startY = selectedShape.startY ?? 0;
      const endX = selectedShape.endX ?? 0;
      const endY = selectedShape.endY ?? 0;

      // Track which endpoint is at which side BEFORE the move
      const startWasLeft = startX <= endX;
      const startWasTop = startY <= endY;

      let newStartX = startX,
        newStartY = startY;
      let newEndX = endX,
        newEndY = endY;

      // Apply deltas based on current handle and endpoint positions
      if (handle === "left") {
        if (startWasLeft) newStartX += worldDeltaX;
        else newEndX += worldDeltaX;
      } else if (handle === "right") {
        if (startWasLeft) newEndX += worldDeltaX;
        else newStartX += worldDeltaX;
      } else if (handle === "top") {
        if (startWasTop) newStartY += worldDeltaY;
        else newEndY += worldDeltaY;
      } else if (handle === "bottom") {
        if (startWasTop) newEndY += worldDeltaY;
        else newStartY += worldDeltaY;
      } else if (handle === "tl") {
        if (startWasLeft) newStartX += worldDeltaX;
        else newEndX += worldDeltaX;
        if (startWasTop) newStartY += worldDeltaY;
        else newEndY += worldDeltaY;
      } else if (handle === "tr") {
        if (startWasLeft) newEndX += worldDeltaX;
        else newStartX += worldDeltaX;
        if (startWasTop) newStartY += worldDeltaY;
        else newEndY += worldDeltaY;
      } else if (handle === "bl") {
        if (startWasLeft) newStartX += worldDeltaX;
        else newEndX += worldDeltaX;
        if (startWasTop) newEndY += worldDeltaY;
        else newStartY += worldDeltaY;
      } else if (handle === "br") {
        if (startWasLeft) newEndX += worldDeltaX;
        else newStartX += worldDeltaX;
        if (startWasTop) newEndY += worldDeltaY;
        else newStartY += worldDeltaY;
      }

      // Check if sides crossed AFTER the move
      const startIsNowLeft = newStartX <= newEndX;
      const startIsNowTop = newStartY <= newEndY;
      const xCrossed = startWasLeft !== startIsNowLeft;
      const yCrossed = startWasTop !== startIsNowTop;

      // Swap handle when edges cross for smooth continued dragging
      if (xCrossed || yCrossed) {
        const handleSwapMap: Record<string, Record<string, string>> = {
          // X crossed only
          xOnly: {
            left: "right",
            right: "left",
            tl: "tr",
            tr: "tl",
            bl: "br",
            br: "bl",
          },
          // Y crossed only
          yOnly: {
            top: "bottom",
            bottom: "top",
            tl: "bl",
            bl: "tl",
            tr: "br",
            br: "tr",
          },
          // Both crossed
          both: {
            tl: "br",
            tr: "bl",
            bl: "tr",
            br: "tl",
          },
        };

        let newHandle = handle;
        if (xCrossed && yCrossed && handle) {
          newHandle = (handleSwapMap.both[handle] as typeof handle) || handle;
        } else if (xCrossed && handle) {
          newHandle = (handleSwapMap.xOnly[handle] as typeof handle) || handle;
        } else if (yCrossed && handle) {
          newHandle = (handleSwapMap.yOnly[handle] as typeof handle) || handle;
        }

        setHandle(newHandle);
      }

      updatedShape = {
        ...selectedShape,
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY,
      };
    } else {
      // === RECTANGLE/ELLIPSE: Simple coordinate adjustment ===
      updatedShape = { ...selectedShape };

      if (handle === "bottom") {
        updatedShape.endY = (selectedShape.endY ?? 0) + worldDeltaY;
      } else if (handle === "top") {
        updatedShape.startY = (selectedShape.startY ?? 0) + worldDeltaY;
      } else if (handle === "left") {
        updatedShape.startX = (selectedShape.startX ?? 0) + worldDeltaX;
      } else if (handle === "right") {
        updatedShape.endX = (selectedShape.endX ?? 0) + worldDeltaX;
      } else if (handle === "tl") {
        updatedShape.startX = (selectedShape.startX ?? 0) + worldDeltaX;
        updatedShape.startY = (selectedShape.startY ?? 0) + worldDeltaY;
      } else if (handle === "tr") {
        updatedShape.endX = (selectedShape.endX ?? 0) + worldDeltaX;
        updatedShape.startY = (selectedShape.startY ?? 0) + worldDeltaY;
      } else if (handle === "bl") {
        updatedShape.startX = (selectedShape.startX ?? 0) + worldDeltaX;
        updatedShape.endY = (selectedShape.endY ?? 0) + worldDeltaY;
      } else if (handle === "br") {
        updatedShape.endX = (selectedShape.endX ?? 0) + worldDeltaX;
        updatedShape.endY = (selectedShape.endY ?? 0) + worldDeltaY;
      }
    }

    const updatedShapes = [...existingShapes];
    updatedShapes[selectedShapeIndex] = updatedShape;
    canvas.redraw(
      camera,
      updatedShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
    const formattedUpdate = { ...updatedShape, operation: "update" };
    setExistingShapes(updatedShapes);

    socket.send(JSON.stringify(formattedUpdate));
    lastMousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  return {
    handleObjectMove,
    handleObjectResize,
    isMovingObject,
    setIsMovingObject,
    isResizingObject,
    setIsResizingObject,
    hoveredShapeIndex,
    setHoveredShapeIndex,
    selectedShapeIndex,
    setSelectedShapeIndex,
    handle,
    setHandle,
  };
}
