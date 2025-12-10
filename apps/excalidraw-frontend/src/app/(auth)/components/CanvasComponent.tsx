"use client";

import CanvasSidebar from "@/app/components/CanvasSidebar";
import createCanvas from "@/app/lib/draw";
import { Content, Shape } from "@/types/canvas";
import { useState, useRef, useEffect } from "react";
import CanvasTopBar from "./CanvasTopBar";
import ZoomIndicator from "./ZoomIndicator";
import { getCursor } from "@/app/lib/util";
import { createCamera } from "@/app/lib/camera";
import type { Camera } from "@/app/lib/camera";
import { useErasor } from "@/app/hooks/useErasor";
import { useSelectedShape } from "@/app/hooks/useSelectedShape";
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
  const [currentShape, setCurrentShape] = useState<Content["type"]>("select");
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

  // last mouse position is used when drawing lines by pencil
  const lastMousePosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const {
    captureErasingShapes,
    finishErasing,
    isErasing,
    setIsErasing,
    erasedShapesIndexes,
    setErasedShapesIndexes,
  } = useErasor({
    canvas,
    existingShapes,
  });
  const {
    setSelectedShapeIndex,
    setHandle,
    selectedShapeIndex,
    handle,
    isMovingObject,
    isResizingObject,
    setHoveredShapeIndex,
    setIsMovingObject,
    setIsResizingObject,
    hoveredShapeIndex,
    handleObjectMove,
    handleObjectResize,
  } = useSelectedShape({
    existingShapes,
    lastMousePosition,
    setExistingShapes,
  });

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 5;

  // the points that denote pencil strokes
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);

  // this acts like a viewport for the user
  const camera = useRef<Camera | null>(null);
  useEffect(() => {
    if (camera.current === null) {
      camera.current = createCamera(0, 0, 1);
    }
  }, []);

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

  useEffect(() => {
    if (!canvas || !camera.current) return;

    if (currentShape !== "select") {
      setHandle(undefined);
      setSelectedShapeIndex(-1);
      canvas.redraw(camera.current, existingShapes, -1, erasedShapesIndexes);
    }
    if (currentShape !== "erasor") {
      setIsErasing(false);
      setErasedShapesIndexes([]);
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
    if (!canvas || !camera.current) {
      return;
    }
    canvas.redraw(
      camera.current,
      existingShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
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
      if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key)) {
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
    if (!canvas || !camera.current) {
      return;
    }

    canvas.redraw(
      camera.current,
      existingShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
  }, [existingShapes, canvas]);

  // Logic for mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvas || !camera.current) {
      return;
    }

    if (isErasing) {
      captureErasingShapes(camera.current, selectedShapeIndex, e);
      return;
    }

    if (isMovingObject) {
      handleObjectMove(camera.current, e, erasedShapesIndexes, canvas);
    }
    if (isResizingObject) {
      handleObjectResize(camera.current, e, erasedShapesIndexes, canvas);
      return;
    }
    if (currentShape === "select") {
      if (!isMovingObject && selectedShapeIndex !== -1) {
        const selectedShapeInfo = canvas.getSelectedRectangleInfo(
          camera.current,
          {
            x: e.clientX,
            y: e.clientY,
          }
        );
        setHandle(selectedShapeInfo);

        if (selectedShapeInfo) {
          return;
        }
      }

      const hoveredElementIndex = canvas.getHoveredElementIndex(
        camera.current,
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

      const bounds = camera.current.getCameraBounds(canvasSize);

      camera.current.x = Math.min(
        Math.max(camera.current.x + deltaX, bounds.minX),
        bounds.maxX
      );
      camera.current.y = Math.min(
        Math.max(camera.current.y + deltaY, bounds.minY),
        bounds.maxY
      );

      // every movement redraws the components according to new position
      canvas.redraw(
        camera.current,
        existingShapes,
        selectedShapeIndex,
        erasedShapesIndexes
      );
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

      const { worldX, worldY } = camera.current.getWorldCoordinates(
        e.clientX,
        e.clientY
      );
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
    if (!canvas || !camera.current) {
      return;
    }
    if (isErasing || currentShape === "erasor") {
      if (isErasing) {
        finishErasing(camera.current, selectedShapeIndex, setExistingShapes);
      }
      setIsErasing(false);
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
          canvas.redraw(
            camera.current,
            updatedShapes,
            selectedShapeIndex,
            erasedShapesIndexes
          );
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
    const { worldX, worldY } = camera.current.getWorldCoordinates(
      e.clientX,
      e.clientY
    );

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
    canvas.redraw(
      camera.current,
      updatedShapes,
      newSelectedIndex,
      erasedShapesIndexes
    );
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
    if (!canvas || !camera.current) {
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
      canvas.redraw(
        camera.current,
        existingShapes,
        hoveredShapeIndex,
        erasedShapesIndexes
      );

      return;
    }
    if (currentShape === "erasor") {
      setIsErasing(true);
      return;
    }

    if (currentShape === "hand") {
      setIsDragging(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // normalization
    const { worldX, worldY } = camera.current.getWorldCoordinates(
      e.clientX,
      e.clientY
    );
    setStartXY({ x: worldX, y: worldY });

    if (currentShape === "pencil") {
      setPenPoints((prev) => [...prev, { x: worldX, y: worldY }]);
    }
    setIsDrawing(true);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!canvas || !camera.current) {
      return;
    }
    if (currentShape === "select") {
      const hoveredElementIndex = canvas.getHoveredElementIndex(
        camera.current,
        existingShapes,
        { x: e.clientX, y: e.clientY }
      );
      setHoveredShapeIndex(hoveredElementIndex);
    }
    // handling mouse movement through wheel
    if (!e.ctrlKey) {
      camera.current.x -= e.deltaX;
      camera.current.y -= e.deltaY;

      const bounds = camera.current.getCameraBounds(canvasSize);

      camera.current.x = Math.min(
        Math.max(camera.current.x, bounds.minX),
        bounds.maxX
      );
      camera.current.y = Math.min(
        Math.max(camera.current.y, bounds.minY),
        bounds.maxY
      );

      canvas.redraw(
        camera.current,
        existingShapes,
        selectedShapeIndex,
        erasedShapesIndexes
      );
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

    // global coordinates of the cursor
    const { worldX, worldY } = camera.current.getWorldCoordinates(
      e.clientX,
      e.clientY
    );

    // changing the scale value
    camera.current.scale = newScale;
    setZoomLevel(newScale);

    // position changes of camera because of zoom
    camera.current.x = mouseX - worldX * newScale;
    camera.current.y = mouseY - worldY * newScale;

    // redrawing all the shapes respective to current camera
    canvas.redraw(
      camera.current,
      existingShapes,
      selectedShapeIndex,
      erasedShapesIndexes
    );
  };

  return (
    <div className="h-screen w-screen  scrollbar-none">
      <canvas
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`bg-neutral-900 h-full w-full  ${getCursor(
          handle,
          isDragging,
          currentShape,
          hoveredShapeIndex
        )}`}
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
        camera={camera.current}
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
