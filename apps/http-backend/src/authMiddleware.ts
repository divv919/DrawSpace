import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import JWT_SECRET from "@repo/backend-common/config";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Headers are : " + req.headers["authorization"]);

  const decoded = jwt.verify(
    req.headers["authorization"]?.split(" ")[1] || "",
    JWT_SECRET
  );
  console.log("Is decoded : ", !!decoded, " Decode value : ", decoded);

  if (decoded) {
    req.userId = (decoded as JwtPayload).userId;
    next();
    return;
  }
};
export default authMiddleware;
