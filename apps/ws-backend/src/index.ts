import { WebSocketServer, WebSocket } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { prismaClient } from "@repo/db";
import { uuid } from "uuidv4";
import z from "zod";
import { Role } from "@repo/common";
import express from "express";
import http from "http";
import type { Request, Response } from "express";
type Role = "user" | "admin" | "moderator";
const app = express();
interface User {
  userId: string;
  ws: WebSocket;
  socketId: string;
  roomId: string;
  access: Role;
  username: string;
  isBanned: boolean;
}

const ShapeSchema = z.enum([
  "ellipse",
  "rectangle",
  "pencil",
  "line",
  "arrow",
  "text",
]);
const CanvasMessageSchema = z.object({
  type: ShapeSchema,
  text: z.string().nullish(),
  startX: z.number().optional(),
  startY: z.number().optional(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  color: z.string(),
  id: z.string().optional(),
});

// Ban Message Schema
const ClientBanSchema = z.object({
  channel: z.literal("room_control"),
  operation: z.literal("ban_user"),
  ban: z.boolean(),
  targetUserId: z.string(),
});
const ServerBanSchema = ClientBanSchema.extend({
  username: z.string(),
});
// Initial message Schema
const InitialMessageSchema = z.object({
  channel: z.literal("room_control"),
  operation: z.literal("initial"),
  onlineUsers: z.string().array(),
  roomName: z.string(),
});
// Change Role Message Schema
const ClientChangeRoleSchema = z.object({
  channel: z.literal("room_control"),
  operation: z.literal("change_role"),
  new_role: z.enum(["user", "moderator"]),
  targetUserId: z.string(),
});
const ServerChangeRoleSchema = ClientChangeRoleSchema.extend({
  username: z.string(),
});

// DiscriminatedUnion of Room controls
const ClientRoomControlSchema = z.discriminatedUnion("operation", [
  ClientBanSchema,
  ClientChangeRoleSchema,
]);

// Canvas message schema
const ClientCreateSchema = CanvasMessageSchema.extend({
  channel: z.literal("canvas"),
  operation: z.literal("create"),
  tempId: z.string(),
});

const ClientUpdateSchema = CanvasMessageSchema.extend({
  channel: z.literal("canvas"),
  operation: z.literal("update"),
  id: z.string(),
});

const ClientDeleteSchema = CanvasMessageSchema.extend({
  channel: z.literal("canvas"),
  operation: z.literal("delete"),
  id: z.string(),
});

// Discriminated union of Canvas operation
const CanvasOperationSchema = z.discriminatedUnion("operation", [
  ClientCreateSchema,
  ClientUpdateSchema,
  ClientDeleteSchema,
]);

const ClientMessageSchema = z.discriminatedUnion("channel", [
  ClientRoomControlSchema,
  CanvasOperationSchema,
]);

const ServerCreateSchema = ClientCreateSchema.extend({
  userId: z.string(),
  roomId: z.string(),
  timestamp: z.number(),
});

const ServerUpdateSchema = ClientUpdateSchema.extend({
  userId: z.string(),
  roomId: z.string(),
  timestamp: z.number(),
});

const ServerDeleteSchema = ClientDeleteSchema.extend({
  userId: z.string(),
  roomId: z.string(),
  timestamp: z.number(),
});
const ServerIsOnlineSchema = z.object({
  operation: z.literal("is_online"),
  channel: z.literal("room_control"),
  isBanned: z.boolean(),
  username: z.string(),
  role: Role,
  isOnline: z.boolean(),
  userId: z.string(),
});
const ServerCanvasSchema = z.discriminatedUnion("operation", [
  ServerCreateSchema,
  ServerUpdateSchema,
  ServerDeleteSchema,
]);
const ServerRoomControlSchema = z.discriminatedUnion("operation", [
  ServerBanSchema,
  ServerChangeRoleSchema,
  ServerIsOnlineSchema,
]);
const ServerMessageSchema = z.discriminatedUnion("channel", [
  ServerCanvasSchema,
  ServerRoomControlSchema,
]);
const DbContentSchema = CanvasMessageSchema.omit({
  id: true,
});
const PORT = process.env.PORT || 8080;

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
server.listen(PORT, () =>
  console.log("Websocket server listening at port ", PORT)
);
const usersBySocket = new Map<string, User>();
const socketByRoom = new Map<string, Set<string>>();
const socketByUserId = new Map<string, string>();
function decodeToken(token: string | null) {
  console.log("jwt sec is ", process.env.NEXTAUTH_SECRET);
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "Fallback_Secret"
    );
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

wss.on("connection", async (ws, request) => {
  const token = request.url?.split("?")[1];
  if (!token) {
    console.log("No token found");
    ws.close(1008, "Authentication Error");
    return;
  }
  console.log("token is ", token);
  const tokenVal = token.split("=")[1];
  if (!tokenVal) {
    console.log("No token found");
    ws.close(1008, "Authentication Error");
    return;
  }
  console.log("token val is ");
  const decodedToken = decodeToken(tokenVal);
  console.log("decoded token is ", decodedToken);
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
  const accessRecord = await prismaClient.access.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!accessRecord || accessRecord.isBanned) {
    console.log("User is banned from this room");
    ws.close(4003, "You are banned from this room");
  }
  const socketId = uuid();
  const roomExists = socketByRoom.get(roomId);
  if (!roomExists) {
    socketByRoom.set(roomId, new Set([socketId]));
  } else {
    roomExists.add(socketId);
  }

  const existingConnection = socketByUserId.get(userId);
  if (existingConnection) {
    const oldUser = usersBySocket.get(existingConnection);

    if (oldUser) {
      const socketsInRoom = socketByRoom.get(oldUser.socketId);
      socketsInRoom?.delete(existingConnection);
      if (socketsInRoom && socketsInRoom.size === 0) {
        socketByRoom.delete(oldUser.roomId);
      }

      oldUser.ws.close(4001, "Logged in from another tab");
    }
    usersBySocket.delete(existingConnection);
    socketByUserId.delete(userId);
  }
  usersBySocket.set(socketId, {
    username: accessRecord?.user.username ?? "",
    userId,
    ws,
    socketId,
    roomId,
    access,
    isBanned: accessRecord?.isBanned ?? false,
  });
  socketByUserId.set(userId, socketId);
  if (accessRecord) {
    const userJoinBroadcast = {
      channel: "room_control" as const,
      operation: "is_online" as const,
      isBanned: accessRecord.isBanned ?? false,
      username: accessRecord.user.username ?? "",
      isOnline: true,
      userId: accessRecord.userId,
      role: accessRecord.role ?? "user",
    };
    // broadcast everyone that user has joined
    sendMessageToRoom(roomId, userJoinBroadcast, userId);
  }

  // send all the online user's info to this user
  const socketsInRoom = socketByRoom.get(roomId);
  const onlineUsersInRoom: string[] = [];
  socketsInRoom?.forEach((socket) => {
    const user = usersBySocket.get(socket);
    if (user) {
      onlineUsersInRoom.push(user.username);
      return;
    }
    return;
  });
  const initialMessage = {
    onlineUsers: onlineUsersInRoom,
    roomName: accessRecord?.room.name ?? "",
    channel: "room_control",
    operation: "initial",
  };
  const validateInitialMessage = InitialMessageSchema.safeParse(initialMessage);
  if (validateInitialMessage.error) {
    ws.close(4001, "Error validating initial message");
  }
  ws.send(JSON.stringify(validateInitialMessage.data));

  ws.on("message", async (msg: Buffer) => {
    try {
      const toParseMessage = msg.toString();
      const message = JSON.parse(toParseMessage);
      console.log("message is ", message);
      const validatedMessage = ClientMessageSchema.safeParse({
        ...message,
      });

      console.log("validated message data", validatedMessage);

      if (!validatedMessage.success) {
        console.log("Invalid message", validatedMessage.error);
        return;
      }

      if (validatedMessage.data.channel === "room_control") {
        if (validatedMessage.data.operation === "ban_user") {
          await handleBan(validatedMessage.data, socketId, roomId, userId);
        }
        if (validatedMessage.data.operation === "change_role") {
          await handleRoleChange(
            validatedMessage.data,
            socketId,
            roomId,
            userId
          );
        }
      }
      if (validatedMessage.data.channel === "canvas") {
        switch (validatedMessage.data.operation) {
          case "create":
            await handleCreate(validatedMessage.data, userId, roomId, socketId);
            break;
          case "update":
            await handleUpdate(validatedMessage.data, userId, roomId, socketId);
            break;
          case "delete":
            await handleDelete(validatedMessage.data, userId, roomId, socketId);
            break;
        }
      }
    } catch (err) {
      console.error("Error during recieving message", err);
    }
  });
  ws.on("close", () => {
    handleUserDisconnect(socketId, userId, roomId);
  });
});
function handleUserDisconnect(
  socketId: string,
  userId: string,
  roomId: string
) {
  // Get user info before cleanup
  const user = usersBySocket.get(socketId);
  if (!user) {
    // User already cleaned up or never fully connected
    console.log(
      "User not found in usersBySocket, skipping disconnect broadcast"
    );
    return;
  }

  // Check if there are other users in the room before broadcasting
  const socketsInRoom = socketByRoom.get(roomId);
  const hasOtherUsers = socketsInRoom && socketsInRoom.size > 1;

  // Broadcast disconnect only if there are other users in the room
  if (hasOtherUsers) {
    const userDisconnectBroadcast: z.infer<typeof ServerIsOnlineSchema> = {
      channel: "room_control",
      operation: "is_online",
      isBanned: user.isBanned,
      username: user.username,
      isOnline: false,
      role: user.access,
      userId: user.userId,
    };
    sendMessageToRoom(roomId, userDisconnectBroadcast, userId);
  }

  // Clean up resources
  socketByUserId.delete(userId);
  usersBySocket.delete(socketId);

  if (socketsInRoom) {
    socketsInRoom.delete(socketId);
    if (socketsInRoom.size === 0) {
      socketByRoom.delete(roomId);
    }
  }

  console.log(
    `User ${user.username} (${userId}) disconnected from room ${roomId}`
  );
}

function sendMessageToRoom(
  roomId: string,
  message: z.infer<typeof ServerMessageSchema>,
  userId: string,
  inclusive: boolean = false
) {
  const sockets = socketByRoom.get(roomId);
  console.log("messages to be sent to these sockets", sockets);
  if (!sockets) {
    console.log("no sockets found , returnign");
    return;
  }
  console.log("inclusive is ", inclusive);
  sockets.forEach((socketId) => {
    console.log("sending message to", usersBySocket.get(socketId)?.userId);
    const user = usersBySocket.get(socketId);
    console.log({ user });
    console.log("user sneding is", userId, " To send to is ", user?.userId);
    console.log("access", user?.access);
    if (user === undefined) {
      return;
    }
    const sameUser = user.userId === userId;
    if (inclusive || !sameUser) {
      if (sameUser) {
        console.log("Also sent to same user inclusive");
      }
      user.ws.send(JSON.stringify(message));
    }
  });
}
async function handleCreate(
  message: z.infer<typeof ClientCreateSchema>,
  userId: string,
  roomId: string,
  socketId: string
) {
  const { tempId, ...rest } = message;
  const messageForDB = DbContentSchema.parse(rest);
  const response = await prismaClient.content.create({
    data: {
      ...messageForDB,
      roomId: roomId,
      userId,
    },
  });
  const createMessageFormat = {
    ...message,
    userId,
    roomId: roomId,
    timestamp: Date.now(),
    tempId,
    id: response.id,
  };
  console.log("message validation before sending ", createMessageFormat);
  const validatedCreateMsg = ServerCreateSchema.safeParse(createMessageFormat);
  if (!validatedCreateMsg.success) {
    console.log("Error parsing message", validatedCreateMsg.error);
    return;
  }
  sendMessageToRoom(roomId, validatedCreateMsg.data, userId, true);

  console.log("response of db store");
  console.log({ response });
}
async function handleUpdate(
  message: z.infer<typeof ClientUpdateSchema>,
  userId: string,
  roomId: string,
  socketId: string
) {
  const content = await prismaClient.content.findFirst({
    where: {
      id: message.id,
      roomId: roomId,
    },
  });
  if (!content) {
    console.log("Content not found for given id in room");
    return;
  }
  const hasPermission =
    content.userId === userId ||
    (await checkUserPermission(socketId, roomId, ["admin", "moderator"]));
  if (!hasPermission) {
    console.log("User does not have permission to update content");
    return;
  }
  const updateMessageFormat = {
    ...message,
    userId: content.userId,
    roomId: roomId,
    timestamp: Date.now(),
  };
  const validatedUpdateMsg = ServerUpdateSchema.safeParse(updateMessageFormat);
  if (!validatedUpdateMsg.success) {
    console.log("Error parsing message", validatedUpdateMsg.error);
    return;
  }
  sendMessageToRoom(roomId, validatedUpdateMsg.data, userId);
  const messageForDB = DbContentSchema.parse(message);

  const response = await prismaClient.content.update({
    where: {
      id: message.id,
    },
    data: {
      ...messageForDB,
    },
  });
}
async function handleDelete(
  message: z.infer<typeof ClientDeleteSchema>,
  userId: string,
  roomId: string,
  socketId: string
) {
  const content = await prismaClient.content.findFirst({
    where: {
      id: message.id,
    },
  });
  if (!content) {
    console.log("Content to be deleted not found");
    return;
  }
  const hasPermission =
    content.userId === userId ||
    (await checkUserPermission(socketId, roomId, ["admin", "moderator"]));
  if (!hasPermission) {
    console.log("User does not have permission to update content");
    return;
  }

  const response = await prismaClient.content.delete({
    where: {
      id: message.id,
    },
  });
  if (!response) {
    console.log("Error deleting content");
    return;
  }
  const serverDeleteMsg = ServerDeleteSchema.parse({
    ...message,
    userId,
    roomId,
    timestamp: Date.now(),
  });

  sendMessageToRoom(roomId, serverDeleteMsg, userId);
}

const checkUserPermission = async (
  socketId: string,
  roomId: string,
  permissionArray: Role[]
) => {
  const user = usersBySocket.get(socketId);
  if (!user) {
    console.log("user not found", user);
    return false;
  }
  const roleInRoom = user.access;
  if (!roleInRoom) {
    console.log("role not found", user);

    return false;
  }
  console.log("user has role ", roleInRoom);
  return permissionArray.includes(roleInRoom);
};

const handleBan = async (
  message: z.infer<typeof ClientBanSchema>,
  socketId: string,
  roomId: string,
  userId: string
) => {
  const isAdmin = await checkUserPermission(socketId, roomId, ["admin"]);
  if (!isAdmin) {
    console.log("User does not have rights to ban someone");
    return;
  }
  const response = await prismaClient.access.update({
    where: {
      userId_roomId: {
        userId: message.targetUserId,
        roomId,
      },
    },
    data: { isBanned: message.ban },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!response) {
    console.log("Error updating value at DB level");
    return;
  }

  const formatBroadcast = { ...message, username: response.user.username };
  sendMessageToRoom(roomId, formatBroadcast, userId, true);
  const targetUserSocketId = socketByUserId.get(message.targetUserId);
  if (!targetUserSocketId) {
    console.log("User is currently not active");
    return;
  }
  const targetUser = usersBySocket.get(targetUserSocketId);
  if (!targetUser) {
    console.log("cannot find user by socket id");
    return;
  }
  targetUser.ws.close(4003, "You are banned");
};

const handleRoleChange = async (
  message: z.infer<typeof ClientChangeRoleSchema>,
  socketId: string,
  roomId: string,
  userId: string
) => {
  const isAdmin = await checkUserPermission(socketId, roomId, ["admin"]);
  if (!isAdmin) {
    console.log("User does not have rights to modify role of someone");
    return;
  }

  const response = await prismaClient.access.update({
    where: {
      userId_roomId: {
        userId: message.targetUserId,
        roomId,
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    data: { role: message.new_role },
  });
  if (!response) {
    console.log("Error updating value at DB level");
    return;
  }
  const formatBroadcast = { ...message, username: response.user.username };
  sendMessageToRoom(roomId, formatBroadcast, userId, true);
  const targetUserSocketId = socketByUserId.get(message.targetUserId);

  if (!targetUserSocketId) {
    console.log("User is currently not active");
    return;
  }
  const targetUser = usersBySocket.get(targetUserSocketId);
  if (!targetUser) {
    console.log("cannot find user by socket id");
    return;
  }

  targetUser.access = message.new_role;
  targetUser.ws.send(JSON.stringify(message));
  targetUser.ws.close(4003, "Roles changed please rejoin");
};
