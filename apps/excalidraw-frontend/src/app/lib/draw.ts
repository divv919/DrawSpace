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

  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    strokeStyle: CanvasRenderingContext2D["strokeStyle"] = "white"
  ) {
    this.setStrokeStyle(strokeStyle);
    this.ctx.strokeRect(x, y, width, height);
  }
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default function createCanvas(canvas: HTMLCanvasElement) {
  return new Canvas(canvas);
}
