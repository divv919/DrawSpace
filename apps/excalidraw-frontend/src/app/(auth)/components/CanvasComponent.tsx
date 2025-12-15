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
import { useTextBox } from "@/app/hooks/useTextBox";
import { v4 } from "uuid";
import { RoomUser } from "@/app/canvas/[slug]/page";
import CanvasInfo from "@/app/components/CanvasInfo";
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
// Helper function to remove null values from an object
const removeNullValues = <T extends Record<string, any>>(
  obj: T
): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
};

const CanvasComponent = ({
  existingShapes,
  user,
  socket,
  setExistingShapes,
  roomUsers,
}: {
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
  };
  existingShapes: (Content & { id?: string; tempId?: string })[];

  roomUsers: RoomUser[];
  setExistingShapes: React.Dispatch<
    React.SetStateAction<
      (Content & { id?: string; tempId?: string; userId: string })[]
    >
  >;
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
  const [tempTextValue, setTempTextValue] = useState<
    Content & {
      drawBox: boolean;
      showCaret: boolean;
      caretPos: number;
      textArray: string[];
    }
  >({
    color: "transparent",
    type: "text",
    text: "",
    drawBox: false,
    showCaret: false,
    caretPos: -1,
    textArray: [],
    userId: user.userId ?? "",
  });
  const [caretVisible, setCaretVisible] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(Date.now());
  const caretBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSelectTextClick, setLastSelectTextClick] = useState(-1);

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
    user,
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
  const {
    currentText,
    isEditingText,
    setIsEditingText,
    handleTextBoxEditing,
    handleTextBoxTrigger,
    currentTextBoxXY,
    setCurrentTextBoxXY,
    currentCaretPos,
    setCurrentText,
    setCurrentCaretPos,
    finalizeTextShape,
    editingTextIndex,
  } = useTextBox({ canvas, existingShapes });

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 5;

  // the points that denote pencil strokes
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);

  // this acts like a viewport for the user
  const camera = useRef<Camera | null>(null);
  // for testing logs - todel

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

    // When switching away from text editing, clear temp text
    if (currentShape !== "text") {
      setTempTextValue({
        color: "white",
        type: "text",
        text: "",
        drawBox: false,
        caretPos: -1,
        showCaret: false,
        textArray: [],
        userId: user.userId ?? "",
      });
      setIsEditingText(false);
    }

    if (currentShape !== "select") {
      setHandle(undefined);
      setSelectedShapeIndex(-1);
    }

    if (currentShape !== "erasor") {
      setIsErasing(false);
      setErasedShapesIndexes([]);
    }
  }, [currentShape]);

  // Add a ref to track if color change is from user selection vs user color picker
  const isColorChangeFromSelection = useRef(false);

  // Effect to update selected shape's color when color changes
  useEffect(() => {
    if (
      !canvas ||
      !camera.current ||
      currentShape !== "select" ||
      selectedShapeIndex === -1 ||
      isEditingText ||
      isMovingObject ||
      isResizingObject ||
      isDrawing ||
      isColorChangeFromSelection.current
    ) {
      return;
    }

    // Get the selected shape
    const selectedShape = existingShapes[selectedShapeIndex];
    if (!selectedShape) {
      return;
    }
    if (selectedShape.color === currentColor) {
      return;
    }
    if (selectedShape.userId !== user.userId && user.access === "user") {
      alert("cannot change property of others");
      setCurrentColor(selectedShape.color);
      return;
    }

    // Only update if the color actually changed

    if (!selectedShape.id) {
      return;
    }
    // Update the shape's color in existingShapes
    const updated = [...existingShapes];
    updated[selectedShapeIndex] = {
      ...updated[selectedShapeIndex],
      color: currentColor,
    };

    // Update state
    setExistingShapes(updated);
    const { startX, startY, text, type, endX, endY, points } = selectedShape;
    // Send to websocket server

    socket.send(
      JSON.stringify({
        operation: "update",
        color: currentColor,
        startX,
        startY,
        text,
        type,
        endX,
        endY,
        points,
        id: selectedShape.id,
      })
    );

    // Redraw canvas
    canvas.redraw(
      camera.current,
      updated,
      selectedShapeIndex,
      erasedShapesIndexes
    );
  }, [
    currentColor,
    selectedShapeIndex,
    currentShape,
    isEditingText,
    isMovingObject,
    isResizingObject,
    isDrawing,
    canvas,
    camera,
    // existingShapes,
    socket,
    erasedShapesIndexes,
  ]);

  // Separate effect for redraw to ensure state is updated
  useEffect(() => {
    if (!canvas || !camera.current) return;

    // Only include tempTextValue if we're editing text
    const shapesToRender =
      isEditingText && currentShape === "text"
        ? [...existingShapes, tempTextValue]
        : existingShapes;

    const selectedIndex = currentShape === "select" ? selectedShapeIndex : -1;
    const erasedIndexes = currentShape === "erasor" ? erasedShapesIndexes : [];

    canvas.redraw(camera.current, shapesToRender, selectedIndex, erasedIndexes);
  }, [
    currentShape,
    existingShapes,
    tempTextValue,
    isEditingText,
    selectedShapeIndex,
    erasedShapesIndexes,
    canvas,
    camera,
  ]);
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
  useEffect(() => {});
  // every zoom in or zoom out with button tap requires the canvas to redraw,
  // basically enforcing the zoom logic
  useEffect(() => {
    if (!canvas || !camera.current) {
      return;
    }
    canvas.redraw(
      camera.current,
      [...existingShapes, tempTextValue],
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

  useEffect(() => {
    if (!isEditingText) {
      // Clear blinking when not editing
      if (caretBlinkIntervalRef.current) {
        clearInterval(caretBlinkIntervalRef.current);
        caretBlinkIntervalRef.current = null;
      }
      setCaretVisible(false);
      return;
    }

    // Start blinking animation
    const blinkInterval = setInterval(() => {
      const timeSinceLastTyping = Date.now() - lastTypingTime;
      // Show caret when typing (within 500ms of last keystroke)
      if (timeSinceLastTyping < 500) {
        setCaretVisible(true);
      } else {
        // Blink when idle
        setCaretVisible((prev) => !prev);
      }
    }, 530); // Blink every 530ms (standard caret blink rate)

    caretBlinkIntervalRef.current = blinkInterval;

    return () => {
      if (caretBlinkIntervalRef.current) {
        clearInterval(caretBlinkIntervalRef.current);
        caretBlinkIntervalRef.current = null;
      }
    };
  }, [isEditingText, lastTypingTime]);

  // selecting shapes using keys logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas || !camera.current) return;
      if (e.key === "Delete" && selectedShapeIndex !== -1) {
        const selectedShape = existingShapes[selectedShapeIndex];
        console.log(
          "selected shape user id is ",
          selectedShape.userId,
          " my user id",
          user.userId,
          "and access",
          user.access
        );
        if (selectedShape.userId !== user.userId && user.access === "user") {
          alert("not allowed to delete items drawn by other people");

          return;
          //prompt not allowed
        }
        const updated = existingShapes.filter(
          (_, index) => selectedShapeIndex !== index
        );
        const formattedUpdate = {
          ...existingShapes[selectedShapeIndex],
          operation: "delete",
        };
        socket.send(JSON.stringify(formattedUpdate));
        setExistingShapes(updated);
        setSelectedShapeIndex(-1);
        setHandle(undefined);
        canvas.redraw(camera.current, updated, -1, erasedShapesIndexes);
        return;
      }
      if (e.key === "Escape") {
        setCurrentShape(shapes[0]);
        if (isEditingText) {
          finalizeTextShape({
            camera: camera.current,
            canvas,
            socket,
            existingShapes,
            setExistingShapes,
            currentColor,
            selectedShapeIndex,
            erasedShapesIndexes,
            editingIndex: editingTextIndex ?? undefined,
          });
        }
        return;
      }

      if (isEditingText) {
        setLastTypingTime(Date.now());
        setCaretVisible(true);
        handleTextBoxEditing(e.key);
        return;
      }
      if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key)) {
        setCurrentShape(shapes[Number(e.key) - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canvas,
    camera,
    isEditingText,
    currentText,
    currentTextBoxXY,
    currentCaretPos,
    tempTextValue,
    selectedShapeIndex,
  ]);

  useEffect(() => {
    if (!canvas || !camera.current) {
      return;
    }

    // Only render text preview when editing
    if (isEditingText) {
      setTempTextValue({
        type: "text",
        text: (currentText ?? []).join(""),
        startX: currentTextBoxXY.x,
        startY: currentTextBoxXY.y,
        color: currentColor,
        drawBox: true,
        showCaret: caretVisible,
        caretPos: currentCaretPos,
        textArray: currentText,
        userId: user.userId ?? "",
      });
      canvas.redraw(
        camera.current,
        [
          ...existingShapes,
          {
            type: "text",
            text: (currentText ?? []).join(""),
            startX: currentTextBoxXY.x,
            startY: currentTextBoxXY.y,
            color: currentColor,
            drawBox: true,
            showCaret: caretVisible,
            caretPos: currentCaretPos,
            textArray: currentText,
            userId: user.userId ?? "",
          },
        ],
        selectedShapeIndex,
        erasedShapesIndexes
      );
    }
  }, [
    currentText,
    currentTextBoxXY,
    currentCaretPos,
    isEditingText,
    canvas,
    camera,
    currentColor,
    caretVisible,
  ]);
  // as the existing shapes change this will run , making sure that
  // the shapes recieved by the express server are rendered as
  // soon as they get recieved
  useEffect(() => {
    if (!canvas || !camera.current) {
      return;
    }

    canvas.redraw(
      camera.current,
      [...existingShapes, tempTextValue],
      selectedShapeIndex,
      erasedShapesIndexes
    );
  }, [existingShapes, canvas]);

  // Logic for mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvas || !camera.current) {
      return;
    }

    if (isEditingText) {
      return;
    }
    if (isErasing) {
      captureErasingShapes(camera.current, selectedShapeIndex, e);
      return;
    }

    if (isMovingObject) {
      handleObjectMove(
        camera.current,
        e,
        erasedShapesIndexes,
        canvas,
        socket,
        user
      );
    }
    if (isResizingObject) {
      handleObjectResize(
        camera.current,
        e,
        erasedShapesIndexes,
        canvas,
        socket,
        user
      );
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
      // canvas.redraw(
      //   camera.current,
      //   existingShapes,
      //   selectedShapeIndex,
      //   erasedShapesIndexes
      // );
      if (currentShape === "pencil") {
        setPenPoints((prev) => [...prev, { x: worldX, y: worldY }]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!canvas || !camera.current) {
      return;
    }
    if (currentShape === "text") {
      // setIsEditingText(true);
      return;
    }
    if (isErasing && currentShape === "erasor") {
      if (isErasing) {
        finishErasing(
          camera.current,
          selectedShapeIndex,
          setExistingShapes,
          socket
        );
      }
      setIsErasing(false);
      setErasedShapesIndexes([]);
      return;
    }
    if (currentShape === "select") {
      if (
        existingShapes[selectedShapeIndex] &&
        existingShapes[selectedShapeIndex].type === "text"
      ) {
        console.log("last ", lastSelectTextClick, "now", Date.now());
        const timeGap = Date.now() - lastSelectTextClick;
        if (lastSelectTextClick > 0 && timeGap < 400) {
          console.log("doubnle clcik worked");
          setIsEditingText(true);
          const shape = existingShapes[selectedShapeIndex];

          // Mark that we're setting color from selection
          isColorChangeFromSelection.current = true;
          setCurrentColor(shape.color);
          setTimeout(() => {
            isColorChangeFromSelection.current = false;
          }, 0);

          setCurrentText(shape.text?.split("") ?? []);
          setCurrentTextBoxXY({
            x: shape.startX ?? 0,
            y: shape.startY ?? 0,
          });
          setSelectedShapeIndex(-1);
          setHandle(undefined);
          setCurrentShape("text");

          existingShapes[selectedShapeIndex].color = "rgba(255,255,255,0)";
          setCurrentCaretPos((shape.text?.length ?? 0) - 1);
        }
        setLastSelectTextClick(Date.now());

        setIsMovingObject(false);
        setIsResizingObject(false);
        return;
      }
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
    const tempId = v4();
    // Create the new shape object
    const newShape = {
      startX: startXY?.x || 0,
      startY: startXY?.y || 0,
      endX: worldX,
      endY: worldY,
      type: currentShape,
      color: currentColor,
      points: currentShape === "pencil" ? penPoints : [],
      tempId,
      userId: user.userId ?? "",
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
        operation: "create",
        color: currentColor,
        type: currentShape,
        endX: worldX,
        endY: worldY,
        startX: startXY.x,
        startY: startXY.y,
        points: penPoints,

        tempId,
      })
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas || !camera.current) {
      return;
    }

    // Finish text editing if clicking outside the textbox
    if (isEditingText) {
      finalizeTextShape({
        camera: camera.current,
        canvas,
        socket,
        existingShapes,
        setExistingShapes,
        currentColor,
        selectedShapeIndex,
        erasedShapesIndexes,
        editingIndex: editingTextIndex ?? undefined,
      });
      setCurrentShape("select");

      return;
    }

    if (currentShape === "text") {
      handleTextBoxTrigger(camera.current, e);
      setCaretVisible(true);
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

      // Mark that we're setting color from selection, not user color picker
      isColorChangeFromSelection.current = true;
      setCurrentColor(existingShapes[hoveredShapeIndex]?.color ?? "white");

      // Reset the flag after a brief delay
      setTimeout(() => {
        isColorChangeFromSelection.current = false;
      }, 0);

      canvas.redraw(
        camera.current,
        [...existingShapes, tempTextValue],
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
      const selectedShapeInfo = canvas.getSelectedRectangleInfo(
        camera.current,
        {
          x: e.clientX,
          y: e.clientY,
        }
      );
      setHandle(selectedShapeInfo);
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
        [...existingShapes, tempTextValue],
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
      [...existingShapes, tempTextValue],

      selectedShapeIndex,
      erasedShapesIndexes
    );
  };

  return (
    <div className="h-screen w-screen  scrollbar-none relative">
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
      <CanvasInfo user={user} roomUsers={roomUsers} />
    </div>
  );
};
export default CanvasComponent;
