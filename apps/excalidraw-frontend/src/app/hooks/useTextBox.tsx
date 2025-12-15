"use client";
import { useState } from "react";
import { Camera } from "../lib/camera";
import { Canvas } from "../lib/draw";
import { Content } from "@/types/canvas";
import { v4 } from "uuid";

// Helper function to check if a key should be processed
const isValidInputKey = (key: string): boolean => {
  // Filter out special keys
  const invalidKeys = [
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Enter",
    "Escape",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "Insert",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "ScrollLock",
    "Pause",
    "ContextMenu",
    "NumLock",
  ];

  // Check if it's a special key
  if (invalidKeys.includes(key)) {
    return false;
  }

  // Check if it's a function key (F1-F12 already handled above)
  if (key.startsWith("F") && key.length <= 3) {
    return false;
  }

  // Allow single character keys (letters, numbers, symbols)
  // This includes alphanumeric and common keyboard symbols
  return (
    key.length === 1 ||
    key === " " ||
    key === "Backspace" ||
    key === "Delete" ||
    key.startsWith("Arrow")
  );
};

export function useTextBox({
  canvas,
  existingShapes,
}: {
  canvas: Canvas | null;
  existingShapes: Content[];
}) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [currentText, setCurrentText] = useState<string[]>([]);
  const [currentTextBoxXY, setCurrentTextBoxXY] = useState({ x: 0, y: 0 });
  const [currentCaretPos, setCurrentCaretPos] = useState(-1);
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);
  const handleTextBoxTrigger = (camera: Camera, e: React.MouseEvent) => {
    if (!canvas) {
      return;
    }
    const { worldX, worldY } = camera.getWorldCoordinates(e.clientX, e.clientY);
    setIsEditingText(true);
    setCurrentTextBoxXY({ x: worldX, y: worldY });
  };

  const handleTextBoxEditing = (keyPressed: string) => {
    if (!canvas) {
      return currentText; // Return current if no canvas
    }

    // Filter out invalid keys
    if (!isValidInputKey(keyPressed)) {
      return;
    }

    let newText = currentText;

    if (keyPressed === "Delete") {
      newText = deleteTextInArray(currentText, currentCaretPos, false);
      setCurrentText(newText);
      // Caret position stays the same when deleting forward
    } else if (keyPressed === "Backspace") {
      newText = deleteTextInArray(currentText, currentCaretPos, true);
      setCurrentText(newText);
      // Move caret back one position after backspace
      if (currentCaretPos === -1) {
        // If at end, move to new end
        setCurrentCaretPos(newText.length > 0 ? newText.length - 1 : -1);
      } else if (currentCaretPos > 0) {
        setCurrentCaretPos(currentCaretPos - 1);
      } else {
        // At position 0, move to -1 (end)
        setCurrentCaretPos(-1);
      }
    } else if (keyPressed === "ArrowRight") {
      const newCaretPos = moveTextInArray(
        currentText,
        currentCaretPos,
        keyPressed
      );
      setCurrentCaretPos(newCaretPos);
    } else if (keyPressed === "ArrowLeft") {
      const newCaretPos = moveTextInArray(
        currentText,
        currentCaretPos,
        keyPressed
      );
      setCurrentCaretPos(newCaretPos);
    } else {
      // Insert text
      const wasAtEnd = currentCaretPos === -1;
      newText = insertTextInArray(currentText, keyPressed, currentCaretPos);
      setCurrentText(newText);

      // Fix caret position after insertion
      if (wasAtEnd) {
        // If we were at the end, move to the new end
        setCurrentCaretPos(newText.length - 1);
      } else {
        // Otherwise, move forward one position
        setCurrentCaretPos((prev) => prev + 1);
      }
    }
  };

  const finalizeTextShape = ({
    camera,
    canvas,
    socket,
    existingShapes,
    setExistingShapes,
    selectedShapeIndex,
    erasedShapesIndexes,
    currentColor,
    editingIndex,
  }: {
    camera: Camera;
    canvas: Canvas;
    socket: WebSocket;
    existingShapes: Content[];
    setExistingShapes: React.Dispatch<React.SetStateAction<Content[]>>;
    selectedShapeIndex: number;
    erasedShapesIndexes: number[];
    currentColor: CanvasRenderingContext2D["strokeStyle"];
    editingIndex?: number;
  }) => {
    const textContent = currentText.join("").trim();
    if (!textContent) {
      // remove updated element if it is left empty
      if (editingIndex !== undefined && editingIndex >= 0) {
        const updated = existingShapes.filter(
          (_, index) => index !== editingIndex
        );
        setExistingShapes(updated);
        canvas.redraw(camera, updated, -1, erasedShapesIndexes);
      }
      // nothing to save
      resetTextState();
      return;
    }

    const ctx = canvas.getContext();
    ctx.font = "48px serif";

    const width = ctx.measureText(textContent).width;
    const height = 48;
    let updated: Content[];
    const tempId = v4();
    const newTextShape: Content & { tempId?: string } = {
      startX: currentTextBoxXY.x,
      startY: currentTextBoxXY.y,
      endX: currentTextBoxXY.x + width,
      endY: currentTextBoxXY.y + height,
      type: "text",
      color: currentColor,
      text: textContent,
      tempId,
    };
    if (
      editingIndex !== undefined &&
      editingIndex >= 0 &&
      editingIndex < existingShapes.length
    ) {
      updated = [...existingShapes];
      updated[editingIndex] = newTextShape;
    } else {
      updated = [...existingShapes, newTextShape];
    }
    // update local shapes
    setExistingShapes(updated);

    // emit to backend
    socket.send(
      JSON.stringify({
        ...newTextShape,
        operation: "create",
      })
    );

    // redraw
    canvas.redraw(camera, updated, selectedShapeIndex, erasedShapesIndexes);

    resetTextState();
  };

  const resetTextState = () => {
    setIsEditingText(false);
    setCurrentText([]);
    setCurrentCaretPos(-1);
  };

  return {
    isEditingText,
    setIsEditingText,
    handleTextBoxEditing,
    handleTextBoxTrigger,
    currentTextBoxXY,
    setCurrentTextBoxXY,
    currentText,
    setCurrentText,
    currentCaretPos,
    setCurrentCaretPos,
    finalizeTextShape,
    setEditingTextIndex,
    editingTextIndex,
  };
}

const insertTextInArray = (
  currentText: string[],
  keyPressed: string,
  currentCaretPos: number
) => {
  if (currentCaretPos === -1) {
    // Append to end
    return [...currentText, keyPressed];
  }
  if (currentCaretPos > currentText.length - 1) {
    // Out of bounds, append to end
    return [...currentText, keyPressed];
  }
  // Insert at position
  const prevPart = currentText.slice(0, currentCaretPos + 1);
  const nextPart = currentText.slice(currentCaretPos + 1);
  return [...prevPart, keyPressed, ...nextPart];
};

const deleteTextInArray = (
  currentText: string[],
  currentCaretPos: number,
  beforeCaret: boolean = true
) => {
  // Handle out of bounds
  if (currentCaretPos > currentText.length - 1) {
    // If caret is beyond the end, delete the last character
    if (currentText.length > 0) {
      return currentText.slice(0, -1);
    }
    return [];
  }

  // Handle backspace at the end (position -1)
  if (beforeCaret && currentCaretPos === -1) {
    if (currentText.length > 0) {
      return currentText.slice(0, -1);
    }
    return currentText;
  }

  // Handle delete at the end
  if (!beforeCaret && currentCaretPos === -1) {
    // Delete doesn't do anything at the end
    return currentText;
  }

  // Normal deletion
  if (beforeCaret) {
    // Delete character before caret
    if (currentCaretPos === 0) {
      return currentText.slice(1);
    }
    const prevPart = currentText.slice(0, currentCaretPos);
    const nextPart = currentText.slice(currentCaretPos + 1);
    return [...prevPart, ...nextPart];
  } else {
    // Delete character after caret
    if (currentCaretPos >= currentText.length - 1) {
      return currentText;
    }
    const prevPart = currentText.slice(0, currentCaretPos + 1);
    const nextPart = currentText.slice(currentCaretPos + 2);
    return [...prevPart, ...nextPart];
  }
};

const moveTextInArray = (
  currentText: string[],
  currentCaretPos: number,
  keyPressed: string
) => {
  const direction = keyPressed.split("Arrow")[1];
  if (direction === "Left") {
    if (currentCaretPos === -1) {
      // At end, move to last character
      return currentText.length > 0 ? currentText.length - 1 : -1;
    }
    if (currentCaretPos === 0) {
      // At first character, move to -1 (before start/end position)
      return -1;
    }
    return currentCaretPos - 1;
  } else {
    // ArrowRight
    if (currentCaretPos === -1) {
      // Can't move right from end
      return -1;
    }
    if (currentCaretPos >= currentText.length - 1) {
      // At last character, move to end
      return -1;
    }
    return currentCaretPos + 1;
  }
};
