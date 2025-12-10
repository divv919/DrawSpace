"use client";

import CanvasSidebar from "@/app/components/CanvasSidebar";
import createCanvas from "@/app/lib/draw";
import { Content, Shape } from "@/types/canvas";
import { useState, useRef, useEffect } from "react";
import CanvasTopBar from "./CanvasTopBar";
import ZoomIndicator from "./ZoomIndicator";
import { getCursor } from "@/app/lib/util";
const shapes: Shape[] = [
  "select",
  "hand",

  "rectangle",
  "ellipse",
  "pencil",
  "line",
  "arrow",
  "text",
  "erasor",
];

const normalizeShape = (shape: Content): Content => {
  const normalized = { ...shape };

  // Normalize X coordinates
  if ((normalized.startX ?? 0) > (normalized.endX ?? 0)) {
    const temp = normalized.startX;
    normalized.startX = normalized.endX;
    normalized.endX = temp;
  }

  // Normalize Y coordinates
  if ((normalized.startY ?? 0) > (normalized.endY ?? 0)) {
    const temp = normalized.startY;
    normalized.startY = normalized.endY;
    normalized.endY = temp;
  }

  return normalized;
};

const CanvasComponent = ({
  existingShapes,
  socket,
  setExistingShapes,
}: {
  existingShapes: Content[];
  setExistingShapes: React.Dispatch<React.SetStateAction<Content[]>>;
  socket: WebSocket;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<ReturnType<typeof createCanvas> | null>(
    null
  );
  const [currentColor, setCurrentColor] =
    useState<CanvasRenderingContext2D["strokeStyle"]>("white");
  const [currentShape, setCurrentShape] =
    useState<Content["type"]>("rectangle");
  const [startXY, setStartXY] = useState({ x: 0, y: 0 });
  const [endXY, setEndXY] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
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
  // last mouse position is used when drawing lines by pencil
  const lastMousePosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // the points that denote pencil strokes
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);

  // this acts like a viewport for the user
  const camera = useRef({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  // to make sure browser default zoom is blocked
  useEffect(() => {
    const disableZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", disableZoom, { passive: false });

    return () => {
      document.removeEventListener("wheel", disableZoom);
    };
  }, []);

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 5;
  const MAX_CAMERA_X = 500;
  const MAX_CAMERA_Y = 500;
  const MIN_CAMERA_X = -500;
  const MIN_CAMERA_Y = -500;

  useEffect(() => {
    if (currentShape !== "select") {
      if (!canvas) return;
      setHandle(undefined);
      setSelectedShapeIndex(-1);
      canvas.redraw(camera, existingShapes, -1);
    }
  }, [currentShape]);

  // making the size of canvas according to the device width and height
  useEffect(() => {
    const listener = () => {
      if (typeof window !== "undefined") {
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  // every zoom in or zoom out requires the canvas to redraw,
  // basically enforcing the zoom logic
  useEffect(() => {
    if (!canvas) {
      return;
    }
    canvas.redraw(camera, existingShapes, selectedShapeIndex);
  }, [zoomLevel]);

  // for initializing the canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      setCanvas(createCanvas(canvas));
    }
  }, [canvasRef.current]);
  // selecting shapes using keys logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(e.key)) {
        setCurrentShape(shapes[Number(e.key) - 1]);
      }
      if (e.key === "Escape") {
        setCurrentShape(shapes[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // as the existing shapes change this will run , making sure that
  // the shapes recieved by the express server are rendered as
  // soon as they get recieved
  useEffect(() => {
    if (!canvas) {
      return;
    }

    canvas.redraw(camera, existingShapes, selectedShapeIndex);
  }, [existingShapes, canvas]);

  const WORLD = {
    minX: -6000,
    maxX: 8000,
    minY: -4000,
    maxY: 5000,
  };

  const getCameraBounds = () => {
    const viewWidth = canvasSize.width / camera.current.scale;
    const viewHeight = canvasSize.height / camera.current.scale;

    return {
      minX: -WORLD.maxX * camera.current.scale + canvasSize.width,
      maxX: -WORLD.minX * camera.current.scale,
      minY: -WORLD.maxY * camera.current.scale + canvasSize.height,
      maxY: -WORLD.minY * camera.current.scale,
    };
  };

  // Logic for mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvas) {
      return;
    }

    if (isMovingObject) {
      // add logic for moving object
      const selectedShape = existingShapes[selectedShapeIndex];

      const worldDeltaX =
        (e.clientX - lastMousePosition.current.x) / camera.current.scale;
      const worldDeltaY =
        (e.clientY - lastMousePosition.current.y) / camera.current.scale;
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
          points: selectedShape.points.map(
            (point: { x: number; y: number }) => ({
              x: (point.x ?? 0) + worldDeltaX,
              y: (point.y ?? 0) + worldDeltaY,
            })
          ),
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
      canvas.redraw(camera, updatedShapes, selectedShapeIndex);
      setExistingShapes(updatedShapes);
    }
    if (isResizingObject) {
      const worldDeltaX =
        (e.clientX - lastMousePosition.current.x) / camera.current.scale;
      const worldDeltaY =
        (e.clientY - lastMousePosition.current.y) / camera.current.scale;

      const selectedShape = existingShapes[selectedShapeIndex];
      let updatedShape: Content;

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
            newHandle =
              (handleSwapMap.xOnly[handle] as typeof handle) || handle;
          } else if (yFlipped && handle) {
            newHandle =
              (handleSwapMap.yOnly[handle] as typeof handle) || handle;
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
            newHandle =
              (handleSwapMap.xOnly[handle] as typeof handle) || handle;
          } else if (yCrossed && handle) {
            newHandle =
              (handleSwapMap.yOnly[handle] as typeof handle) || handle;
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
      canvas.redraw(camera, updatedShapes, selectedShapeIndex);
      setExistingShapes(updatedShapes);

      lastMousePosition.current = {
        x: e.clientX,
        y: e.clientY,
      };
      return;
    }
    if (currentShape === "select") {
      if (!isMovingObject && selectedShapeIndex !== -1) {
        const selectedShapeInfo = canvas.getSelectedRectangleInfo(camera, {
          x: e.clientX,
          y: e.clientY,
        });
        setHandle(selectedShapeInfo);

        if (selectedShapeInfo) {
          return;
        }
      }

      const hoveredElementIndex = canvas.getHoveredElementIndex(
        camera,
        existingShapes,
        { x: e.clientX, y: e.clientY }
      );
      setHoveredShapeIndex(hoveredElementIndex);
      return;
    }
    //Different logic for dragging action and drawing action
    if (isDragging) {
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };

      const bounds = getCameraBounds();

      camera.current.x = Math.min(
        Math.max(camera.current.x + deltaX, bounds.minX),
        bounds.maxX
      );
      camera.current.y = Math.min(
        Math.max(camera.current.y + deltaY, bounds.minY),
        bounds.maxY
      );

      // every movement redraws the components according to new position
      canvas.redraw(camera, existingShapes, selectedShapeIndex);
      return;
    }

    if (isDrawing) {
      canvas.getContext().setTransform(1, 0, 0, 1, 0, 0);
      canvas.clearCanvas();
      canvas
        .getContext()
        .setTransform(
          camera.current.scale,
          0,
          0,
          camera.current.scale,
          camera.current.x,
          camera.current.y
        );
      existingShapes.map((shape: Content) => {
        const renderer = canvas.shapeRenderer[shape.type];
        renderer(shape);
        return;
      });
      const worldX = (e.clientX - camera.current.x) / camera.current.scale;
      const worldY = (e.clientY - camera.current.y) / camera.current.scale;
      setEndXY({ x: worldX, y: worldY });
      canvas.shapeRenderer[currentShape]({
        startX: startXY.x,
        startY: startXY.y,
        endX: worldX,
        endY: worldY,
        points: penPoints,
        color: currentColor,
      });
      if (currentShape === "pencil") {
        setPenPoints((prev) => [...prev, { x: worldX, y: worldY }]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!canvas) {
      return;
    }
    if (currentShape === "select") {
      if (isResizingObject && selectedShapeIndex !== -1) {
        // Normalize the shape coordinates after resize
        const updatedShapes = [...existingShapes];
        if (
          updatedShapes[selectedShapeIndex].type === "rectangle" ||
          updatedShapes[selectedShapeIndex].type === "ellipse"
        ) {
          updatedShapes[selectedShapeIndex] = normalizeShape(
            existingShapes[selectedShapeIndex]
          );
          setExistingShapes(updatedShapes);
          canvas.redraw(camera, updatedShapes, selectedShapeIndex);
        }
      }
      setIsMovingObject(false);
      setIsResizingObject(false);
      return;
    }
    if (currentShape === "hand") {
      setIsDragging(false);
      return;
    }

    setIsDrawing(false);
    // this is the global canvas dimensions, i.e our camera would move around it.
    // this is calculated so that drawings made during zoomed or
    // moved camera can be normalized to a standard global value
    const worldX = (e.clientX - camera.current.x) / camera.current.scale;
    const worldY = (e.clientY - camera.current.y) / camera.current.scale;

    setEndXY({ x: worldX, y: worldY });
    const dx = Math.abs(startXY.x - worldX);
    const dy = Math.abs(startXY.y - worldY);

    if (dx < 1 && dy < 1) return; // ignore micro clicks

    // Create the new shape object
    const newShape = {
      startX: startXY?.x || 0,
      startY: startXY?.y || 0,
      endX: worldX,
      endY: worldY,
      type: currentShape,
      color: currentColor,
      points: currentShape === "pencil" ? penPoints : [],
    };

    // Create the updated shapes array with the new shape
    const updatedShapes = [...existingShapes, newShape];
    const newSelectedIndex = updatedShapes.length - 1;

    // Update state
    setExistingShapes(updatedShapes);
    setCurrentShape("select");
    setSelectedShapeIndex(newSelectedIndex);

    // Redraw with the updated shapes array so the selection rectangle appears immediately
    canvas.redraw(camera, updatedShapes, newSelectedIndex);
    setPenPoints([]);
    setStartXY({ x: 0, y: 0 });
    setEndXY({ x: 0, y: 0 });
    // send to websocket server
    socket.send(
      JSON.stringify({
        color: currentColor,
        type: currentShape,
        endX: worldX,
        endY: worldY,
        startX: startXY.x,
        startY: startXY.y,
        points: penPoints,
      })
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) {
      return;
    }
    if (currentShape === "select") {
      lastMousePosition.current = { x: e.clientX, y: e.clientY };

      if (handle) {
        if (handle === "center") {
          setIsMovingObject(true);
          return;
        }
        if (
          handle === "tl" ||
          handle === "tr" ||
          handle === "bl" ||
          handle === "br" ||
          handle === "bottom" ||
          handle === "top" ||
          handle === "left" ||
          handle === "right"
        ) {
          setIsResizingObject(true);
          return;
        }
      }
      setSelectedShapeIndex(hoveredShapeIndex);
      canvas.redraw(camera, existingShapes, hoveredShapeIndex);

      return;
    }

    if (currentShape === "hand") {
      setIsDragging(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // normalization
    const worldX = (e.clientX - camera.current.x) / camera.current.scale;
    const worldY = (e.clientY - camera.current.y) / camera.current.scale;
    setStartXY({ x: worldX, y: worldY });

    if (currentShape === "pencil") {
      setPenPoints((prev) => [...prev, { x: worldX, y: worldY }]);
    }
    setIsDrawing(true);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!canvas) {
      return;
    }
    if (currentShape === "select") {
      const hoveredElementIndex = canvas.getHoveredElementIndex(
        camera,
        existingShapes,
        { x: e.clientX, y: e.clientY }
      );
      setHoveredShapeIndex(hoveredElementIndex);
    }
    // handling mouse movement through wheel
    if (!e.ctrlKey) {
      camera.current.x -= e.deltaX;
      camera.current.y -= e.deltaY;

      const bounds = getCameraBounds();

      camera.current.x = Math.min(
        Math.max(camera.current.x, bounds.minX),
        bounds.maxX
      );
      camera.current.y = Math.min(
        Math.max(camera.current.y, bounds.minY),
        bounds.maxY
      );

      canvas.redraw(camera, existingShapes, selectedShapeIndex);
      return;
    }

    // handling zoom through wheel
    const zoomIntensity = 0.05;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const direction = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = 1 + direction * zoomIntensity;

    const prevScale = camera.current.scale;
    let newScale = prevScale * zoomFactor;

    newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));
    const actualZoom = newScale / prevScale;

    // global coordinates of the cursor
    const worldX = (mouseX - camera.current.x) / prevScale;
    const worldY = (mouseY - camera.current.y) / prevScale;

    // changing the scale value
    camera.current.scale = newScale;
    setZoomLevel(newScale);

    // position changes of camera because of zoom
    camera.current.x = mouseX - worldX * newScale;
    camera.current.y = mouseY - worldY * newScale;

    // redrawing all the shapes respective to current camera
    canvas.redraw(camera, existingShapes, selectedShapeIndex);
  };

  return (
    <div className="h-screen w-screen  scrollbar-none">
      <canvas
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`bg-neutral-900 h-full w-full  ${
          // currentShape === "hand"
          //   ? isDragging
          //     ? "cursor-grabbing"
          //     : "cursor-grab"
          //   : currentShape === "select"
          //     ? hoveredShapeIndex === -1
          //       ? "cursor-default"
          //       : "cursor-move"
          //     : "cursor-crosshair"
          getCursor(handle, isDragging, currentShape, hoveredShapeIndex)
        }`}
        style={{
          // imageRendering: "pixelated",
          touchAction: "none",
        }}
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      <ZoomIndicator
        MAX_ZOOM={MAX_ZOOM}
        MIN_ZOOM={MIN_ZOOM}
        camera={camera}
        setZoomLevel={setZoomLevel}
        zoomLevel={zoomLevel}
      />
      <CanvasTopBar
        shapes={shapes}
        currentShape={currentShape}
        setCurrentShape={setCurrentShape}
      />
      <CanvasSidebar
        setCurrentColor={setCurrentColor}
        currentColor={currentColor}
      />
    </div>
  );
};
export default CanvasComponent;
