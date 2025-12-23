const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:3002";
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export { BACKEND_BASE_URL, WEBSOCKET_URL };
