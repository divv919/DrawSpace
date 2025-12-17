import express from "express";
const app = express();
import jwt from "jsonwebtoken";
import "dotenv/config";
import authMiddleware from "./authMiddleware";
import JWT_SECRET from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  SignInSchema,
  UserSchema,
} from "@repo/common/schema";
import { prismaClient } from "@repo/db/client";
import { generateSlug } from "./lib/util";
import cors from "cors";
import cookieParser from "cookie-parser";
import { slugToRoom } from "./lib/db.helpers";
const PORT = 3002;
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,

    origin: "http://localhost:3000",
  })
);

console.log("Environment , ", process.env.NODE_ENV);

app.use((req, res, next) => {
  console.log("Body is : ", req.body);
  next();
});
app.post("/signup", async (req, res) => {
  const response = UserSchema.safeParse(req.body);
  console.log("response is ", response.error);
  if (!response.success) {
    res.status(422).json({ success: false, message: "Invalid input" });
    return;
  }

  const { email, password, username } = req.body;

  const alreadyExists = await prismaClient.user.count({ where: { email } });
  if (!!alreadyExists) {
    res.status(409).json({ success: false, message: "Email already in use" });
    return;
  }
  const userId = await prismaClient.user.create({
    data: {
      email,
      password,
      username,
    },
  });
  const token = jwt.sign({ userId: userId.id }, JWT_SECRET);
  res
    .status(200)
    .cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    })
    .json({
      success: true,
      message: "User created successfully",
      user: { email, username },
    });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const schemaCheck = SignInSchema.safeParse(req.body);
  if (!schemaCheck.success) {
    res.status(422).json({ success: false, message: "Invalid input" });
    return;
  }
  const userExists = await prismaClient.user.findFirst({ where: { email } });
  if (!userExists) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  if (userExists.password !== password) {
    res.status(401).json({ success: false, message: "Invalid password" });
    return;
  }
  const { id } = userExists;
  const token = jwt.sign({ userId: id }, JWT_SECRET);
  res
    .status(200)
    .cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    })
    .json({
      success: true,
      message: "Logged in successfully",

      user: {
        email: userExists.email,
        username: userExists.username,
      },
    });
});

app.post("/createRoom", authMiddleware, async (req, res) => {
  const schemaCheck = CreateRoomSchema.safeParse(req.body);
  console.log("is Schema correct : ", schemaCheck.success);

  if (!schemaCheck.success) {
    res.status(422).json({ success: false, message: "Invalid input" });
    return;
  }
  const { name, isProtected, password } = req.body;

  const slug = generateSlug(name);
  const adminId = req.userId;
  if (!adminId) {
    res.status(401).json({ success: false, message: "Token expired" });
    return;
  }
  try {
    const response = await prismaClient.room.create({
      data: {
        slug,
        isProtected,
        password,
        adminId,
        name,
      },
    });
    const responseAccess = await prismaClient.access.create({
      data: {
        userId: adminId,
        roomId: response.id,
        role: "admin",
      },
    });
    res.status(200).json({
      slug,
      message: "Room created successfully",
    });
  } catch (err) {
    console.log("Error creating room : ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/contents/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const room = await slugToRoom(slug);
    if (!room) {
      res.status(404).json({ success: false, message: "Room not found" });
      return;
    }
    const hasAccess = await prismaClient.access.findFirst({
      where: {
        roomId: room.id,
        userId: req.userId,
      },
    });
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this room",
      });
      return;
    }
    const response = await prismaClient.content.findMany({
      where: { roomId: room.id },
    });

    res.status(200).json({ messages: response, success: true });
  } catch (err) {
    console.log("Error getting contents : ", err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

app.post("/room/:slug", authMiddleware, async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    res.status(400).json({ message: "Slug is required", success: false });
    return;
  }
  let access;
  let userId;
  let username;
  try {
    const room = await slugToRoom(slug);
    if (!room) {
      res.status(404).json({ message: "Room not found", success: false });
      return;
    }

    const hasAccess = await prismaClient.access.findFirst({
      where: {
        roomId: room.id,
        userId: req.userId,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    console.log("req.userId : ", req.userId);
    console.log("hasAccess : ", hasAccess);
    if (!hasAccess) {
      console.log("No access found, checking if room is protected");
      if (room.isProtected) {
        console.log("Room is protected, checking if password is provided");
        if (!req.body.password) {
          console.log("No password provided, sending prompt_password");
          res.status(200).json({
            success: true,
            message: "Password is required",
            prompt_password: true,
          });
          return;
        }
        if (req.body.password !== room.password) {
          console.log("Invalid password, sending prompt_password");
          res.status(401).json({
            success: false,
            message: "Invalid password",
            prompt_password: true,
          });
          return;
        }
      }

      console.log("Room protected", room.isProtected);
      console.log("creating entry access for user");
      const response = await prismaClient.access.create({
        data: {
          userId: req.userId!,
          roomId: room.id,
          role: "user",
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });
      if (!response) {
        console.log("Error creating access, sending 500");
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
        return;
      }
      console.log("response after creating access is ", response);
      access = response.role;
      username = response.user.username;
      userId = response.id;
    } else {
      if (hasAccess.isBanned) {
        res.status(403).json({
          success: false,
          message: "Room not available",
        });
        return;
      }
      console.log("Access found, sending access");
      access = hasAccess.role;
      username = hasAccess.user.username;
    }

    const token = jwt.sign(
      { userId: req.userId, roomId: room.id, access: access },
      JWT_SECRET
    );
    const peopleInRoom = await prismaClient.access.findMany({
      where: {
        roomId: room.id,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    if (!peopleInRoom) {
      console.error("error fetching people info in room");
    }
    const roomUsers = peopleInRoom.map((ppl) => {
      return {
        userId: ppl.userId,
        username: ppl.user.username,
        role: ppl.role,
        isBanned: ppl.isBanned,
      };
    });
    console.log("to be sent to user ", {
      success: true,
      message: "Cookies set successfully",
      userInfo: {
        access: access,
        userId: req.userId,
        username,
      },
      roomUsers,
    });
    res
      .status(200)
      .cookie("roomToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      })
      .json({
        success: true,
        message: "Cookies set successfully",
        userInfo: {
          access: access,
          userId: req.userId,
          username,
        },
        roomUsers,
      });
  } catch (err) {
    console.error("Error getting room : ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
});
app.get("/getRooms", authMiddleware, async (req, res) => {
  try {
    const rooms = await prismaClient.access.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        room: {
          omit: {
            password: true,
          },
        },
      },
    });
    console.log("rooms for user are ", rooms);
    if (!rooms) {
      res.status(404).json({ message: "No rooms found", success: false });
      return;
    }
    const formattedRooms = rooms.map((room) => {
      return room.room;
    });
    res
      .status(200)
      .json({
        rooms: formattedRooms,
        success: true,
        message: "Rooms fetched successfully",
      });
  } catch (err) {
    console.log("Error getting all rooms : ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
});

app.post("/changeRoomPassword", authMiddleware, async (req, res) => {
  const { slug, password } = req.body;
  if (!slug || !password) {
    res
      .status(400)
      .json({ message: "Slug and password are required", success: false });
    return;
  }
  const room = await slugToRoom(slug);
  if (!room) {
    res.status(404).json({ message: "Room not found", success: false });
    return;
  }
  if (room.adminId !== req.userId) {
    res
      .status(403)
      .json({ message: "You are not the admin of this room", success: false });
    return;
  }
  try {
    const response = await prismaClient.room.update({
      where: { id: room.id },
      data: { password },
    });
    res
      .status(200)
      .json({ message: "Password changed successfully", success: true });
    return;
  } catch (err) {
    console.log("Error changing password : ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
});

app.listen(PORT, () => console.log("Http server listening at port " + PORT));
