import { Content, Shape } from "@/types/canvas";

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

  drawText(
    text: string,
    x: number,
    y: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    const context = this.ctx;
    context.font = "48px serif";
    context.fillText(text, x, y);
  }

  drawPenStroke(
    points: { x: number; y: number }[],
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    if (points.length < 2) return;
    const context = this.ctx;
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
  }

  shapeRenderer: Record<string, (drawing: any) => void> = {
    rectangle: (d) =>
      this.drawRectangle(d.startX, d.startY, d.endX, d.endY, d.color),

    ellipse: (d) =>
      this.drawEllipse(d.startX, d.startY, d.endX, d.endY, d.color),

    line: (d) => this.drawLine(d.startX, d.startY, d.endX, d.endY, d.color),

    arrow: (d) => this.drawArrow(d.startX, d.startY, d.endX, d.endY, d.color),

    pencil: (d) => this.drawPenStroke(d.points ?? [], d.color),
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
  drawSelectedRectangle(
    shape: Content,
    camera: React.RefObject<{ x: number; y: number; scale: number }>
  ) {
    const ctx = this.ctx;

    const scale = camera.current.scale;

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
    camera: React.RefObject<{ x: number; y: number; scale: number }>,
    existingShapes: Content[],
    selectedShapeIndex: number
  ) {
    const { x, y, scale } = camera.current;
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

      renderer(shape);
      if (selectedShapeIndex === index) {
        if (selectedShape === null) {
          selectedShape = shape;
        }
      }
    });
    if (selectedShape !== null) {
      this.drawSelectedRectangle(selectedShape, camera);
    }
  }

  getHoveredElementIndex(
    camera: React.RefObject<{ x: number; y: number; scale: number }>,
    existingShapes: Content[],
    currentXY: { x: number; y: number }
  ) {
    let hoveredElementIndex = -1;
    const worldX = (currentXY.x - camera.current.x) / camera.current.scale;
    const worldY = (currentXY.y - camera.current.y) / camera.current.scale;

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
            worldY
          );
          break;
        case "ellipse":
          isHovering = this.mouseOnEllipse(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY
          );
          break;
        case "line":
          isHovering = this.mouseOnLine(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY
          );
          break;
        case "arrow":
          isHovering = this.mouseOnArrow(
            element.startX ?? 0,
            element.startY ?? 0,
            element.endX ?? 0,
            element.endY ?? 0,
            worldX,
            worldY
          );
          break;
        case "pencil":
          isHovering = this.mouseOnPenStroke(
            element.points ?? [],
            worldX,
            worldY
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
    camera: React.RefObject<{ x: number; y: number; scale: number }>,
    currentXY: { x: number; y: number }
  ) {
    const currentX = (currentXY.x - camera.current.x) / camera.current.scale;
    const currentY = (currentXY.y - camera.current.y) / camera.current.scale;
    return this.mouseOnSelectedRectangle(
      currentX,
      currentY,
      10 / camera.current.scale
    );
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

    // const startX = Math.min(
    //   this.selectedRectangleCoords.startX,
    //   this.selectedRectangleCoords.endX
    // );
    // const endX = Math.max(
    //   this.selectedRectangleCoords.startX,
    //   this.selectedRectangleCoords.endX
    // );
    // const startY = Math.min(
    //   this.selectedRectangleCoords.startY,
    //   this.selectedRectangleCoords.endY
    // );
    // const endY = Math.max(
    //   this.selectedRectangleCoords.startY,
    //   this.selectedRectangleCoords.endY
    // );
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
    currentY: number
  ) {
    const tolerance = 10;

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
    currentY: number
  ) {
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
    const tolerance = 0.1; // adjust for stroke thickness
    return value >= 1 - tolerance && value <= 1 + tolerance;
  }
  mouseOnLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    currentX: number,
    currentY: number
  ) {
    const tolerance = 10;

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
    currentY: number
  ) {
    const tolerance = 10;

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
    currentY: number
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
          currentY
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
