import { WebSocketServer, WebSocket } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import JWT_SECRET from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { uuid } from "uuidv4";
const wss = new WebSocketServer({ port: 8080 });
import z from "zod";
type Role = "user" | "admin" | "moderator";

interface User {
  userId: string;
  ws: WebSocket;
  socketId: string;
  roomId: number;
  access: Record<number, Role>;
}

const ShapeSchema = z.enum([
  "ellipse",
  "rectangle",
  "pencil",
  "line",
  "arrow",
  "text",
]);
const MessageSchema = z.object({
  type: ShapeSchema,
  userId: z.string(),
  roomId: z.string(),
  text: z.string().optional(),
  clientX: z.number().optional(),
  clientY: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  radiusX: z.number().optional(),
  radiusY: z.number().optional(),
  fromX: z.number().optional(),
  fromY: z.number().optional(),
  toX: z.number().optional(),
  toY: z.number().optional(),
  points: z.object({}).optional(),
  color: z.string(),
});
type Message = z.infer<typeof MessageSchema>;
type Shape = z.infer<typeof ShapeSchema>;

const usersBySocket = new Map<string, User>();
const socketByRoom = new Map<number, Set<string>>();

function decodeToken(token: string | null) {
  if (!token) {
    return null;
  }
  console.log("Token ", token);
  try {
    const decoded = jwt.verify(token, JWT_SECRET || "Fallback_Secret");
    if (!decoded) {
      console.log(" Not decodable ");
      return null;
    }
    return decoded;
  } catch (err) {
    console.log(" error caught ");
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const cookies = request.headers.cookie;
  if (!cookies) {
    console.log("No cookies found");
    ws.close(1008, "Authentication Error");
    return;
  }
  const cookieMap = new Map<string, string>();
  cookies.split("; ").forEach((cookie) => {
    const [key, value] = cookie.split("=");
    cookieMap.set(key ?? "", value ?? "");
  });
  const decodedToken = decodeToken(cookieMap.get("roomToken") ?? null);

  // console.log(
  //   "cookie token : ",
  //   cookieMap.get("roomToken"),
  //   " decodedToken : ",
  //   decodedToken
  // );
  if (!decodedToken) {
    console.log("No token found");
    ws.close();
    return;
  }
  const { userId, roomId, access } = decodedToken as JwtPayload;
  if (!userId || !roomId || !access) {
    console.log("No userId, roomId or access found");
    ws.close();
    return;
  }
  const socketId = uuid();
  socketByRoom.get(roomId)?.add(socketId);
  usersBySocket.set(socketId, { userId, ws, socketId, roomId, access });

  ws.on("message", async (msg: Buffer) => {
    console.log("message received : ", msg.toString());
    const toParseMessage = msg.toString();
    const message = JSON.parse(toParseMessage);

    console.log("message : ", message);
    const { type, ...rest } = message;
    const validateType = ShapeSchema.parse(type);
    if (!validateType) {
      console.log("Invalid type");
      return;
    }
    const validatedMessage = MessageSchema.parse({
      type,
      ...rest,
      userId,
      roomId,
    });
    if (!validatedMessage) {
      console.log("Invalid message");
      return;
    }
    sendMessageToRoom(roomId, validatedMessage, userId);
    await prismaClient.content.create({
      data: {
        ...validatedMessage,
      },
    });
    console.log("websocket server listening at 8080 port ");
  });
});

function sendMessageToRoom(roomId: number, message: any, userId: string) {
  const sockets = socketByRoom.get(roomId);
  if (!sockets) {
    return;
  }
  sockets.forEach((socketId) => {
    const user = usersBySocket.get(socketId);
    if (user && user.userId !== userId && !!user.access[roomId]) {
      user.ws.send(JSON.stringify(message));
    }
  });
}
