const BACKEND_BASE_URL = process.env.HTTP_URL || "http://localhost:3002";
const WEBSOCKET_URL = process.env.WS_URL || "ws://localhost:8080";

export { BACKEND_BASE_URL, WEBSOCKET_URL };
