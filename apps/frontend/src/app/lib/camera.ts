const WORLD = {
  minX: -6000,
  maxX: 8000,
  minY: -4000,
  maxY: 5000,
};

export class Camera {
  public x: number;
  public y: number;
  public scale: number;

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
  }
  getCameraBounds(canvasSize: { width: number; height: number }) {
    const viewWidth = canvasSize.width / this.scale;
    const viewHeight = canvasSize.height / this.scale;

    return {
      minX: -WORLD.maxX * this.scale + canvasSize.width,
      maxX: -WORLD.minX * this.scale,
      minY: -WORLD.maxY * this.scale + canvasSize.height,
      maxY: -WORLD.minY * this.scale,
    };
  }
  getWorldCoordinates(currentX: number, currentY: number) {
    const worldX = (currentX - this.x) / this.scale;
    const worldY = (currentY - this.y) / this.scale;
    return { worldX, worldY };
  }
}

export function createCamera(x: number, y: number, scale: number) {
  return new Camera(x, y, scale);
}
