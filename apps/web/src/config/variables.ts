const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:3002";
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
const CANVAS_FONT = "24px serif";

export { BACKEND_BASE_URL, WEBSOCKET_URL, CANVAS_FONT };
