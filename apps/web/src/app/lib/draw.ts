import { Content } from "@/types/canvas";
import type { Camera } from "./camera";
export class Canvas {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to acquire 2D rendering context.");
    }
    this.ctx = context;
  }

  setStrokeStyle(style: CanvasRenderingContext2D["strokeStyle"]) {
    this.ctx.strokeStyle = style;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  drawRectangle(
    x: number,
    y: number,
    endX: number,
    endY: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white",
    withCurve: boolean = true,
    thinStroke: boolean = false,
    fillEmpty: boolean = false
  ) {
    if (!withCurve) {
      if (thinStroke) {
        this.ctx.lineWidth = 1;
      } else {
        this.ctx.lineWidth = 2;
      }
      if (fillEmpty) {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(x, y, endX - x, endY - y);
      }
      this.ctx.beginPath();
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.rect(x, y, endX - x, endY - y);
      this.ctx.stroke();
      return;
    }
    this.setStrokeStyle(strokeStyle);
    let radius = 7;

    const height = endY - y;
    const width = endX - x;
    let rx = x;
    let ry = y;
    let rw = width;
    let rh = height;

    if (rw < 0) {
      rx = x + rw; // shift x back
      rw = Math.abs(rw);
    }
    if (rh < 0) {
      ry = y + rh; // shift y up
      rh = Math.abs(rh);
    }

    if (rh < 10) {
      radius = 0;
    }

    if (rw < 10) {
      radius = 0;
    }
    const context = this.ctx;

    context.beginPath();
    context.moveTo(rx, ry + radius);

    context.arcTo(rx, ry + rh, rx + radius, ry + rh, radius);
    context.arcTo(rx + rw, ry + rh, rx + rw, ry + rh - radius, radius);
    context.arcTo(rx + rw, ry, rx + rw - radius, ry, radius);
    context.arcTo(rx, ry, rx, ry + radius, radius);

    context.stroke();
  }

  drawEllipse(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    const context = this.ctx;
    context.strokeStyle = strokeStyle;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;

    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    context.stroke();
  }

  drawLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    const context = this.ctx;
    context.strokeStyle = strokeStyle;
    context.beginPath();

    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }

  drawArrow(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    const context = this.ctx;
    context.strokeStyle = strokeStyle;
    context.fillStyle = strokeStyle;

    // Draw the main line
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();

    // ---- ARROW HEAD ----
    const headLength = 14; // arrowhead size
    const angle = Math.atan2(endY - startY, endX - startX);

    const leftX = endX - headLength * Math.cos(angle - Math.PI / 6);
    const leftY = endY - headLength * Math.sin(angle - Math.PI / 6);

    const rightX = endX - headLength * Math.cos(angle + Math.PI / 6);
    const rightY = endY - headLength * Math.sin(angle + Math.PI / 6);

    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(leftX, leftY);
    context.lineTo(rightX, rightY);
    context.closePath();

    context.fill(); // filled arrowhead
  }

  drawCaret(
    textArray: string[],
    x: number,
    y: number,
    showCaret: boolean = false,
    color: CanvasRenderingContext2D["fillStyle"] = "white",
    caretPos: number = -1
  ) {
    if (!showCaret) {
      return;
    }
    const context = this.ctx;
    context.font = "48px serif";
    let textBeforeCaret = "";
    // console.log("text array is", textArray, showCaret);
    if (caretPos === -1) {
      textBeforeCaret = "";
    } else if (caretPos >= 0 && caretPos < textArray.length) {
      textBeforeCaret = textArray.slice(0, caretPos + 1).join("");
    } else {
      textBeforeCaret = "";
    }
    // console.log("text before caret", textBeforeCaret);
    const metrics = context.measureText(textBeforeCaret);
    const caretX = x + metrics.width;
    const textHeight = 48;
    const textBaseline = metrics.actualBoundingBoxAscent || 0.8 * textHeight;
    const caretTop = y - textBaseline;
    const caretBottom =
      y + (metrics.actualBoundingBoxDescent || textHeight * 0.2);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(caretX, caretTop);
    context.lineTo(caretX, caretBottom);
    context.stroke();
  }

  drawText(
    text: string,
    x: number,
    y: number,
    fillStyle: CanvasRenderingContext2D["fillStyle"] = "white",
    drawBox: boolean = false
  ) {
    const context = this.ctx;
    context.font = "48px serif";
    context.fillStyle = fillStyle;

    // Measure text dimensions
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 48; // Font size
    const textBaseline = metrics.actualBoundingBoxAscent || textHeight * 0.8; // Approximate baseline

    // Draw bounding box if requested
    if (drawBox) {
      const padding = 10;
      // y is the baseline, so we need to adjust for the box
      const boxX = x - padding;
      const boxY = y - textBaseline - padding;
      const boxWidth = textWidth + padding * 2;
      const boxHeight =
        textBaseline +
        (metrics.actualBoundingBoxDescent || textHeight * 0.2) +
        padding * 2;

      context.strokeStyle = "rgba(255, 255, 255, 0.3)";
      context.lineWidth = 1;
      context.strokeRect(boxX, boxY, boxWidth, boxHeight);
    }

    context.fillText(text, x, y);

    // Return text dimensions for use elsewhere
    return {
      width: textWidth,
      height: textHeight,
    };
  }

  drawPenStroke(
    points: { x: number; y: number }[],
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    if (points.length < 2) return;

    const context = this.ctx;
    context.save();
    context.strokeStyle = strokeStyle;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;

      context.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    // Draw the last segment
    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);
    context.stroke();
    context.restore();
  }

  shapeRenderer: Record<
    string,
    (
      drawing: Content & {
        drawBox?: boolean;
        textArray?: string[];
        showCaret?: boolean;
        caretPos?: number;
      }
    ) => void
  > = {
    rectangle: (d) =>
      this.drawRectangle(
        d.startX ?? 0,
        d.startY ?? 0,
        d.endX ?? 0,
        d.endY ?? 0,
        d.color
      ),

    ellipse: (d) =>
      this.drawEllipse(
        d.startX ?? 0,
        d.startY ?? 0,
        d.endX ?? 0,
        d.endY ?? 0,
        d.color
      ),

    line: (d) =>
      this.drawLine(
        d.startX ?? 0,
        d.startY ?? 0,
        d.endX ?? 0,
        d.endY ?? 0,
        d.color
      ),

    arrow: (d) =>
      this.drawArrow(
        d.startX ?? 0,
        d.startY ?? 0,
        d.endX ?? 0,
        d.endY ?? 0,
        d.color
      ),

    pencil: (d) => this.drawPenStroke(d.points ?? [], d.color),
    text: (d) => {
      const textContent = d.text ?? "";
      this.drawText(
        textContent,
        d.startX ?? 0,
        d.startY ?? 0,
        d.color,
        d.drawBox
      );
      // console.log("text array is", d.textArray, d.showCaret);

      // if (d.caretPos !== undefined) {
      this.drawCaret(
        d.textArray ?? [],
        d.startX ?? 0,
        d.startY ?? 0,
        d.showCaret,
        d.color,
        d.caretPos
      );
      // }
    },
  };

  //might remove
  worldToScreen(
    x: number,
    y: number,
    camera: { x: number; y: number; scale: number }
  ) {
    return {
      x: x * camera.scale + camera.x,
      y: y * camera.scale + camera.y,
    };
  }
  drawResizeHandles(
    bounds: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    },
    camera: { x: number; y: number; scale: number }
  ) {
    const ctx = this.ctx;
    const size = 10; // ✅ FIXED SCREEN SIZE

    const points = [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [bounds.minX, bounds.maxY],
    ];

    ctx.save();

    // ✅ REMOVE SCALE SO HANDLES STAY SAME SIZE
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    for (const [wx, wy] of points) {
      const { x, y } = this.worldToScreen(wx, wy, camera);

      ctx.fillStyle = "red";
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    ctx.restore();
  }

  selectedRectangleCoords: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  };
  drawSelectedRectangle(shape: Content, camera: Camera) {
    const ctx = this.ctx;

    const scale = camera.scale;

    let minX = Math.min(shape.startX!, shape.endX!);
    let maxX = Math.max(shape.startX!, shape.endX!);
    let minY = Math.min(shape.startY!, shape.endY!);
    let maxY = Math.max(shape.startY!, shape.endY!);

    if (shape.type === "pencil") {
      shape.points.forEach((point: { x: number; y: number }) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    }
    if (shape.type === "text") {
      const context = this.ctx;
      context.font = "48px serif";
      const metrics = context.measureText(shape.text ?? "");
      const textHeight = 48;

      const textBaseline = metrics.actualBoundingBoxAscent || textHeight * 0.8;
      minY -= textBaseline + 5;

      maxY -= textBaseline + 0;
    }
    this.selectedRectangleCoords = {
      startX: minX - 10 / scale,
      startY: minY - 10 / scale,
      endX: maxX + 10 / scale,
      endY: maxY + 10 / scale,
    };

    this.drawRectangle(
      minX - 10 / scale,
      minY - 10 / scale,
      maxX + 10 / scale,
      maxY + 10 / scale,
      "oklch(85.5% 0.138 181.071)",
      false,
      true,
      false
    );

    // ✅ 2. Fixed-size handles using inverse scale
    const handleSize = 10 / scale; // ✅ THIS IS THE KEY

    const offset = 10 / scale;

    const handles = [
      [minX - offset, minY - offset], // TL
      [maxX + offset, minY - offset], // TR
      [maxX + offset, maxY + offset], // BR
      [minX - offset, maxY + offset], // BL
    ];

    ctx.fillStyle = "oklch(20.5% 0 0)";
    ctx.strokeStyle = "oklch(85.5% 0.138 181.071)";
    for (const [x, y] of handles) {
      ctx.fillRect(
        x - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        x - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
    }
  }

  redraw(
    camera: Camera,
    existingShapes: (Content & {
      id?: string;
      tempId?: string;
      drawBox?: boolean;
      caretPos?: number;
      showCaret?: boolean;
      textArray?: string[];
    })[],
    selectedShapeIndex: number,
    erasedShapesIndexes: number[]
  ) {
    const { x, y, scale } = camera;
    const context = this.ctx;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.setTransform(scale, 0, 0, scale, x, y);

    let selectedShape: Content | null = null;
    existingShapes.map((shape: Content, index: number) => {
      const renderer = this.shapeRenderer[shape.type];
      if (!renderer) {
        console.warn(`No renderer found for shape: ${shape}`);
        return;
      }
      this.ctx.save();
      if (erasedShapesIndexes.includes(index)) {
        this.ctx.globalAlpha = 0.5;
      }

      renderer(shape);
      if (selectedShapeIndex === index) {
        if (selectedShape === null) {
          selectedShape = shape;
        }
      }
      this.ctx.restore();
    });
    if (selectedShape !== null) {
      this.drawSelectedRectangle(selectedShape, camera);
    }
  }

  getHoveredElementIndex(
    camera: Camera,
    existingShapes: Content[],
    currentXY: { x: number; y: number },
    tolerance: number = 10
  ) {
    console.log("tolerance", tolerance);
    let hoveredElementIndex = -1;
    const worldX = (currentXY.x - camera.x) / camera.scale;
    const worldY = (currentXY.y - camera.y) / camera.scale;

    existingShapes.map((element: Content, index: number) => {
      let isHovering = false;
      switch (element.type) {
        case "rectangle":
          isHovering = this.mouseOnRectangle(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY,
            tolerance
          );
          break;
        case "ellipse":
          isHovering = this.mouseOnEllipse(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY,
            tolerance
          );
          break;
        case "line":
          isHovering = this.mouseOnLine(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY,
            tolerance
          );
          break;
        case "arrow":
          isHovering = this.mouseOnArrow(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY,
            tolerance
          );
          break;
        case "pencil":
          isHovering = this.mouseOnPenStroke(
            element.points ?? [],
            worldX,
            worldY,
            tolerance
          );
          break;
        case "text":
          isHovering = this.mouseOnText(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY,
            element.text ?? "",
            tolerance
          );
          break;
        default:
          break;
      }
      if (isHovering) {
        hoveredElementIndex = index;
      }
    });
    return hoveredElementIndex;
  }
  getSelectedRectangleInfo(
    camera: Camera,
    currentXY: { x: number; y: number }
  ) {
    const currentX = (currentXY.x - camera.x) / camera.scale;
    const currentY = (currentXY.y - camera.y) / camera.scale;
    return this.mouseOnSelectedRectangle(currentX, currentY, 10 / camera.scale);
  }

  mouseOnText(
    startX: number,
    startYWithBaseline: number,
    endX: number,
    endYWithBaseline: number,
    currentX: number,
    currentY: number,
    text: string,
    tolerance: number = 10
  ) {
    const context = this.ctx;
    context.font = "48px serif";
    const metrics = context.measureText(text);
    const textHeight = 48;

    const textBaseline = metrics.actualBoundingBoxAscent || textHeight * 0.8;
    const startY = startYWithBaseline - textBaseline;
    const endY = endYWithBaseline - textBaseline;
    const TLCorner =
      Math.abs(startX - currentX) <= tolerance &&
      Math.abs(startY - currentY) <= tolerance;
    const TRCorner =
      Math.abs(endX - currentX) <= tolerance &&
      Math.abs(startY - currentY) <= tolerance;

    const BRCorner =
      Math.abs(endX - currentX) <= tolerance &&
      Math.abs(endY - currentY) <= tolerance;
    const BLCorner =
      Math.abs(startX - currentX) <= tolerance &&
      Math.abs(endY - currentY) <= tolerance;

    const LeftEdge =
      Math.abs(currentX - startX) <= tolerance &&
      currentY >= startY - tolerance &&
      currentY <= endY + tolerance;
    const RightEdge =
      Math.abs(currentX - endX) <= tolerance &&
      currentY >= startY - tolerance &&
      currentY <= endY + tolerance;
    const TopEdge =
      Math.abs(currentY - startY) <= tolerance &&
      currentX >= startX - tolerance &&
      currentX <= endX + tolerance;
    const BottomEdge =
      Math.abs(currentY - endY) <= tolerance &&
      currentX >= startX - tolerance &&
      currentX <= endX + tolerance;

    const Center =
      currentX >= startX &&
      currentX <= endX &&
      currentY >= startY &&
      currentY <= endY;

    if (
      Center ||
      TLCorner ||
      TRCorner ||
      TopEdge ||
      BLCorner ||
      BRCorner ||
      BottomEdge ||
      LeftEdge ||
      RightEdge
    ) {
      return true;
    }
    return false;
  }
  mouseOnSelectedRectangle(
    currentX: number,
    currentY: number,
    tolerance: number = 0
  ) {
    const selectedRectangleCoords = this.selectedRectangleCoords;
    if (
      selectedRectangleCoords.startX === undefined ||
      selectedRectangleCoords.startY === undefined ||
      selectedRectangleCoords.endX === undefined ||
      selectedRectangleCoords.endY === undefined
    )
      return undefined;

    const { startX, startY, endX, endY } = this.selectedRectangleCoords;

    const TLCorner =
      Math.abs(startX - currentX) <= tolerance &&
      Math.abs(startY - currentY) <= tolerance;
    const TRCorner =
      Math.abs(endX - currentX) <= tolerance &&
      Math.abs(startY - currentY) <= tolerance;

    const BRCorner =
      Math.abs(endX - currentX) <= tolerance &&
      Math.abs(endY - currentY) <= tolerance;
    const BLCorner =
      Math.abs(startX - currentX) <= tolerance &&
      Math.abs(endY - currentY) <= tolerance;
    if (TLCorner) {
      return "tl";
    }
    if (TRCorner) {
      return "tr";
    }
    if (BRCorner) {
      return "br";
    }
    if (BLCorner) {
      return "bl";
    }
    const LeftEdge =
      Math.abs(currentX - startX) <= tolerance &&
      currentY >= startY - tolerance &&
      currentY <= endY + tolerance;
    const RightEdge =
      Math.abs(currentX - endX) <= tolerance &&
      currentY >= startY - tolerance &&
      currentY <= endY + tolerance;
    const TopEdge =
      Math.abs(currentY - startY) <= tolerance &&
      currentX >= startX - tolerance &&
      currentX <= endX + tolerance;
    const BottomEdge =
      Math.abs(currentY - endY) <= tolerance &&
      currentX >= startX - tolerance &&
      currentX <= endX + tolerance;
    if (LeftEdge) {
      return "left";
    }
    if (RightEdge) {
      return "right";
    }
    if (TopEdge) {
      return "top";
    }
    if (BottomEdge) {
      return "bottom";
    }
    const Center =
      currentX >= startX &&
      currentX <= endX &&
      currentY >= startY &&
      currentY <= endY;

    if (Center) {
      return "center";
    }
    return undefined;
  }
  mouseOnRectangle(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    currentX: number,
    currentY: number,
    tolerance: number = 10
  ) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    const onLeftEdge =
      Math.abs(currentX - minX) <= tolerance &&
      currentY >= minY - tolerance &&
      currentY <= maxY + tolerance;

    const onRightEdge =
      Math.abs(currentX - maxX) <= tolerance &&
      currentY >= minY - tolerance &&
      currentY <= maxY + tolerance;

    const onTopEdge =
      Math.abs(currentY - minY) <= tolerance &&
      currentX >= minX - tolerance &&
      currentX <= maxX + tolerance;

    const onBottomEdge =
      Math.abs(currentY - maxY) <= tolerance &&
      currentX >= minX - tolerance &&
      currentX <= maxX + tolerance;

    return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
  }

  mouseOnEllipse(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    currentX: number,
    currentY: number,
    tolerance: number = 0.1
  ) {
    if (tolerance >= 20) {
      tolerance = 0.2;
    } else {
      tolerance = 0.1;
    }

    // Center of ellipse
    const cx = (startX + endX) / 2;
    const cy = (startY + endY) / 2;

    // Radii
    const rx = Math.abs(endX - startX) / 2;
    const ry = Math.abs(endY - startY) / 2;

    // Prevent divide-by-zero bugs
    if (rx === 0 || ry === 0) return false;

    // Normalize point into ellipse space
    const dx = currentX - cx;
    const dy = currentY - cy;

    const value = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

    // ✅ Border detection with tolerance

    return value >= 1 - tolerance && value <= 1 + tolerance;
  }
  mouseOnLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    currentX: number,
    currentY: number,
    tolerance: number = 10
  ) {
    const dx = endX - startX;
    const dy = endY - startY;

    const lengthSq = dx * dx + dy * dy;

    // Handle zero-length line (dot)
    if (lengthSq === 0) {
      return (
        Math.abs(currentX - startX) <= tolerance &&
        Math.abs(currentY - startY) <= tolerance
      );
    }

    // Project mouse point onto the line segment
    const t = ((currentX - startX) * dx + (currentY - startY) * dy) / lengthSq;

    // Clamp to segment [0, 1]
    const clampedT = Math.max(0, Math.min(1, t));

    // Closest point on the line segment
    const closestX = startX + clampedT * dx;
    const closestY = startY + clampedT * dy;

    // Distance from mouse to line
    const dist = Math.hypot(currentX - closestX, currentY - closestY);

    return dist <= tolerance;
  }

  mouseOnArrow(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    currentX: number,
    currentY: number,
    tolerance: number = 10
  ) {
    const dx = endX - startX;
    const dy = endY - startY;

    const lengthSq = dx * dx + dy * dy;

    // Handle zero-length line (dot)
    if (lengthSq === 0) {
      return (
        Math.abs(currentX - startX) <= tolerance &&
        Math.abs(currentY - startY) <= tolerance
      );
    }

    // Project mouse point onto the line segment
    const t = ((currentX - startX) * dx + (currentY - startY) * dy) / lengthSq;

    // Clamp to segment [0, 1]
    const clampedT = Math.max(0, Math.min(1, t));

    // Closest point on the line segment
    const closestX = startX + clampedT * dx;
    const closestY = startY + clampedT * dy;

    // Distance from mouse to line
    const dist = Math.hypot(currentX - closestX, currentY - closestY);

    return dist <= tolerance;
  }
  mouseOnPenStroke(
    points: { x: number; y: number }[],
    currentX: number,
    currentY: number,
    tolerance: number = 10
  ) {
    for (let i = 0; i < points.length - 2; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      if (
        this.mouseOnLine(
          points[i].x,
          points[i].y,
          midX,
          midY,
          currentX,
          currentY,
          tolerance
        )
      ) {
        return true;
      }
    }
    return false;
  }
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default function createCanvas(canvas: HTMLCanvasElement) {
  return new Canvas(canvas);
}
