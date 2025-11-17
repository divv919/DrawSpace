import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import JWT_SECRET from "@repo/backend-common/config";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const decoded = jwt.verify(req.cookies.authToken || "", JWT_SECRET);

  if (decoded) {
    req.userId = (decoded as JwtPayload).userId;
    next();
    return;
  }
  res.status(401).json({ success: false, message: "Unauthorized" });
  return;
};
export default authMiddleware;
