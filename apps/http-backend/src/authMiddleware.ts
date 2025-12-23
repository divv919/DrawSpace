import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";

    if (!req.headers.authorization) {
      console.log("No authorization header");
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const authHeader = req.headers.authorization.split(" ")[1];
    if (!authHeader) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const decoded = jwt.verify(authHeader, NEXTAUTH_SECRET);

    if (decoded) {
      req.userId = (decoded as JwtPayload).userId;
      next();
      return;
    }
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  } catch (err) {
    console.log("error in autmiddlewar", err);
    res.status(401).json({ success: false, message: "Server error" });
  }
};
export default authMiddleware;
