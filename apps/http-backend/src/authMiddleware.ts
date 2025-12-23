import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";
    console.log("secret length", NEXTAUTH_SECRET.length);
    console.log("headers : ", req.headers);
    console.log("cookies: ", req.cookies);
    const decoded = await getToken({
      req: {
        headers: req.headers,
        cookies: req.cookies,
      } as any,
      secret: NEXTAUTH_SECRET,
    });
    console.log("decoded", decoded);
    if (decoded) {
      console.log("decoded", decoded);
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
